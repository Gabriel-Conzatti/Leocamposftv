import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors.js';
import prisma from '../lib/prisma.js';
import { enviarEmail, emailNovaInscricao, emailAvisoAgendamento } from '../services/emailService.js';

export const inscreverAula = asyncHandler(
  async (req: Request, res: Response) => {
    const { aulaId } = req.body;

    if (!aulaId || typeof aulaId !== 'string') {
      throw new AppError(400, 'ID da aula é obrigatório e deve ser texto');
    }

    // Verificar se já está inscrito
    const jaInscrito = await prisma.inscricao.findFirst({
      where: {
        aula_id: aulaId,
        aluno_id: req.usuario!.id,
      },
    });

    if (jaInscrito) {
      throw new AppError(400, 'Você já está inscrito nesta aula');
    }

    // Verificar se a aula existe e tem vagas
    const aula = await prisma.aula.findUnique({
      where: { id: aulaId },
    });

    if (!aula) {
      throw new AppError(404, 'Aula não encontrada');
    }

    if (aula.vagasDisponiveis <= 0) {
      throw new AppError(400, 'Aula sem vagas disponíveis');
    }

    if (aula.status === 'cancelada') {
      throw new AppError(400, 'Aula foi cancelada');
    }

    // Criar inscrição
    const novaInscricao = await prisma.inscricao.create({
      data: {
        aluno_id: req.usuario!.id,
        aula_id: aulaId,
        status: 'pendente',
      },
      include: {
        aluno: {
          select: { id: true, nome: true, email: true },
        },
        aula: {
          select: { id: true, titulo: true, preco: true },
        },
      },
    });

    // Atualizar vagas disponíveis
    await prisma.aula.update({
      where: { id: aulaId },
      data: {
        vagasDisponiveis: aula.vagasDisponiveis - 1,
        status: aula.vagasDisponiveis - 1 === 0 ? 'cheia' : 'aberta',
      },
    });

    // Buscar informações completas da aula para o email
    const aulaCompleta = await prisma.aula.findUnique({
      where: { id: aulaId },
    });

    // Enviar email de aviso de agendamento
    if (novaInscricao.aluno.email && aulaCompleta) {
      const dataFormatada = new Date(aulaCompleta.data).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const assunto = `[FutevoleiPro] Você foi agendado para: ${aulaCompleta.titulo}`;
      const html = emailAvisoAgendamento(
        novaInscricao.aluno.nome,
        aulaCompleta.titulo,
        dataFormatada,
        aulaCompleta.horario
      );

      await enviarEmail({
        para: novaInscricao.aluno.email,
        assunto,
        html,
      });
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Inscrição realizada com sucesso',
      dados: novaInscricao,
    });
  }
);

export const obterInscricoesAula = asyncHandler(
  async (req: Request, res: Response) => {
    const { aulaId } = req.params;

    if (!aulaId) {
      throw new AppError(400, 'ID da aula é obrigatório');
    }

    // Verificar se aula existe
    const aula = await prisma.aula.findUnique({
      where: { id: aulaId },
    });

    if (!aula) {
      throw new AppError(404, 'Aula não encontrada');
    }

    const inscricoes = await prisma.inscricao.findMany({
      where: { aula_id: aulaId },
      include: {
        aluno: {
          select: { id: true, nome: true, email: true },
        },
        aula: {
          select: { id: true, titulo: true },
        },
      },
    });

    res.json({
      sucesso: true,
      mensagem: 'Inscrições obtidas com sucesso',
      dados: inscricoes,
    });
  }
);

export const obterInscricoesUsuario = asyncHandler(
  async (req: Request, res: Response) => {
    const inscricoes = await prisma.inscricao.findMany({
      where: { aluno_id: req.usuario!.id },
      include: {
        aluno: {
          select: { id: true, nome: true, email: true },
        },
        aula: {
          select: { id: true, titulo: true, data: true, preco: true, local: true },
        },
        pagamento: true,
      },
    });

    res.json({
      sucesso: true,
      mensagem: 'Inscrições do usuário obtidas com sucesso',
      dados: inscricoes,
    });
  }
);

export const cancelarInscricao = asyncHandler(
  async (req: Request, res: Response) => {
    const { inscricaoId } = req.params;

    const inscricao = await prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      include: { aula: true },
    });

    if (!inscricao) {
      throw new AppError(404, 'Inscrição não encontrada');
    }

    if (inscricao.aluno_id !== req.usuario!.id) {
      throw new AppError(
        403,
        'Você não tem permissão para cancelar esta inscrição'
      );
    }

    // Deletar inscrição
    await prisma.inscricao.delete({
      where: { id: inscricaoId },
    });

    // Atualizar vagas da aula
    await prisma.aula.update({
      where: { id: inscricao.aula_id },
      data: {
        vagasDisponiveis: inscricao.aula.vagasDisponiveis + 1,
        status: 'aberta',
      },
    });

    res.json({
      sucesso: true,
      mensagem: 'Inscrição cancelada com sucesso',
    });
  }
);

export const atualizarPresenca = asyncHandler(
  async (req: Request, res: Response) => {
    const { inscricaoId } = req.params;
    const { presente } = req.body;

    const inscricao = await prisma.inscricao.findUnique({
      where: { id: inscricaoId },
    });

    if (!inscricao) {
      throw new AppError(404, 'Inscrição não encontrada');
    }

    // Atualizar ou criar presença
    const presenca = await prisma.presenca.upsert({
      where: { inscricao_id: inscricaoId },
      update: { presente },
      create: {
        inscricao_id: inscricaoId,
        aula_id: inscricao.aula_id,
        presente,
      },
      include: {
        inscricao: {
          include: {
            aluno: true,
            aula: true,
          },
        },
      },
    });

    res.json({
      sucesso: true,
      mensagem: 'Presença atualizada com sucesso',
      dados: presenca,
    });
  }
);

export const obterTodasInscricoes = asyncHandler(
  async (req: Request, res: Response) => {
    const inscricoes = await prisma.inscricao.findMany({
      include: {
        aluno: {
          select: { id: true, nome: true, email: true, telefone: true },
        },
        aula: {
          select: { id: true, titulo: true },
        },
      },
    });

    // Mapear 'aluno' para 'usuario' para compatibilidade com frontend
    const inscricoesFormatadas = inscricoes.map((insc: any) => ({
      ...insc,
      usuario: insc.aluno,
    }));

    res.json({
      sucesso: true,
      mensagem: 'Inscrições obtidas com sucesso',
      dados: inscricoesFormatadas,
    });
  }
);

/**
 * Adicionar inscrito manualmente (apenas admin)
 * POST /api/inscricoes/admin/adicionar
 */
export const adicionarInscritoManual = asyncHandler(
  async (req: Request, res: Response) => {
    const { aulaId, nome, email } = req.body;

    if (!aulaId || !nome || !email) {
      throw new AppError(400, 'ID da aula, nome e email são obrigatórios');
    }

    // Verificar se o usuário é admin
    if (!req.usuario?.isAdmin) {
      throw new AppError(403, 'Apenas administradores podem adicionar inscritos manualmente');
    }

    // Verificar se a aula existe e tem vagas
    const aula = await prisma.aula.findUnique({
      where: { id: aulaId },
    });

    if (!aula) {
      throw new AppError(404, 'Aula não encontrada');
    }

    if (aula.vagasDisponiveis <= 0) {
      throw new AppError(400, 'Aula sem vagas disponíveis');
    }

    // Buscar ou criar o usuário
    let usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!usuario) {
      // Criar usuário com senha temporária (pode ser alterada depois)
      const { hashSenha } = await import('../utils/bcrypt.js');
      const senhaTemp = await hashSenha('temp123');
      
      usuario = await prisma.usuario.create({
        data: {
          nome,
          email: email.toLowerCase(),
          senha: senhaTemp,
          isAdmin: false,
        },
      });
    }

    // Verificar se já está inscrito
    const jaInscrito = await prisma.inscricao.findFirst({
      where: {
        aula_id: aulaId,
        aluno_id: usuario.id,
      },
    });

    if (jaInscrito) {
      throw new AppError(400, 'Este aluno já está inscrito nesta aula');
    }

    // Criar inscrição como confirmada (adicionado pelo admin)
    const novaInscricao = await prisma.inscricao.create({
      data: {
        aluno_id: usuario.id,
        aula_id: aulaId,
        status: 'confirmada',
      },
      include: {
        aluno: {
          select: { id: true, nome: true, email: true },
        },
        aula: {
          select: { id: true, titulo: true, preco: true },
        },
      },
    });

    // Atualizar vagas disponíveis
    await prisma.aula.update({
      where: { id: aulaId },
      data: {
        vagasDisponiveis: aula.vagasDisponiveis - 1,
        status: aula.vagasDisponiveis - 1 === 0 ? 'cheia' : 'aberta',
      },
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Inscrito adicionado com sucesso',
      dados: novaInscricao,
    });
  }
);
