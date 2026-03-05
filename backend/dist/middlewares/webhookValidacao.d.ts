import { Request, Response, NextFunction } from 'express';
/**
 * Valida a autenticidade do webhook do Mercado Pago
 * O Mercado Pago envia um header X-Signature com HMAC SHA256
 *
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integrate-notification-system
 */
export declare const validarWebhookMercadoPago: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Middleware alternativo: Validação simples por token
 * Use se preferir segurança por token em vez de HMAC
 */
export declare const validarWebhookToken: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=webhookValidacao.d.ts.map