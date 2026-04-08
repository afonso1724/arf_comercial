import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import supabase from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPeriodo(tipo, dataStr) {
    const data = dataStr ? new Date(dataStr) : new Date();
    let start, end;
    switch (tipo) {
        case 'diario':
            start = new Date(data);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(end.getDate() + 1);
            break;
        case 'semanal':
            // semana iniciando domingo
            start = new Date(data);
            const wday = start.getDay();
            start.setDate(start.getDate() - wday);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(end.getDate() + 7);
            break;
        case 'mensal':
            start = new Date(data.getFullYear(), data.getMonth(), 1);
            end = new Date(data.getFullYear(), data.getMonth() + 1, 1);
            break;
        default:
            return null;
    }
    return { start, end };
}

async function buildReportData(start, end) {
    const [{ data: vendas, error: vendasError }, { data: entradas, error: entradasError }, { data: produtosCriados, error: produtosCriadosError }] = await Promise.all([
        supabase.from('vendas').select('id, total').gte('data_venda', start.toISOString()).lt('data_venda', end.toISOString()),
        supabase.from('produtos').select('quantidade').gte('criado_em', start.toISOString()).lt('criado_em', end.toISOString()),
        supabase
            .from('produtos')
            .select('id, nome, categoria, quantidade, preco_venda, criado_em')
            .gte('criado_em', start.toISOString())
            .lt('criado_em', end.toISOString())
            .order('criado_em', { ascending: false })
    ]);

    if (vendasError) throw vendasError;
    if (entradasError) throw entradasError;
    if (produtosCriadosError) throw produtosCriadosError;

    const total_vendas = (vendas || []).reduce((sum, v) => sum + Number(v.total || 0), 0);
    const total_entradas = (entradas || []).reduce((sum, p) => sum + Number(p.quantidade || 0), 0);
    const vendaIds = (vendas || []).map((v) => v.id);

    let produtos_mais_vendidos = [];
    if (vendaIds.length > 0) {
        const { data: itens, error: itensError } = await supabase
            .from('itens_venda')
            .select('produto_id, quantidade, preco_unitario, venda_id')
            .in('venda_id', vendaIds);

        if (itensError) throw itensError;

        const produtoIds = [...new Set((itens || []).map((i) => i.produto_id))];
        const { data: produtos, error: produtosError } = produtoIds.length
            ? await supabase.from('produtos').select('id, nome, categoria').in('id', produtoIds)
            : { data: [], error: null };

        if (produtosError) throw produtosError;

        const produtoMap = new Map((produtos || []).map((p) => [p.id, p]));
        const agg = new Map();

        (itens || []).forEach((item) => {
            const key = item.produto_id;
            const base = agg.get(key) || { total_quant: 0, total_valor: 0 };
            base.total_quant += Number(item.quantidade || 0);
            base.total_valor += Number(item.quantidade || 0) * Number(item.preco_unitario || 0);
            agg.set(key, base);
        });

        produtos_mais_vendidos = [...agg.entries()]
            .map(([produtoId, stats]) => ({
                id: produtoId,
                nome: produtoMap.get(produtoId)?.nome || 'Produto removido',
                categoria: produtoMap.get(produtoId)?.categoria || null,
                total_quant: stats.total_quant,
                total_valor: stats.total_valor
            }))
            .sort((a, b) => b.total_quant - a.total_quant)
            .slice(0, 10);
    }

    return {
        total_vendas,
        total_entradas,
        produtos_mais_vendidos,
        produtos_criados: produtosCriados || []
    };
}

export async function obterRelatorio(req, res) {
    const tipo = req.query.tipo;
    const dataStr = req.query.data;

    const periodo = getPeriodo(tipo, dataStr);
    if (!periodo) return res.status(400).json({ message: 'Tipo de relatório inválido' });

    const { start, end } = periodo;

    try {
        const data = await buildReportData(start, end);
        return res.json({ tipo, start, end, ...data });
    } catch (err) {
        console.error('Erro obterRelatorio', err);
        return res.status(500).json({ message: 'Erro ao calcular relatório' });
    }
}

export async function gerarPdf(req, res) {
    const tipo = req.query.tipo;
    const dataStr = req.query.data;
    const userId = req.userId;
    const periodo = getPeriodo(tipo, dataStr);
    if (!periodo) return res.status(400).json({ message: 'Tipo de relatório inválido' });
    const { start, end } = periodo;

    try {
        const [{ data: user, error: errUser }, reportData] = await Promise.all([
            supabase.from('usuarios').select('nome').eq('id', userId).single(),
            buildReportData(start, end)
        ]);

        if (errUser) {
            console.error('Erro ao buscar usuário', errUser);
            return res.status(500).json({ message: 'Erro ao gerar PDF' });
        }

        const nomeAdmin = user?.nome || 'Admin';
        const vr = [{ total_vendas: reportData.total_vendas }];
        const er = [{ total_entradas: reportData.total_entradas }];
        const pmv = reportData.produtos_mais_vendidos || [];

        try {
                        const doc = new PDFDocument({ size: 'A4', margin: 50 });
                        const fileName = `relatorio_${tipo}_${Date.now()}.pdf`;
                        const filePath = path.join(__dirname, '../uploads', fileName);
                        const stream = fs.createWriteStream(filePath);

                        doc.on('error', (e) => {
                            console.error('Erro no documento PDF', e);
                            if (!res.headersSent) {
                                res.status(500).json({ message: 'Erro ao gerar PDF' });
                            }
                        });

                        stream.on('error', (e) => {
                            console.error('Erro na escrita do ficheiro', e);
                            if (!res.headersSent) {
                                res.status(500).json({ message: 'Erro ao gerar PDF' });
                            }
                        });

                        doc.pipe(stream);

                        // cabeçalho
                        doc.fontSize(24).font('Helvetica-Bold').text('A.R.F COMERCIAL', { align: 'center' });
                        doc.moveDown(0.3);
                        doc.fontSize(14).font('Helvetica').text('Relatório de Vendas e Entradas', { align: 'center' });
                        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                        doc.moveDown(0.8);

                        // informações do período
                        const startStr = start.toLocaleDateString('pt-PT');
                        const endStr = new Date(end.getTime() - 1).toLocaleDateString('pt-PT');
                        doc.fontSize(11).font('Helvetica');
                        doc.text(`Período: ${startStr} até ${endStr}`);
                        doc.text(`Tipo de Relatório: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
                        doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`);
                        doc.moveDown(1);

                        // resumo em dois boxes
                        const boxWidth = 230;
                        const boxHeight = 60;
                        const boxY = doc.y;

                        // box 1: total vendas
                        doc.rect(50, boxY, boxWidth, boxHeight).stroke();
                        doc.fontSize(10).font('Helvetica-Bold').text('TOTAL DE VENDAS', 60, boxY + 8, { width: boxWidth - 20 });
                        doc.fontSize(16).font('Helvetica-Bold').text(`${Number(vr[0].total_vendas).toLocaleString('pt-PT')} Kz`, 60, boxY + 25, { width: boxWidth - 20 });

                        // box 2: total entradas
                        doc.rect(310, boxY, boxWidth, boxHeight).stroke();
                        doc.fontSize(10).font('Helvetica-Bold').text('TOTAL DE ENTRADAS', 320, boxY + 8, { width: boxWidth - 20 });
                        doc.fontSize(16).font('Helvetica-Bold').text(`${Number(er[0].total_entradas).toLocaleString('pt-PT')} unid.`, 320, boxY + 25, { width: boxWidth - 20 });

                        doc.moveDown(4);

                        // produtos mais vendidos com tabela
                        if (pmv.length > 0) {
                            doc.fontSize(13).font('Helvetica-Bold').text('PRODUTOS MAIS VENDIDOS', { underline: true });
                            doc.moveDown(0.5);

                            const tableTop = doc.y;
                            const col1 = 50, col2 = 240, col3 = 380, col4 = 480;
                            const rowHeight = 22;
                            const tableWidth = 500;

                            // cabeçalho da tabela
                            doc.rect(col1, tableTop, tableWidth, rowHeight).fill('#f0f0f0').stroke();
                            doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
                            doc.text('Produto', col1 + 5, tableTop + 6, { width: 185, height: rowHeight });
                            doc.text('Categoria', col2 + 5, tableTop + 6, { width: 135, height: rowHeight });
                            doc.text('Qtd', col3 + 5, tableTop + 6, { width: 90, align: 'center' });
                            doc.text('Valor Total', col4 + 5, tableTop + 6, { width: 60, align: 'right' });

                            let yPosition = tableTop + rowHeight;
                            doc.fontSize(8).font('Helvetica');

                            pmv.forEach((p, i) => {
                                if (i % 2 === 0) {
                                    doc.rect(col1, yPosition, tableWidth, rowHeight).fill('#fafafa').stroke();
                                } else {
                                    doc.rect(col1, yPosition, tableWidth, rowHeight).stroke();
                                }

                                doc.fillColor('#000000');
                                const nome = p.nome.substring(0, 25);
                                const categoria = p.categoria || '-';
                                doc.text(nome, col1 + 5, yPosition + 6, { width: 185, height: rowHeight, ellipsis: true });
                                doc.text(categoria, col2 + 5, yPosition + 6, { width: 135, height: rowHeight });
                                doc.text(String(p.total_quant), col3 + 5, yPosition + 6, { width: 90, align: 'center' });
                                doc.text(`${Number(p.total_valor).toLocaleString('pt-PT')} Kz`, col4 + 5, yPosition + 6, { width: 60, align: 'right' });

                                yPosition += rowHeight;
                            });

                            doc.moveDown(pmv.length + 1);
                        }

                        // rodapé com nome do admin e data
                        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                        doc.moveDown(0.3);
                        doc.fontSize(9).font('Helvetica');
                        doc.text(`Gerado por: ${nomeAdmin}`, 50);
                        doc.text(`Data e Hora: ${new Date().toLocaleString('pt-PT')}`, 50);

                        doc.end();

                        // Quando o ficheiro está pronto, enviar
                        stream.on('finish', () => {
                            res.setHeader('Content-Type', 'application/pdf');
                            res.setHeader('Content-Disposition', `attachment; filename="relatorio_${tipo}.pdf"`);
                            res.sendFile(filePath, (err) => {
                                if (err) {
                                    console.error('Erro ao enviar ficheiro', err);
                                }
                                // Limpar ficheiro após envio
                                fs.unlink(filePath, (err) => {
                                    if (err) console.error('Erro ao deletar ficheiro temporário', err);
                                });
                            });
                        });
        } catch (e) {
            console.error('Erro ao gerar PDF', e);
            return res.status(500).json({ message: 'Erro ao gerar PDF' });
        }
    } catch (err) {
        console.error('Erro gerarPdf', err);
        return res.status(500).json({ message: 'Erro ao gerar PDF' });
    }
}
