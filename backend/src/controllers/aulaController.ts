import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors.js';
import { validar, criarAulaSchema } from '../utils/validacoes.js';
import prisma from '../lib/prisma.js';
import { enviarEmail, emailNovaAulaDisponivel, emailAulaCancelada } from '../services/emailService.js';

export const listarAulas = asyncHandler(async (req: Request, res: Response) => {
  const aulas = await prisma.aula.findMany({
    include: {
      professor: {
        select: { id: true, nome: true, email: true },
      },
    },
    orderBy: { data: 'asc' },
  });

  console.log('📋 [API] Aulas encontradas no banco:', aulas.length);

  // Transformar os dados para o formato esperado pelo frontend
  const aulasFormatadas = aulas.map(aula => ({
    ...aula,
    data: aula.data.toISOString().split('T')[0], // Converter para YYYY-MM-DD
    criadaEm: aula.createdAt?.toISOString() || new Date().toISOString(),
    atualizadaEm: aula.updatedAt?.toISOString() || new Date().toISOString(),
  }));

  console.log('📊 [API] Resposta formatada:', JSON.stringify(aulasFormatadas, null, 2));

  res.json({
    sucesso: true,
    mensagem: 'Aulas listadas com sucesso',
    dados: aulasFormatadas,
  });
});

export const obterAula = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(400, 'ID da aula é obrigatório');
  }

  const aula = await prisma.aula.findUnique({
    where: { id },
    include: {
      professor: {
        select: { id: true, nome: true, email: true },
      },
      inscricoes: true,
    },
  });

  if (!aula) {
    throw new AppError(404, 'Aula não encontrada');
  }

  // Transformar os dados para o formato esperado pelo frontend
  const aulaFormatada = {
    ...aula,
    data: aula.data.toISOString().split('T')[0], // Converter para YYYY-MM-DD
    criadaEm: aula.createdAt?.toISOString() || new Date().toISOString(),
    atualizadaEm: aula.updatedAt?.toISOString() || new Date().toISOString(),
  };

  res.json({
    sucesso: true,
    mensagem: 'Aula obtida com sucesso',
    dados: aulaFormatada,
  });
});

export const criarAula = asyncHandler(async (req: Request, res: Response) => {
  const { titulo, descricao, data, horario, duracao, local, preco, vagas } = req.body;

  console.log('📝 Criando aula com dados:', { titulo, descricao, data, horario, duracao, local, preco, vagas });
  console.log('👤 Usuário autenticado:', req.usuario);

  // Validar dados
  const { valido, mensagens, value } = validar(criarAulaSchema, {
    titulo,
    descricao,
    data,
    horario,
    duracao,
    local,
    preco,
    vagas,
  });

  if (!valido) {
    console.error('❌ Erro de validação:', mensagens);
    throw new AppError(400, mensagens || 'Dados inválidos');
  }

  // Converter string de data para Date object
  let dataObj: Date;
  if (typeof value.data === 'string') {
    // Construir datetime no formato ISO: YYYY-MM-DDTHH:MM:SS
    const dataTimeStr = `${value.data}T${value.horario}:00`;
    dataObj = new Date(dataTimeStr);
  } else {
    dataObj = new Date(value.data);
  }

  // Verificar se a data é válida
  if (isNaN(dataObj.getTime())) {
    console.error('❌ Data inválida:', dataObj);
    throw new AppError(400, 'Data inválida');
  }

  // Obter data/hora atual em Brasília (UTC-3)
  const agoraBrasilia = new Date(new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  // Converter data para string se necessário
  const dataStr = typeof value.data === 'string' ? value.data : value.data.toISOString().split('T')[0];
  const [ano, mes, dia] = dataStr.split('-');
  
  // Criar datas usando valores locais (Brasília)
  const dataAulaLocal = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0, 0);
  const dataHojeLocal = new Date(agoraBrasilia.getFullYear(), agoraBrasilia.getMonth(), agoraBrasilia.getDate(), 0, 0, 0, 0);
  
  // Formatar data de hoje em Brasília
  const diaHojeBrasilia = agoraBrasilia.getDate().toString().padStart(2, '0');
  const mesHojeBrasilia = (agoraBrasilia.getMonth() + 1).toString().padStart(2, '0');
  const anoHojeBrasilia = agoraBrasilia.getFullYear();
  const dataHojeBrasiliaStr = `${anoHojeBrasilia}-${mesHojeBrasilia}-${diaHojeBrasilia}`;
  
  console.log('🕐 Verificando data/hora (Fuso Brasília - UTC-3):');
  console.log('   Data da aula: ', value.data);
  console.log('   Hora da aula: ', value.horario);
  console.log('   Data hoje:    ', dataHojeBrasiliaStr);
  console.log('   Hora atual:   ', agoraBrasilia.toTimeString());

  // Rejeitar apenas se a data estiver no passado
  if (dataAulaLocal < dataHojeLocal) {
    console.error('❌ Data no passado:', {
      dataAula: value.data,
      dataHoje: dataHojeBrasiliaStr,
    });
    throw new AppError(400, 'Data não pode ser no passado');
  }

  console.log('✅ Data validada (Brasília) - aceitando aula para', value.data);

  if (!req.usuario) {
    throw new AppError(401, 'Usuário não autenticado');
  }

  const novaAula = await prisma.aula.create({
    data: {
      titulo: value.titulo,
      descricao: value.descricao || '',
      professor_id: req.usuario.id,
      data: dataObj,
      horario: value.horario,
      duracao: value.duracao,
      local: value.local,
      preco: value.preco,
      vagas: value.vagas,
      vagasDisponiveis: value.vagas,
      status: 'aberta',
    },
    include: {
      professor: {
        select: { id: true, nome: true, email: true },
      },
    },
  });

  console.log('✅ Aula criada com sucesso:', novaAula.id);

  // Transformar os dados para o formato esperado pelo frontend
  const novaAulaFormatada = {
    ...novaAula,
    data: novaAula.data.toISOString().split('T')[0], // Converter para YYYY-MM-DD
    criadaEm: novaAula.createdAt?.toISOString() || new Date().toISOString(),
    atualizadaEm: novaAula.updatedAt?.toISOString() || new Date().toISOString(),
  };

  res.status(201).json({
    sucesso: true,
    mensagem: 'Aula criada com sucesso',
    dados: novaAulaFormatada,
  });
});

export const atualizarAula = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { titulo, descricao, data, horario, duracao, local, preco, vagas, status } =
      req.body;

    if (!id) {
      throw new AppError(400, 'ID da aula é obrigatório');
    }

    // Validar dados opcionais se fornecidos
    if (titulo || data || horario || duracao || local || preco || vagas) {
      const { valido, mensagens } = validar(criarAulaSchema, {
        titulo: titulo || 'temp',
        data: data || new Date(),
        horario: horario || '00:00',
        duracao: duracao || 60,
        local: local || 'temp',
        preco: preco || 0,
        vagas: vagas || 1,
      });

      if (!valido) {
        throw new AppError(400, mensagens || 'Dados inválidos');
      }
    }

    const aula = await prisma.aula.findUnique({
      where: { id },
    });

    if (!aula) {
      throw new AppError(404, 'Aula não encontrada');
    }

    if (aula.professor_id !== req.usuario!.id) {
      throw new AppError(403, 'Você não tem permissão para atualizar esta aula');
    }

    const aulaAtualizada = await prisma.aula.update({
      where: { id },
      data: {
        titulo: titulo || aula.titulo,
        descricao: descricao || aula.descricao,
        data: data ? new Date(data) : aula.data,
        horario: horario || aula.horario,
        duracao: duracao || aula.duracao,
        local: local || aula.local,
        preco: preco !== undefined ? preco : aula.preco,
        vagas: vagas || aula.vagas,
        status: status || aula.status,
        vagasDisponiveis: vagas ? vagas : aula.vagasDisponiveis,
      },
      include: {
        professor: {
          select: { id: true, nome: true, email: true },
        },
      },
    });

    // Transformar os dados para o formato esperado pelo frontend
    const aulaAtualizadaFormatada = {
      ...aulaAtualizada,
      data: aulaAtualizada.data.toISOString().split('T')[0], // Converter para YYYY-MM-DD
      criadaEm: aulaAtualizada.createdAt?.toISOString() || new Date().toISOString(),
      atualizadaEm: aulaAtualizada.updatedAt?.toISOString() || new Date().toISOString(),
    };

    res.json({
      sucesso: true,
      mensagem: 'Aula atualizada com sucesso',
      dados: aulaAtualizadaFormatada,
    });
  }
);

export const deletarAula = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const aula = await prisma.aula.findUnique({
    where: { id },
  });

  if (!aula) {
    throw new AppError(404, 'Aula não encontrada');
  }

  if (aula.professor_id !== req.usuario!.id) {
    throw new AppError(403, 'Você não tem permissão para deletar esta aula');
  }

  await prisma.aula.delete({
    where: { id },
  });

  res.json({
    sucesso: true,
    mensagem: 'Aula deletada com sucesso',
  });
});

export const obterAulasProfessor = asyncHandler(
  async (req: Request, res: Response) => {
    const aulas = await prisma.aula.findMany({
      where: {
        professor_id: req.usuario!.id,
      },
      include: {
        professor: {
          select: { id: true, nome: true, email: true },
        },
      },
    });

    // Transformar os dados para o formato esperado pelo frontend
    const aulasFormatadas = aulas.map(aula => ({
      ...aula,
      data: aula.data.toISOString().split('T')[0], // Converter para YYYY-MM-DD
      criadaEm: aula.createdAt?.toISOString() || new Date().toISOString(),
      atualizadaEm: aula.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    res.json({
      sucesso: true,
      mensagem: 'Aulas do professor obtidas com sucesso',
      dados: aulasFormatadas,
    });
  }
);

/**
 * Notificar todos os alunos sobre uma nova aula disponível
 * POST /api/aulas/:aulaId/notificar
 */
export const notificarAlunosSobreNovaAula = asyncHandler(
  async (req: Request, res: Response) => {
    const { aulaId } = req.params;

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

    // Buscar todos os alunos (usuários que não são admin)
    const alunos = await prisma.usuario.findMany({
      where: {
        isAdmin: false,
      },
    });

    console.log(`📧 Notificando ${alunos.length} alunos sobre nova aula: ${aula.titulo}`);

    let emailsEnviados = 0;
    for (const aluno of alunos) {
      if (!aluno.email) continue;

      const dataFormatada = new Date(aula.data).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const assunto = `[FutevoleiPro] 🆕 Nova Aula Disponível: ${aula.titulo}`;
      const html = emailNovaAulaDisponivel(
        aluno.nome,
        aula.titulo,
        dataFormatada,
        aula.horario,
        aula.local,
        aula.descricao || '',
        aula.preco
      );

      const enviado = await enviarEmail({
        para: aluno.email,
        assunto,
        html,
      });

      if (enviado) emailsEnviados++;
    }

    res.json({
      sucesso: true,
      mensagem: `Notificação enviada para ${emailsEnviados} alunos`,
      dados: {
        aulaId,
        aulaTitulo: aula.titulo,
        totalAlunos: alunos.length,
        emailsEnviados,
      },
    });
  }
);

/**
 * Cancelar aula e notificar todos os alunos inscritos
 * PUT /api/aulas/:aulaId/cancelar
 */
export const cancelarAulaComNotificacao = asyncHandler(
  async (req: Request, res: Response) => {
    const { aulaId } = req.params;
    const { motivo = 'Motivos não previstos' } = req.body;

    if (!aulaId) {
      throw new AppError(400, 'ID da aula é obrigatório');
    }

    // Buscar aula
    const aula = await prisma.aula.findUnique({
      where: { id: aulaId },
      include: {
        inscricoes: {
          include: {
            aluno: true,
          },
        },
      },
    });

    if (!aula) {
      throw new AppError(404, 'Aula não encontrada');
    }

    // Verificar se é professor da aula
    if (aula.professor_id !== req.usuario!.id && !req.usuario!.isAdmin) {
      throw new AppError(403, 'Você não tem permissão para cancelar esta aula');
    }

    // Atualizar status da aula
    const aulaAtualizada = await prisma.aula.update({
      where: { id: aulaId },
      data: {
        status: 'cancelada',
      },
    });

    console.log(`❌ Aula cancelada: ${aula.titulo}`);
    console.log(`📧 Notificando ${aula.inscricoes.length} alunos inscritos`);

    // Notificar todos os alunos inscritos
    let emailsEnviados = 0;
    for (const inscricao of aula.inscricoes) {
      if (!inscricao.aluno.email) continue;

      const dataFormatada = new Date(aula.data).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const assunto = `[FutevoleiPro] ❌ Aula Cancelada: ${aula.titulo}`;
      const html = emailAulaCancelada(
        inscricao.aluno.nome,
        aula.titulo,
        dataFormatada,
        aula.horario,
        motivo
      );

      const enviado = await enviarEmail({
        para: inscricao.aluno.email,
        assunto,
        html,
      });

      if (enviado) emailsEnviados++;
    }

    res.json({
      sucesso: true,
      mensagem: `Aula cancelada. Notificação enviada para ${emailsEnviados} alunos`,
      dados: {
        aula: aulaAtualizada,
        totalAlunosNotificados: emailsEnviados,
      },
    });
  }
);

// Listar inscritos de uma aula (admin)
export const listarInscritosAula = asyncHandler(async (req: Request, res: Response) => {
  const { aulaId } = req.params;

  if (!aulaId) {
    throw new AppError(400, 'ID da aula é obrigatório');
  }

  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    include: {
      inscricoes: {
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
            },
          },
          pagamento: {
            select: {
              id: true,
              valor: true,
              metodo: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!aula) {
    throw new AppError(404, 'Aula não encontrada');
  }

  // Verificar se é admin ou professor da aula
  if (aula.professor_id !== req.usuario!.id && !req.usuario!.isAdmin) {
    throw new AppError(403, 'Você não tem permissão para ver os inscritos desta aula');
  }

  const inscritos = aula.inscricoes.map(inscricao => ({
    id: inscricao.id,
    status: inscricao.status,
    aluno: inscricao.aluno,
    pagamento: inscricao.pagamento,
    createdAt: inscricao.createdAt,
  }));

  res.json({
    sucesso: true,
    mensagem: `${inscritos.length} inscritos encontrados`,
    dados: {
      aula: {
        id: aula.id,
        titulo: aula.titulo,
        data: aula.data.toISOString().split('T')[0],
        horario: aula.horario,
      },
      inscritos,
    },
  });
});
