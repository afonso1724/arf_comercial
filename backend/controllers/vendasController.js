import supabase from '../db.js';
import { criarNotificacao } from './notificacoesController.js';

function agruparVendas(rows) {
    if (!rows || rows.length === 0) return [];
    const map = new Map();
    rows.forEach(r => {
        if (!map.has(r.id)) {
            map.set(r.id, {
                id: r.id,
                cliente: r.cliente,
                data_venda: r.data_venda,
                status: r.status,
                total: r.total,
                itens: []
            });
        }
        if (r.produto_id) {
            map.get(r.id).itens.push({
                produto_id: r.produto_id,
                produto: r.produto,
                quantidade: r.quantidade,
                preco_unitario: r.preco_unitario
            });
        }
    });
    return Array.from(map.values());
}

function flattenVendas(vendas = []) {
    const rows = [];
    vendas.forEach((venda) => {
        const itens = venda.itens_venda || [];
        if (itens.length === 0) {
            rows.push({
                id: venda.id,
                cliente: venda.clientes?.nome || null,
                data_venda: venda.data_venda,
                status: venda.status,
                total: venda.total,
                produto_id: null,
                quantidade: null,
                preco_unitario: null,
                produto: null
            });
            return;
        }

        itens.forEach((item) => {
            rows.push({
                id: venda.id,
                cliente: venda.clientes?.nome || null,
                data_venda: venda.data_venda,
                status: venda.status,
                total: venda.total,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                produto: item.produtos?.nome || null
            });
        });
    });

    return agruparVendas(rows);
}

export async function getAllVendas(req, res) {
    try {
        const { data, error } = await supabase
            .from('vendas')
            .select(`
                id,
                data_venda,
                status,
                total,
                clientes ( nome ),
                itens_venda (
                    produto_id,
                    quantidade,
                    preco_unitario,
                    produtos ( nome )
                )
            `)
            .order('id', { ascending: false });

        if (error) {
            console.error('Erro getAllVendas:', error);
            return res.status(500).json({ message: 'Erro ao buscar vendas', error: error.message });
        }

        return res.json(flattenVendas(data));
    } catch (e) {
        console.error('Erro getAllVendas:', e);
        return res.status(500).json({ message: 'Erro ao processar vendas' });
    }
}

export async function getVendasByCliente(req, res) {
    const clienteId = req.params.id;
    try {
        const { data, error } = await supabase
            .from('vendas')
            .select(`
                id,
                data_venda,
                status,
                total,
                itens_venda (
                    produto_id,
                    quantidade,
                    preco_unitario,
                    produtos ( nome )
                )
            `)
            .eq('cliente_id', clienteId)
            .order('id', { ascending: false });

        if (error) {
            console.error('Erro getVendasByCliente:', error);
            return res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
        }

        const rows = (data || []).flatMap((venda) => {
            const itens = venda.itens_venda || [];
            if (itens.length === 0) {
                return [{
                    id: venda.id,
                    data_venda: venda.data_venda,
                    status: venda.status,
                    total: venda.total,
                    produto_id: null,
                    quantidade: null,
                    preco_unitario: null,
                    produto: null
                }];
            }
            return itens.map((item) => ({
                id: venda.id,
                data_venda: venda.data_venda,
                status: venda.status,
                total: venda.total,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                produto: item.produtos?.nome || null
            }));
        });

        return res.json(agruparVendas(rows));
    } catch (e) {
        console.error('Erro getVendasByCliente:', e);
        return res.status(500).json({ message: 'Erro ao processar pedidos' });
    }
}

export async function validateVenda(req, res) {
    const vendaId = req.params.id;

    try {
        const { data: itens, error: itensError } = await supabase
            .from('itens_venda')
            .select('produto_id, quantidade')
            .eq('venda_id', vendaId);

        if (itensError) {
            console.error('Erro ao buscar itens:', itensError);
            return res.status(500).json({ message: 'Erro ao buscar itens' });
        }

        if (!itens || itens.length === 0) {
            return res.status(400).json({ message: 'Nenhum item encontrado' });
        }

        const produtoIds = [...new Set(itens.map((item) => item.produto_id))];
        const { data: produtos, error: produtosError } = await supabase
            .from('produtos')
            .select('id, quantidade')
            .in('id', produtoIds);

        if (produtosError) {
            console.error('Erro ao validar estoque:', produtosError);
            return res.status(500).json({ message: 'Erro ao validar estoque' });
        }

        const estoqueMap = new Map((produtos || []).map((p) => [String(p.id), Number(p.quantidade)]));
        for (const item of itens) {
            const disponivel = estoqueMap.get(String(item.produto_id));
            if (disponivel === undefined) {
                return res.status(400).json({ message: 'Produto não encontrado' });
            }
            if (disponivel < Number(item.quantidade)) {
                return res.status(400).json({ message: `Estoque insuficiente para: ${item.produto_id}` });
            }
        }

        const updates = itens.map(async (item) => {
            const id = String(item.produto_id);
            const novoEstoque = estoqueMap.get(id) - Number(item.quantidade);
            estoqueMap.set(id, novoEstoque);

            const { error } = await supabase
                .from('produtos')
                .update({ quantidade: novoEstoque })
                .eq('id', item.produto_id);
            if (error) throw error;
        });

        await Promise.all(updates);

        const adminId = req.userId;
        const { error: vendaUpdateError } = await supabase
            .from('vendas')
            .update({ status: 'validado', admin_validacao_id: adminId })
            .eq('id', vendaId);

        if (vendaUpdateError) {
            console.error('Erro ao atualizar venda:', vendaUpdateError);
            return res.status(500).json({ message: 'Erro ao validar venda' });
        }

        const { data: vendaData } = await supabase
            .from('vendas')
            .select('cliente_id')
            .eq('id', vendaId)
            .single();

        if (vendaData?.cliente_id) {
            await criarNotificacao('validacao_cliente', `Sua venda #${vendaId} foi validada.`, adminId, vendaData.cliente_id, vendaId);
            await criarNotificacao('validacao_admin', `Venda #${vendaId} foi validada.`, adminId, null, vendaId);
        }

        return res.json({ message: 'Venda validada com sucesso' });
    } catch (error) {
        console.error('Erro validateVenda:', error);
        return res.status(500).json({ message: 'Erro ao validar venda' });
    }
}

export async function createVenda(req, res) {
    const { cliente_id, itens } = req.body;

    if (!cliente_id || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ message: 'Dados inválidos' });
    }

    try {
        const produtoIds = [...new Set(itens.map((item) => item.produto_id))];
        const { data: produtos, error: produtosError } = await supabase
            .from('produtos')
            .select('id, preco_venda')
            .in('id', produtoIds);

        if (produtosError) {
            console.error('Erro ao buscar preços:', produtosError);
            return res.status(500).json({ message: 'Erro ao buscar produtos' });
        }

        const precoMap = new Map((produtos || []).map((p) => [String(p.id), Number(p.preco_venda)]));
        let total = 0;
        for (const item of itens) {
            const preco = precoMap.get(String(item.produto_id));
            if (preco === undefined) {
                return res.status(400).json({ message: `Produto não encontrado: ${item.produto_id}` });
            }
            total += preco * Number(item.quantidade);
        }

        const { data: venda, error: vendaError } = await supabase
            .from('vendas')
            .insert([{ cliente_id, status: 'pendente', total }])
            .select('id')
            .single();

        if (vendaError || !venda) {
            console.error('Erro ao criar venda:', vendaError);
            return res.status(500).json({ message: 'Erro ao criar venda', error: vendaError?.message });
        }

        const itensPayload = itens.map((item) => ({
            venda_id: venda.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario ?? precoMap.get(String(item.produto_id)) ?? 0
        }));

        const { error: itensError } = await supabase.from('itens_venda').insert(itensPayload);
        if (itensError) {
            console.error('Erro ao inserir itens:', itensError);
            await supabase.from('vendas').delete().eq('id', venda.id);
            return res.status(500).json({ message: 'Erro ao inserir itens', error: itensError.message });
        }

        await criarNotificacao('pendente_admin', `Nova venda #${venda.id} aguardando validação`, null, null, venda.id);
        await criarNotificacao('pendente_cliente', `Sua venda #${venda.id} foi criada e está pendente.`, null, cliente_id, venda.id);

        return res.json({ message: 'Venda criada com sucesso', id: venda.id, total });
    } catch (error) {
        console.error('Erro createVenda:', error);
        return res.status(500).json({ message: 'Erro ao criar venda' });
    }
}
