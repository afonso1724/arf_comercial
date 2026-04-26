const express = require('express');
const router = express.Router();
const { verifyJWT, verifyAdmin } = require('../middlewares/auth');
const notificacoesController = require('../controllers/notificacoesController');

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
