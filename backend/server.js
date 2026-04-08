import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import supabase from './db.js';

import { verifyJWT, SECRET_KEY } from './middlewares/auth.js';
import vendasRoutes from './routes/vendas.js';
import notificacoesRoutes from './routes/notificacoes.js';
import relatoriosRoutes from './routes/relatorios.js';

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'x-access-token'] }));
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, senha')
      .eq('email', email)
      .single();

    if (error || !user || user.senha !== password) {
      return res.status(401).json({ auth: false, message: 'E-mail ou senha incorretos!' });
    }

    const token = jwt.sign({ id: user.id, role: 'admin' }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ auth: true, token, id: user.id, nome: user.nome });
  } catch (err) {
    console.error('Erro /api/login', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/cliente/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('id, nome, senha')
      .eq('email', email)
      .single();

    if (error || !cliente || cliente.senha !== senha) {
      return res.status(401).json({ auth: false, message: 'Dados inválidos' });
    }

    const token = jwt.sign({ id: cliente.id, role: 'client' }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token, nome: cliente.nome, id: cliente.id });
  } catch (err) {
    console.error('Erro /api/cliente/login', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/vendas', verifyJWT, async (req, res) => {
  try {
    const { cliente_id, total, status = 'pendente', itens = [] } = req.body;

    if (!cliente_id || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'cliente_id e itens são obrigatórios' });
    }

    const { data: venda, error: errVenda } = await supabase
      .from('vendas')
      .insert([{ cliente_id, total, status, criado_por: req.userId }])
      .select('id')
      .single();

    if (errVenda || !venda) {
      console.error('Erro criar venda:', errVenda);
      return res.status(500).json({ error: 'Erro ao criar venda' });
    }

    const itensPayload = itens.map((item) => ({
      venda_id: venda.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario
    }));

    const { data: itensInseridos, error: errItens } = await supabase
      .from('itens_venda')
      .insert(itensPayload);

    if (errItens) {
      console.error('Erro inserir itens da venda:', errItens);
      return res.status(500).json({ error: 'Erro ao inserir itens da venda' });
    }

    res.json({ message: 'Venda cadastrada com sucesso', vendaId: venda.id, itens: itensInseridos });
  } catch (err) {
    console.error('Erro /api/vendas', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/api/perfil', verifyJWT, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('nome, email, telefone, data_nasc, foto_url')
      .eq('id', req.userId)
      .single();

    if (error) return res.status(500).json({ error: 'Erro ao buscar perfil' });
    res.json(data);
  } catch (err) {
    console.error('Erro /api/perfil', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/perfil/foto', verifyJWT, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Nenhum ficheiro enviado.');
    const urlFoto = `http://localhost:3001/uploads/${req.file.filename}`;

    const { error } = await supabase
      .from('usuarios')
      .update({ foto_url: urlFoto })
      .eq('id', req.userId);

    if (error) return res.status(500).json({ error: 'Erro salvar foto' });
    res.json({ foto_url: urlFoto });
  } catch (err) {
    console.error('Erro /api/perfil/foto', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.put('/api/perfil/update', verifyJWT, async (req, res) => {
  try {
    const { nome, email } = req.body;
    if (!nome || !email) return res.status(400).json({ message: 'Nome e email são obrigatórios' });

    const { error } = await supabase
      .from('usuarios')
      .update({ nome, email })
      .eq('id', req.userId);

    if (error) return res.status(500).json({ message: 'Erro ao atualizar perfil' });

    const { data, error: errorRead } = await supabase
      .from('usuarios')
      .select('id, nome, email, telefone, data_nasc, foto_url')
      .eq('id', req.userId)
      .single();

    if (errorRead) return res.status(500).json({ message: 'Erro ao recuperar dados' });
    res.json(data);
  } catch (err) {
    console.error('Erro /api/perfil/update', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

app.put('/api/perfil/password', verifyJWT, async (req, res) => {
  try {
    const { senhaAtual, senhaNova } = req.body;
    if (!senhaAtual || !senhaNova) return res.status(400).json({ message: 'Senha atual e nova são obrigatórias' });
    if (senhaNova.length < 6) return res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });

    const { data: user, error: errUser } = await supabase
      .from('usuarios')
      .select('senha')
      .eq('id', req.userId)
      .single();

    if (errUser || !user) return res.status(404).json({ message: 'Utilizador não encontrado' });
    if (user.senha !== senhaAtual) return res.status(401).json({ message: 'Senha atual incorreta' });

    const { error: errUpdate } = await supabase
      .from('usuarios')
      .update({ senha: senhaNova })
      .eq('id', req.userId);

    if (errUpdate) return res.status(500).json({ message: 'Erro ao atualizar senha' });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro /api/perfil/password', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

app.get('/api/produtos', verifyJWT, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) return res.status(500).json(error);
    res.json(data);
  } catch (err) {
    console.error('Erro /api/produtos', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/produtos', verifyJWT, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, categoria, quantidade, preco_venda, preco_custo, descricao } = req.body;
    const imagem_url = req.file ? `http://localhost:3001/uploads/${req.file.filename}` : null;

    const { data, error } = await supabase
      .from('produtos')
      .insert([{ nome, categoria, quantidade, preco_venda, preco_custo, descricao, imagem_url, criado_por: req.userId }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Produto cadastrado!', data });
  } catch (err) {
    console.error('Erro /api/produtos POST', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.put('/api/produtos/:id', verifyJWT, upload.single('imagem'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, categoria, quantidade, preco_venda, preco_custo, descricao } = req.body;
    const updateData = { nome, categoria, quantidade, preco_venda, preco_custo, descricao };

    if (req.file) {
      updateData.imagem_url = `http://localhost:3001/uploads/${req.file.filename}`;
    }

    const { error } = await supabase
      .from('produtos')
      .update(updateData)
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Produto atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro /api/produtos/:id PUT', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.delete('/api/produtos/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) return res.status(500).json(error);
    res.json({ message: 'Produto removido!' });
  } catch (err) {
    console.error('Erro /api/produtos/:id DELETE', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/api/stats', verifyJWT, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('stats_overview');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Erro /api/stats', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/cliente/register', async (req, res) => {
  try {
    const { nome, email, senha, telefone, morada } = req.body;
    const { error } = await supabase.from('clientes').insert([{ nome, email, senha, telefone, morada }]);
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email já cadastrado' });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: 'Cliente registado com sucesso!' });
  } catch (err) {
    console.error('Erro /api/cliente/register', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.use('/api/vendas', vendasRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/notificacoes', notificacoesRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
