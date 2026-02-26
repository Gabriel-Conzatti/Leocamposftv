import { Router } from 'express';
import {
  registroController,
  loginController,
  logoutController,
  solicitarRecuperacaoSenha,
  resetarSenha,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', registroController);
router.post('/login', loginController);
router.post('/logout', logoutController);

// Rotas de recuperação de senha (públicas)
router.post('/solicitar-recuperacao', solicitarRecuperacaoSenha);
router.post('/resetar-senha', resetarSenha);

export default router;
