import express from 'express';
import { verifyJWT, verifyAdmin } from '../middlewares/auth.js';
import * as vendasController from '../controllers/vendasController.js';

const router = express.Router();

// todas as rotas aqui exigem token
router.use(verifyJWT);

// admin - specific routes first
router.put('/:id/validar', verifyAdmin, vendasController.validateVenda);
router.get('/', verifyAdmin, vendasController.getAllVendas);

// cliente só pode ver seus pedidos
router.get('/cliente/:id', vendasController.getVendasByCliente);

// qualquer usuário autenticado pode criar venda (cliente)
router.post('/', vendasController.createVenda);

export default router;