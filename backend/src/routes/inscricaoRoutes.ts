import { Router } from 'express';
import {
  inscreverAula,
  obterInscricoesAula,
  obterInscricoesUsuario,
  cancelarInscricao,
  atualizarPresenca,
  obterTodasInscricoes,
  adicionarInscritoManual,
  removerInscritoAdmin,
} from '../controllers/inscricaoController.js';
import {
  autenticacao,
} from '../middlewares/autenticacao.js';

const router = Router();

// Rotas para todos os usuários
// Rotas com paths mais específicos PRIMEIRO
router.get('/usuario/minhas-inscricoes', autenticacao, obterInscricoesUsuario);
router.get('/aula/:aulaId', autenticacao, obterInscricoesAula);
router.post('/admin/adicionar', autenticacao, adicionarInscritoManual);
router.delete('/admin/:inscricaoId', autenticacao, removerInscritoAdmin);
// Rotas genéricas por último
router.get('/', autenticacao, obterTodasInscricoes);
router.post('/', autenticacao, inscreverAula);
router.delete('/:inscricaoId', autenticacao, cancelarInscricao);
router.put('/:inscricaoId/presenca', autenticacao, atualizarPresenca);

export default router;
