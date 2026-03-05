import { asyncHandler, AppError } from '../utils/errors.js';
import prisma from '../lib/prisma.js';
import { enviarEmail, emailAvisoAgendamento } from '../services/emailService.js';
export const inscreverAula = asyncHandler(async (req, res) => {
    const { aulaId } = req.body;
    if (!aulaId || typeof aulaId !== 'string') {
        throw new AppError(400, 'ID da aula é obrigatório e deve ser texto');
    }
    // Verificar se já está inscrito
    const jaInscrito = await prisma.inscricao.findFirst({
        where: {
            aula_id: aulaId,
            aluno_id: req.usuario.id,
        },
    });
    if (jaInscrito) {
        throw new AppError(400, 'Você já está inscrito nesta aula');
    }
    // Verificar se a aula existe e tem vagas
    // SÓ conta inscrições CONFIRMADAS (pagas ou manuais) para verificar vagas
    const aula = await prisma.aula.findUnique({
        where: { id: aulaId },
        include: {
            _count: {
                select: {
                    inscricoes: {
                        where: { status: 'confirmada' }
                    }
                }
            },
        },
    });
    if (!aula) {
        throw new AppError(404, 'Aula não encontrada');
    }
    // Calcular vagas disponíveis (apenas inscrições confirmadas ocupam vaga)
    const vagasDisponiveis = aula.vagas - aula._count.inscricoes;
    if (vagasDisponiveis <= 0) {
        throw new AppError(400, 'Aula sem vagas disponíveis');
    }
    if (aula.status === 'cancelada') {
        throw new AppError(400, 'Aula foi cancelada');
    }
    // Criar inscrição com status PENDENTE (não ocupa vaga até pagar)
    const novaInscricao = await prisma.inscricao.create({
        data: {
            aluno_id: req.usuario.id,
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
    // Buscar informações completas da aula para o email
    const aulaCompleta = await prisma.aula.findUnique({
        where: { id: aulaId },
    });
    // Enviar email de aviso de agendamento
    if (novaInscricao.aluno?.email && aulaCompleta) {
        const dataFormatada = new Date(aulaCompleta.data).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const assunto = `[FutevoleiPro] Você foi agendado para: ${aulaCompleta.titulo}`;
        const html = emailAvisoAgendamento(novaInscricao.aluno.nome, aulaCompleta.titulo, dataFormatada, aulaCompleta.horario);
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
});
export const obterInscricoesAula = asyncHandler(async (req, res) => {
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
            pagamento: true,
        },
    });
    // Formatar para incluir alunoNome para inscrições manuais
    const inscricoesFormatadas = inscricoes.map((insc) => ({
        ...insc,
        alunoNome: insc.aluno?.nome || insc.nomeManual || 'Inscrito',
    }));
    res.json({
        sucesso: true,
        mensagem: 'Inscrições obtidas com sucesso',
        dados: inscricoesFormatadas,
    });
});
export const obterInscricoesUsuario = asyncHandler(async (req, res) => {
    const inscricoes = await prisma.inscricao.findMany({
        where: { aluno_id: req.usuario.id },
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
});
export const cancelarInscricao = asyncHandler(async (req, res) => {
    const { inscricaoId } = req.params;
    const inscricao = await prisma.inscricao.findUnique({
        where: { id: inscricaoId },
        include: { aula: true },
    });
    if (!inscricao) {
        throw new AppError(404, 'Inscrição não encontrada');
    }
    if (inscricao.aluno_id !== req.usuario.id) {
        throw new AppError(403, 'Você não tem permissão para cancelar esta inscrição');
    }
    // Deletar inscrição
    await prisma.inscricao.delete({
        where: { id: inscricaoId },
    });
    res.json({
        sucesso: true,
        mensagem: 'Inscrição cancelada com sucesso',
    });
});
/**
 * Remover inscrito (apenas admin)
 * DELETE /api/inscricoes/admin/:inscricaoId
 */
export const removerInscritoAdmin = asyncHandler(async (req, res) => {
    const { inscricaoId } = req.params;
    const { removerPagamento } = req.query;
    // Verificar se é admin
    if (!req.usuario?.isAdmin) {
        throw new AppError(403, 'Apenas administradores podem remover inscritos');
    }
    const inscricao = await prisma.inscricao.findUnique({
        where: { id: inscricaoId },
        include: {
            aula: true,
            pagamento: true,
        },
    });
    if (!inscricao) {
        throw new AppError(404, 'Inscrição não encontrada');
    }
    // Se removerPagamento, deletar o pagamento primeiro
    if (removerPagamento === 'true' && inscricao.pagamento) {
        await prisma.pagamento.delete({
            where: { id: inscricao.pagamento.id },
        });
    }
    // Deletar presença se existir
    await prisma.presenca.deleteMany({
        where: { inscricao_id: inscricaoId },
    });
    // Deletar inscrição
    await prisma.inscricao.delete({
        where: { id: inscricaoId },
    });
    res.json({
        sucesso: true,
        mensagem: removerPagamento === 'true'
            ? 'Inscrito e pagamento removidos com sucesso'
            : 'Inscrito removido com sucesso',
    });
});
export const atualizarPresenca = asyncHandler(async (req, res) => {
    const { inscricaoId } = req.params;
    const { presente } = req.body;
    // SEGURAN\u00c7A: Apenas admin pode atualizar presen\u00e7a
    if (!req.usuario?.isAdmin) {
        throw new AppError(403, 'Apenas administradores podem atualizar presen\u00e7a');
    }
    const inscricao = await prisma.inscricao.findUnique({
        where: { id: inscricaoId },
    });
    if (!inscricao) {
        throw new AppError(404, 'Inscri\u00e7\u00e3o n\u00e3o encontrada');
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
});
export const obterTodasInscricoes = asyncHandler(async (req, res) => {
    const isAdmin = req.usuario?.isAdmin;
    const userId = req.usuario?.id;
    // Admin vê todas as inscrições com dados completos
    // Alunos veem:
    //   - Todas inscrições CONFIRMADAS (para ver participantes)
    //   - Suas próprias inscrições (qualquer status, para saber se precisa pagar)
    const inscricoes = await prisma.inscricao.findMany({
        where: isAdmin
            ? {}
            : {
                OR: [
                    { status: 'confirmada' }, // Participantes confirmados
                    { aluno_id: userId } // Minhas inscrições (inclui pendentes)
                ]
            },
        include: {
            aluno: {
                select: isAdmin
                    ? { id: true, nome: true, email: true, telefone: true }
                    : { id: true, nome: true }, // Dados limitados para alunos
            },
            aula: {
                select: { id: true, titulo: true },
            },
            pagamento: isAdmin ? { select: { status: true } } : false,
        },
    });
    // Mapear 'aluno' para 'usuario' para compatibilidade com frontend
    // E incluir nome manual para inscrições sem conta
    const inscricoesFormatadas = inscricoes.map((insc) => ({
        ...insc,
        usuario: insc.aluno,
        alunoNome: insc.aluno?.nome || insc.nomeManual || 'Inscrito',
    }));
    res.json({
        sucesso: true,
        mensagem: 'Inscrições obtidas com sucesso',
        dados: inscricoesFormatadas,
    });
});
/**
 * Adicionar inscrito manualmente (apenas admin)
 * POST /api/inscricoes/admin/adicionar
 */
export const adicionarInscritoManual = asyncHandler(async (req, res) => {
    const { aulaId, nome, observacao } = req.body;
    if (!aulaId || !nome) {
        throw new AppError(400, 'ID da aula e nome são obrigatórios');
    }
    // Verificar se o usuário é admin
    if (!req.usuario?.isAdmin) {
        throw new AppError(403, 'Apenas administradores podem adicionar inscritos manualmente');
    }
    // Verificar se a aula existe e tem vagas
    // SÓ conta inscrições CONFIRMADAS para verificar vagas
    const aula = await prisma.aula.findUnique({
        where: { id: aulaId },
        include: {
            _count: {
                select: {
                    inscricoes: {
                        where: { status: 'confirmada' }
                    }
                }
            },
        },
    });
    if (!aula) {
        throw new AppError(404, 'Aula não encontrada');
    }
    // Calcular vagas disponíveis (apenas confirmadas ocupam vaga)
    const vagasDisponiveis = aula.vagas - aula._count.inscricoes;
    if (vagasDisponiveis <= 0) {
        throw new AppError(400, 'Aula sem vagas disponíveis');
    }
    // Criar inscrição manual já CONFIRMADA (ocupa vaga imediatamente)
    const novaInscricao = await prisma.inscricao.create({
        data: {
            aula_id: aulaId,
            nomeManual: nome,
            observacao: observacao || 'Adicionado manualmente pelo admin',
            status: 'confirmada',
        },
    });
    res.status(201).json({
        sucesso: true,
        mensagem: 'Inscrito adicionado com sucesso',
        dados: {
            ...novaInscricao,
            aluno: { nome: nome },
        },
    });
});
//# sourceMappingURL=inscricaoController.js.map