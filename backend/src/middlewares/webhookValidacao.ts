import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Valida a autenticidade do webhook do Mercado Pago
 * O Mercado Pago envia um header X-Signature com HMAC SHA256
 * 
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integrate-notification-system
 */
export const validarWebhookMercadoPago = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Em desenvolvimento, podemos pular a validação
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ Validação de webhook desativada em desenvolvimento');
    return next();
  }

  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-request-id'] as string;
  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!signature || !timestamp) {
    console.warn('⚠️ Headers de autenticação do webhook não encontrados');
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Webhook não autenticado',
    });
  }

  if (!webhookSecret) {
    console.warn('⚠️ MERCADO_PAGO_WEBHOOK_SECRET não configurado');
    return next();
  }

  try {
    // A assinatura é gerada: SHA256(ID:TIMESTAMP:SECRET)
    const [hash, ts] = signature.split(',');
    const [hashType, hashValue] = hash.split('=');

    if (hashType !== 'v1') {
      console.warn('⚠️ Tipo de hash não suportado:', hashType);
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Webhook não autenticado',
      });
    }

    // Montar a string para validar
    const dataStr = `${timestamp}:${webhookSecret}`;
    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(dataStr)
      .digest('hex');

    // Comparar hashes
    if (!crypto.timingSafeEqual(Buffer.from(hashValue), Buffer.from(expectedHash))) {
      console.warn('⚠️ Assinatura do webhook inválida');
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Webhook não autenticado',
      });
    }

    console.log('✅ Webhook do Mercado Pago autenticado com sucesso');
    next();
  } catch (error) {
    console.error('❌ Erro ao validar webhook:', error);
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao validar webhook',
    });
  }
};

/**
 * Middleware alternativo: Validação simples por token
 * Use se preferir segurança por token em vez de HMAC
 */
export const validarWebhookToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const webhookToken = process.env.MERCADO_PAGO_WEBHOOK_TOKEN;

  if (!webhookToken) {
    console.log('⚠️ MERCADO_PAGO_WEBHOOK_TOKEN não configurado, permitindo webhook');
    return next();
  }

  if (!token || token !== webhookToken) {
    console.warn('⚠️ Token de webhook inválido');
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Webhook não autenticado',
    });
  }

  console.log('✅ Webhook autenticado por token');
  next();
};
