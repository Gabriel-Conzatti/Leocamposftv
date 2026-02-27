import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors.js';
import { criarPreferencaPagamento, buscarPagamentosPorReferencia } from '../utils/mercadopago.js';
import prisma from '../lib/prisma.js';
import { enviarEmail, emailConfirmacaoPagamento } from '../services/emailService.js';

export const obterStatusPagamento = asyncHandler(
  async (req: Request, res: Response) => {
    const { pagamentoId } = req.params;

    // Validar ID
    if (!pagamentoId) {
      throw new AppError(400, 'ID do pagamento é obrigatório');
    }

    const pagamento = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
      include: {
        aluno: {
          select: { id: true, nome: true, email: true },
        },
        inscricao: {
          include: { aula: true },
        },
      },
    });

    if (!pagamento) {
      throw new AppError(404, 'Pagamento não encontrado');
    }

    // Validar se o usuário tem permissão
    if (pagamento.aluno_id !== req.usuario!.id) {
      throw new AppError(403, 'Você não tem permissão para acessar este pagamento');
    }

    res.json({
      sucesso: true,
      mensagem: 'Status do pagamento obtido com sucesso',
      dados: pagamento,
    });
  }
);

export const criarPreferencaMercadoPago = asyncHandler(
  async (req: Request, res: Response) => {
    const { aulaId } = req.body;
    const usuarioId = req.usuario!.id;

    if (!aulaId) {
      throw new AppError(400, 'ID da aula é obrigatório');
    }

    // Buscar aula
    const aula = await prisma.aula.findUnique({
      where: { id: aulaId },
    });

    if (!aula) {
      throw new AppError(404, 'Aula não encontrada');
    }

    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // PASSO 1: Verificar se já existe inscrição
    let inscricao = await prisma.inscricao.findUnique({
      where: {
        aluno_id_aula_id: {
          aluno_id: usuarioId,
          aula_id: aulaId,
        },
      },
      include: { pagamento: true },
    });

    // Se não existe, criar inscrição
    if (!inscricao) {
      inscricao = await prisma.inscricao.create({
        data: {
          aluno_id: usuarioId,
          aula_id: aulaId,
          status: 'pendente',
        },
        include: { pagamento: true },
      });
      console.log('📝 Nova inscrição criada:', inscricao.id);
    }

    // PASSO 2: Verificar se já existe pagamento para esta inscrição
    let pagamento = inscricao.pagamento;

    if (!pagamento) {
      // Criar registro de pagamento no BD
      pagamento = await prisma.pagamento.create({
        data: {
          aluno_id: usuarioId,
          inscricao_id: inscricao.id,
          valor: aula.preco,
          metodo: 'mercado_pago',
          status: 'pendente',
        },
      });
      console.log('💳 Registro de pagamento criado:', pagamento.id);
    }

    // PASSO 3: Chamar Mercado Pago com o ID correto da inscrição
    const preferencia = await criarPreferencaPagamento({
      titulo: aula.titulo,
      descricao: aula.descricao || 'Aula de Futevôlei',
      valor: aula.preco,
      email: usuario.email,
      nomeAluno: usuario.nome,
      aulaId: aula.id,
      inscricaoId: inscricao.id,
    });

    // PASSO 4: Salvar ID do Mercado Pago se foi criado com sucesso
    if (preferencia.id && !preferencia.isSimulated) {
      await prisma.pagamento.update({
        where: { id: pagamento.id },
        data: {
          mercadoPagoId: preferencia.id,
        },
      });
      console.log('🔗 ID do Mercado Pago salvo:', preferencia.id);
    }

    res.json({
      sucesso: true,
      dados: {
        ...preferencia,
        pagamentoId: pagamento.id,
        inscricaoId: inscricao.id,
      },
    });
  }
);

export const webhookMercadoPago = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, data } = req.body;

    console.log('🔔 Webhook recebido do Mercado Pago:', { type, data });

    // O Mercado Pago envia notificações de diferentes tipos
    // type pode ser: "payment", "plan", "subscription", "invoice"
    if (type !== 'payment') {
      console.log('⚠️ Tipo de notificação ignorada:', type);
      return res.json({ sucesso: true });
    }

    if (!data || !data.id) {
      console.warn('⚠️ Dados inválidos do webhook');
      return res.json({ sucesso: true });
    }

    try {
      const paymentId = data.id;
      console.log('📦 Processando pagamento:', paymentId);

      // Buscar a preferência no Mercado Pago usando a API
      // para validar a informação
      const mercadoPago = require('mercadopago');
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

      if (!accessToken || accessToken.startsWith('APP_USR-')) {
        // Token inválido, apenas validar status local
        console.warn('⚠️ Token do Mercado Pago inválido, usando validação local');
      }

      // Buscar o pagamento no banco de dados pelo ID do Mercado Pago
      const pagamento = await prisma.pagamento.findFirst({
        where: {
          mercadoPagoId: paymentId.toString(),
        },
        include: {
          inscricao: true,
          aluno: true,
        },
      });

      if (!pagamento) {
        console.warn('⚠️ Pagamento não encontrado no banco:', paymentId);
        return res.json({ sucesso: true });
      }

      console.log('✅ Pagamento encontrado:', pagamento.id);
      console.log('📊 Status anterior:', pagamento.status);

      // Mapear status do Mercado Pago para nosso sistema
      // Estados possíveis: pending, approved, authorized, in_process, in_mediation, rejected, cancelled, refunded, charged_back
      let novoStatus = pagamento.status;

      if (data.status === 'approved' || data.status === 'authorized') {
        novoStatus = 'confirmado';
        console.log('✅ Pagamento aprovado!');
      } else if (data.status === 'rejected' || data.status === 'cancelled') {
        novoStatus = 'rejeitado';
        console.log('❌ Pagamento rejeitado');
      } else if (data.status === 'refunded' || data.status === 'charged_back') {
        novoStatus = 'reembolsado';
        console.log('🔄 Pagamento reembolsado');
      } else if (data.status === 'in_process' || data.status === 'pending') {
        novoStatus = 'pendente';
        console.log('⏳ Pagamento pendente');
      } else if (data.status === 'in_mediation') {
        novoStatus = 'disputa';
        console.log('⚖️ Pagamento em disputa');
      }

      // Atualizar pagamento apenas se o status mudou
      if (novoStatus !== pagamento.status) {
        const pagamentoAtualizado = await prisma.pagamento.update({
          where: { id: pagamento.id },
          data: {
            status: novoStatus,
          },
        });

        console.log('📝 Pagamento atualizado para:', novoStatus);

        // Se pagamento foi confirmado, atualizar inscrição
        if (novoStatus === 'confirmado') {
          await prisma.inscricao.update({
            where: { id: pagamento.inscricao_id },
            data: {
              status: 'confirmada',
            },
          });

          console.log('✅ Inscrição confirmada!');
          console.log('🎉 Aluno:', pagamento.aluno.nome);
          console.log('🎓 Aula:', pagamento.inscricao.aula_id);

          // Buscar dados da aula para o email
          const aula = await prisma.aula.findUnique({
            where: { id: pagamento.inscricao.aula_id },
          });

          if (aula && pagamento.aluno.email) {
            const dataFormatada = new Date(aula.data).toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            const assunto = `[FutevoleiPro] Pagamento Confirmado - ${aula.titulo}`;
            const html = emailConfirmacaoPagamento(
              pagamento.aluno.nome,
              aula.titulo,
              dataFormatada,
              aula.horario,
              aula.local,
              aula.preco
            );

            await enviarEmail({
              para: pagamento.aluno.email,
              assunto,
              html,
            });
          }
        }
      } else {
        console.log('ℹ️ Status não mudou, ignorando');
      }

      res.json({
        sucesso: true,
        mensagem: 'Webhook processado com sucesso',
        status: novoStatus,
      });
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      // Retornar 200 mesmo com erro para o MP não reenviar
      res.json({
        sucesso: true,
        mensagem: 'Webhook recebido (erro ao processar)',
      });
    }
  }
);

// SIMULADOR DE PAGAMENTO (apenas para desenvolvimento)
export const simularPagamento = asyncHandler(
  async (req: Request, res: Response) => {
    const { pagamentoId, status = 'approved' } = req.body;

    if (!pagamentoId) {
      throw new AppError(400, 'ID do pagamento é obrigatório');
    }

    // Buscar pagamento
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
      include: {
        inscricao: true,
        aluno: true,
      },
    });

    if (!pagamento) {
      throw new AppError(404, 'Pagamento não encontrado');
    }

    console.log('🧪 Simulando pagamento:', pagamentoId);
    console.log('   Status:', status);

    // Mapear status do Mercado Pago para nosso sistema
    let novoStatus = pagamento.status;

    if (status === 'approved') {
      novoStatus = 'confirmado';
      console.log('✅ Pagamento aprovado!');
    } else if (status === 'rejected') {
      novoStatus = 'rejeitado';
      console.log('❌ Pagamento rejeitado');
    } else if (status === 'refunded') {
      novoStatus = 'reembolsado';
      console.log('🔄 Pagamento reembolsado');
    } else if (status === 'pending') {
      novoStatus = 'pendente';
      console.log('⏳ Pagamento pendente');
    }

    // Atualizar pagamento
    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        status: novoStatus,
      },
    });

    console.log('📝 Pagamento atualizado para:', novoStatus);

    // Se pagamento foi confirmado, atualizar inscrição
    if (novoStatus === 'confirmado') {
      await prisma.inscricao.update({
        where: { id: pagamento.inscricao_id },
        data: {
          status: 'confirmada',
        },
      });

      console.log('✅ Inscrição confirmada!');
      console.log('🎉 Aluno:', pagamento.aluno.nome);

      // Buscar dados da aula para o email
      const aula = await prisma.aula.findUnique({
        where: { id: pagamento.inscricao.aula_id },
      });

      if (aula && pagamento.aluno.email) {
        const dataFormatada = new Date(aula.data).toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const assunto = `[FutevoleiPro] Pagamento Confirmado - ${aula.titulo}`;
        const html = emailConfirmacaoPagamento(
          pagamento.aluno.nome,
          aula.titulo,
          dataFormatada,
          aula.horario,
          aula.local,
          aula.preco
        );

        await enviarEmail({
          para: pagamento.aluno.email,
          assunto,
          html,
        });
      }
    }

    res.json({
      sucesso: true,
      mensagem: 'Pagamento simulado com sucesso',
      dados: {
        pagamento: pagamentoAtualizado,
        inscricao: pagamento.inscricao,
        aluno: pagamento.aluno,
      },
    });
  }
);

// Verificar status do pagamento diretamente no Mercado Pago (polling)
export const verificarStatusMercadoPago = asyncHandler(
  async (req: Request, res: Response) => {
    const { inscricaoId } = req.params;

    if (!inscricaoId) {
      throw new AppError(400, 'ID da inscrição é obrigatório');
    }

    console.log('🔍 Verificando status do pagamento para inscrição:', inscricaoId);

    // Buscar inscrição
    const inscricao = await prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      include: {
        pagamento: true,
        aula: true,
        aluno: true,
      },
    });

    if (!inscricao) {
      throw new AppError(404, 'Inscrição não encontrada');
    }

    // Buscar pagamento no Mercado Pago usando external_reference
    const pagamentoMP = await buscarPagamentosPorReferencia(inscricaoId);

    if (pagamentoMP) {
      console.log('📦 Status do Mercado Pago:', pagamentoMP.status);

      // Se o pagamento foi aprovado, atualizar no banco
      if (pagamentoMP.status === 'approved') {
        console.log('✅ Pagamento APROVADO no Mercado Pago!');

        // Atualizar pagamento
        if (inscricao.pagamento) {
          await prisma.pagamento.update({
            where: { id: inscricao.pagamento.id },
            data: {
              status: 'confirmado',
              mercadoPagoId: pagamentoMP.id.toString(),
            },
          });
        }

        // Atualizar inscrição
        await prisma.inscricao.update({
          where: { id: inscricaoId },
          data: {
            status: 'confirmada',
          },
        });

        console.log('🎉 Inscrição confirmada para:', inscricao.aluno?.nome || 'Inscrito manual');

        return res.json({
          sucesso: true,
          mensagem: 'Pagamento confirmado!',
          dados: {
            statusMercadoPago: pagamentoMP.status,
            statusInscricao: 'confirmada',
            statusPagamento: 'confirmado',
            confirmado: true,
          },
        });
      }

      // Status pendente ou outro
      return res.json({
        sucesso: true,
        mensagem: 'Pagamento ainda não confirmado',
        dados: {
          statusMercadoPago: pagamentoMP.status,
          statusDetail: pagamentoMP.status_detail,
          statusInscricao: inscricao.status,
          statusPagamento: inscricao.pagamento?.status || 'pendente',
          confirmado: false,
        },
      });
    }

    // Nenhum pagamento encontrado no Mercado Pago ainda
    res.json({
      sucesso: true,
      mensagem: 'Aguardando pagamento',
      dados: {
        statusMercadoPago: null,
        statusInscricao: inscricao.status,
        statusPagamento: inscricao.pagamento?.status || 'pendente',
        confirmado: false,
      },
    });
  }
);
