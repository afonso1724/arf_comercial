import express from 'express';
import { verifyJWT, verifyAdmin } from '../middlewares/auth.js';
import * as relatoriosController from '../controllers/relatoriosController.js';

const router = express.Router();

// todas rotas exigem autenticação e só admins podem acessá-las
router.use(verifyJWT, verifyAdmin);

// calcular relatório (json)
router.get('/', relatoriosController.obterRelatorio);
// gerar pdf
router.get('/pdf', relatoriosController.gerarPdf);

export default router;
