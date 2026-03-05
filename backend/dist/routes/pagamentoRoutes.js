import { Router } from 'express';
import { criarPreferencaMercadoPago, obterStatusPagamento, webhookMercadoPago, simularPagamento, verificarStatusMercadoPago, } from '../controllers/pagamentoController.js';
import { autenticacao } from '../middlewares/autenticacao.js';
import { verificarAdmin } from '../middlewares/verificarAdmin.js';
import { validarWebhookToken } from '../middlewares/webhookValidacao.js';
const router = Router();
// Rotas protegidas
router.post('/mercado-pago/preferencia', autenticacao, criarPreferencaMercadoPago);
router.get('/:pagamentoId', autenticacao, obterStatusPagamento);
// Verificar status do pagamento no Mercado Pago (polling)
router.get('/verificar/:inscricaoId', autenticacao, verificarStatusMercadoPago);
// Webhook (com validação de token simples - ideal para testes com Ngrok)
// Em produção, use validarWebhookMercadoPago para HMAC SHA256
router.post('/webhook/mercado-pago', validarWebhookToken, webhookMercadoPago);
// SIMULADOR DE PAGAMENTO (apenas admin - para testes)
router.post('/simular', autenticacao, verificarAdmin, simularPagamento);
export default router;
//# sourceMappingURL=pagamentoRoutes.js.map