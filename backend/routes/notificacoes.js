import express from 'express';
import { verifyJWT, verifyAdmin } from '../middlewares/auth.js';
import * as notificacoesController from '../controllers/notificacoesController.js';

const router = express.Router();

router.use(verifyJWT);

// Cliente
router.get('/cliente/:id', notificacoesController.getNotificacoesCliente);

// Admin
router.get('/admin/lista', verifyAdmin, notificacoesController.getNotificacoesAdmin);

// Marcar como lida
router.put('/:id/lida', notificacoesController.marcarNotificacaoComoLida);

// Faturas
router.post('/:id/gerar-fatura', verifyAdmin, notificacoesController.gerarFatura);
router.get('/:id/fatura/download', notificacoesController.downloadFatura);

export default router;
