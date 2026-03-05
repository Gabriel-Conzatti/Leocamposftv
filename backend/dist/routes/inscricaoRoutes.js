import { Router } from 'express';
import { inscreverAula, obterInscricoesAula, obterInscricoesUsuario, cancelarInscricao, atualizarPresenca, obterTodasInscricoes, adicionarInscritoManual, removerInscritoAdmin, } from '../controllers/inscricaoController.js';
import { autenticacao, } from '../middlewares/autenticacao.js';
import { verificarAdmin, } from '../middlewares/verificarAdmin.js';
const router = Router();
// Rotas para todos os usuários autenticados
router.get('/usuario/minhas-inscricoes', autenticacao, obterInscricoesUsuario);
router.get('/aula/:aulaId', autenticacao, obterInscricoesAula);
// Rotas admin (requerem autenticação + admin)
router.post('/admin/adicionar', autenticacao, verificarAdmin, adicionarInscritoManual);
router.delete('/admin/:inscricaoId', autenticacao, verificarAdmin, removerInscritoAdmin);
// Rotas genéricas
router.get('/', autenticacao, obterTodasInscricoes);
router.post('/', autenticacao, inscreverAula);
router.delete('/:inscricaoId', autenticacao, cancelarInscricao);
router.put('/:inscricaoId/presenca', autenticacao, atualizarPresenca);
export default router;
//# sourceMappingURL=inscricaoRoutes.js.map