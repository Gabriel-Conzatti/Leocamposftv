import { Router } from 'express';
import { listarAulas, obterAula, criarAula, atualizarAula, deletarAula, obterAulasProfessor, notificarAlunosSobreNovaAula, cancelarAulaComNotificacao, listarInscritosAula, confirmarAula, } from '../controllers/aulaController.js';
import { autenticacao, } from '../middlewares/autenticacao.js';
import { verificarAdmin, } from '../middlewares/verificarAdmin.js';
const router = Router();
// Rotas protegidas - apenas admin (devem vir ANTES das rotas com parâmetros dinâmicos)
router.post('/', autenticacao, verificarAdmin, criarAula);
router.get('/professor/minhas-aulas', autenticacao, verificarAdmin, obterAulasProfessor);
router.put('/:id', autenticacao, verificarAdmin, atualizarAula);
router.delete('/:id', autenticacao, verificarAdmin, deletarAula);
// Notificações (rotas especiais com admin)
router.post('/:aulaId/notificar', autenticacao, verificarAdmin, notificarAlunosSobreNovaAula);
router.put('/:aulaId/cancelar', autenticacao, verificarAdmin, cancelarAulaComNotificacao);
router.put('/:aulaId/confirmar', autenticacao, verificarAdmin, confirmarAula);
// Listar inscritos de uma aula
router.get('/:aulaId/inscritos', autenticacao, verificarAdmin, listarInscritosAula);
// Rotas públicas (devem vir POR ÚLTIMO)
router.get('/', listarAulas);
router.get('/:id', obterAula);
export default router;
//# sourceMappingURL=aulaRoutes.js.map