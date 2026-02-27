import { Router } from 'express';
import {
  registroController,
  loginController,
  logoutController,
  solicitarRecuperacaoSenha,
  resetarSenha,
  atualizarPerfil,
  obterPerfil,
  obterContatoAdmin,
} from '../controllers/authController.js';
import { autenticacao } from '../middlewares/autenticacao.js';

const router = Router();

// Rotas públicas
router.post('/register', registroController);
router.post('/login', loginController);
router.post('/logout', logoutController);

// Rotas de recuperação de senha (públicas)
router.post('/solicitar-recuperacao', solicitarRecuperacaoSenha);
router.post('/resetar-senha', resetarSenha);
router.get('/contato-admin', obterContatoAdmin);

// Rotas de perfil (autenticadas)
router.get('/perfil', autenticacao, obterPerfil);
router.put('/perfil', autenticacao, atualizarPerfil);

export default router;
