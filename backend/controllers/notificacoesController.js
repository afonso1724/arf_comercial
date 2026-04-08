import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar notificação
export async function criarNotificacao(tipo, descricao, admin_id = null, cliente_id = null, venda_id = null) {
    const { error } = await supabase
        .from('notificacoes')
        .insert([{ tipo, descricao, admin_id, cliente_id, venda_id }]);

    if (error) {
        console.error('Erro ao criar notificação:', error);
    }
}

// GET notificações do cliente
export async function getNotificacoesCliente(req, res) {
    const clienteId = req.params.id;
    try {
        const { data: notificacoes, error } = await supabase
            .from('notificacoes')
            .select('id, tipo, descricao, cliente_id, venda_id, criada_em, lida')
            .eq('cliente_id', clienteId)
            .in('tipo', ['pendente_cliente', 'validacao_cliente'])
            .order('criada_em', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Erro ao buscar notificações:', error);
            return res.status(500).json({ message: 'Erro ao buscar notificações' });
        }

        const vendaIds = [...new Set((notificacoes || []).map((n) => n.venda_id).filter(Boolean))];
        let vendaMap = new Map();

        if (vendaIds.length > 0) {
            const { data: vendas } = await supabase
                .from('vendas')
                .select('id, data_venda')
                .in('id', vendaIds);
            vendaMap = new Map((vendas || []).map((v) => [v.id, v]));
        }

        const payload = (notificacoes || []).map((n) => ({
            ...n,
            data_venda: vendaMap.get(n.venda_id)?.data_venda || null
        }));

        return res.json(payload);
    } catch (err) {
        console.error('Erro getNotificacoesCliente:', err);
        return res.status(500).json({ message: 'Erro ao buscar notificações' });
    }
}

// GET notificações do admin
export async function getNotificacoesAdmin(req, res) {
    try {
        const { data: notificacoes, error } = await supabase
            .from('notificacoes')
            .select('id, tipo, descricao, admin_id, cliente_id, venda_id, criada_em, lida')
            .in('tipo', ['pendente_admin', 'validacao_admin'])
            .order('criada_em', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Erro ao buscar notificações:', error);
            return res.status(500).json({ message: 'Erro ao buscar notificações' });
        }

        const clienteIds = [...new Set((notificacoes || []).map((n) => n.cliente_id).filter(Boolean))];
        const vendaIds = [...new Set((notificacoes || []).map((n) => n.venda_id).filter(Boolean))];
        const adminIds = [...new Set((notificacoes || []).map((n) => n.admin_id).filter(Boolean))];

        const [clientesResult, vendasResult, adminsResult] = await Promise.all([
            clienteIds.length ? supabase.from('clientes').select('id, nome').in('id', clienteIds) : Promise.resolve({ data: [] }),
            vendaIds.length ? supabase.from('vendas').select('id, status, total, data_venda').in('id', vendaIds) : Promise.resolve({ data: [] }),
            adminIds.length ? supabase.from('usuarios').select('id, nome').in('id', adminIds) : Promise.resolve({ data: [] })
        ]);

        const clienteMap = new Map((clientesResult.data || []).map((c) => [c.id, c.nome]));
        const vendaMap = new Map((vendasResult.data || []).map((v) => [v.id, v]));
        const adminMap = new Map((adminsResult.data || []).map((a) => [a.id, a.nome]));

        const payload = (notificacoes || []).map((n) => ({
            ...n,
            cliente_nome: clienteMap.get(n.cliente_id) || null,
            venda_status: vendaMap.get(n.venda_id)?.status || null,
            total: vendaMap.get(n.venda_id)?.total || null,
            data_venda: vendaMap.get(n.venda_id)?.data_venda || null,
            admin_nome: adminMap.get(n.admin_id) || null
        }));

        return res.json(payload);
    } catch (err) {
        console.error('Erro getNotificacoesAdmin:', err);
        return res.status(500).json({ message: 'Erro ao buscar notificações' });
    }
}

// Gerar fatura em PDF
export async function gerarFatura(req, res) {
    const vendaId = req.params.id;
    try {
        const { data: venda, error: vendaError } = await supabase
            .from('vendas')
            .select('id, data_venda, total, status, admin_validacao_id, cliente_id')
            .eq('id', vendaId)
            .single();

        if (vendaError || !venda) {
            console.error('Erro ao buscar venda:', vendaError);
            return res.status(400).json({ message: 'Venda não encontrada' });
        }

        const [clienteResult, adminResult, itensResult] = await Promise.all([
            supabase.from('clientes').select('nome, email').eq('id', venda.cliente_id).single(),
            venda.admin_validacao_id
                ? supabase.from('usuarios').select('nome').eq('id', venda.admin_validacao_id).single()
                : Promise.resolve({ data: null }),
            supabase
                .from('itens_venda')
                .select('quantidade, preco_unitario, produtos(nome)')
                .eq('venda_id', vendaId)
        ]);

        const vendaPayload = {
            ...venda,
            cliente_nome: clienteResult.data?.nome || '-',
            cliente_email: clienteResult.data?.email || '-',
            admin_nome: adminResult.data?.nome || null,
            itens_detalhes: itensResult.data || []
        };

        // Criar PDF
        const doc = new PDFDocument();
        const fileName = `fatura_${vendaId}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../uploads', fileName);
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);
        
        // Cabeçalho refinado
        // Logo/empresa à esquerda (se existir)
        const logoPath = path.join(__dirname, '../public/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 40, { width: 80 });
        }
        doc.fontSize(16).font('Helvetica-Bold').text('A.R.F Comercial', 140, 50);
        // Informação fiscal/emitente à direita
        const dataVendaObj = new Date(vendaPayload.data_venda);
        const dataStr = dataVendaObj.toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric' });
        const horaStr = dataVendaObj.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' });
        const NIF = '123456789'; // substituir com NIF real
        doc.fontSize(10).font('Helvetica').text(`Data: ${dataStr}`, 400, 50, { align: 'right' });
        doc.text(`Hora: ${horaStr}`, { align: 'right' });
        doc.text(`NIF: ${NIF}`, { align: 'right' });
        doc.text(`Emitido por: ${vendaPayload.admin_nome || 'Admin'}`, { align: 'right' });
        doc.moveDown(2);
        
        // Linha separadora
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
        
        // Cliente
        doc.fontSize(11).font('Helvetica-Bold').text('CLIENTE:', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Nome: ${vendaPayload.cliente_nome}`);
        doc.text(`Email: ${vendaPayload.cliente_email}`);
        doc.moveDown(1);
        
        // Itens (tabela)
        doc.fontSize(11).font('Helvetica-Bold').text('ITENS', { align: 'left' });
        doc.moveDown(0.5);
        // cabeçalho de tabela
        const startY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Produto', 50, startY);
        doc.text('Qtd', 250, startY, { width: 50, align: 'right' });
        doc.text('Preço', 300, startY, { width: 100, align: 'right' });
        doc.text('Subtotal', 420, startY, { width: 100, align: 'right' });
        doc.moveTo(50, startY + 12).lineTo(550, startY + 12).stroke();
        doc.moveDown(1);
        doc.font('Helvetica').fontSize(9);
        if (vendaPayload.itens_detalhes.length > 0) {
            vendaPayload.itens_detalhes.forEach((item) => {
                const nome = item.produtos?.nome || '-';
                const qty = parseInt(item.quantidade, 10);
                const preco = parseFloat(item.preco_unitario);
                const subtotal = qty * preco;
                const y = doc.y;
                doc.text(nome, 50, y);
                doc.text(qty.toString(), 250, y, { width: 50, align: 'right' });
                doc.text(preco.toFixed(2)+' Kz', 300, y, { width: 100, align: 'right' });
                doc.text(subtotal.toFixed(2)+' Kz', 420, y, { width: 100, align: 'right' });
                doc.moveDown(0.8);
            });
        }
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        
        // Total
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(11).text(`TOTAL: ${parseFloat(vendaPayload.total).toFixed(2)} Kz`, 400, doc.y, { align: 'right' });
        doc.moveDown(2);
        
        // Admin
        if (vendaPayload.admin_nome) {
            doc.fontSize(9).font('Helvetica').text(`Validado por: ${vendaPayload.admin_nome}`);
        }
        
        doc.end();
        
        stream.on('finish', () => {
            // Salvar referência no banco
            supabase.from('vendas').update({ fatura_url: fileName }).eq('id', vendaId)
                .then(({ error }) => {
                    if (error) console.error('Erro ao atualizar URL fatura:', error);
                });
            
            res.json({ message: 'Fatura gerada com sucesso', url: `/uploads/${fileName}` });
        });
        
        stream.on('error', (err) => {
            console.error('Erro ao criar PDF:', err);
            res.status(500).json({ message: 'Erro ao gerar fatura' });
        });
    } catch (err) {
        console.error('Erro ao gerar fatura:', err);
        return res.status(500).json({ message: 'Erro ao gerar fatura' });
    }
}

// Download fatura
export async function downloadFatura(req, res) {
    const vendaId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('vendas')
            .select('fatura_url')
            .eq('id', vendaId)
            .single();

        if (error || !data?.fatura_url) {
            return res.status(400).json({ message: 'Fatura não encontrada' });
        }

        const fileName = data.fatura_url;
        const filePath = path.join(__dirname, '../uploads', fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ message: 'Arquivo de fatura não encontrado' });
        }

        return res.download(filePath, `fatura_${vendaId}.pdf`);
    } catch (err) {
        console.error('Erro downloadFatura:', err);
        return res.status(500).json({ message: 'Erro ao baixar fatura' });
    }
}

// Atualizar notificação como lida
export async function marcarNotificacaoComoLida(req, res) {
    const notificacaoId = req.params.id;
    try {
        const { error } = await supabase
            .from('notificacoes')
            .update({ lida: true })
            .eq('id', notificacaoId);

        if (error) {
            console.error('Erro ao marcar notificação:', error);
            return res.status(500).json({ message: 'Erro ao marcar notificação' });
        }

        return res.json({ message: 'Notificação marcada como lida' });
    } catch (err) {
        console.error('Erro marcarNotificacaoComoLida:', err);
        return res.status(500).json({ message: 'Erro ao marcar notificação' });
    }
}
