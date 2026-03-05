import { asyncHandler, AppError } from '../utils/errors.js';
import { gerarToken } from '../utils/jwt.js';
import { hashSenha, compararSenha } from '../utils/bcrypt.js';
import { validar, registroSchema, loginSchema } from '../utils/validacoes.js';
import prisma from '../lib/prisma.js';
import { enviarEmail, emailRecuperacaoSenha, emailSenhaAlterada } from '../services/emailService.js';
import jwt from 'jsonwebtoken';
export const registroController = asyncHandler(async (req, res) => {
    const { nome, email, telefone, senha, confirmarSenha } = req.body;
    // Validar dados de entrada com Joi
    const { valido, mensagens, value } = validar(registroSchema, {
        nome,
        email,
        telefone,
        senha,
        confirmarSenha,
    });
    if (!valido) {
        throw new AppError(400, mensagens || 'Dados inválidos');
    }
    // Verificar se email já existe
    const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: value.email },
    });
    if (usuarioExistente) {
        throw new AppError(400, 'Email já registrado');
    }
    // Verificar se telefone já existe
    const usuarioComTelefone = await prisma.usuario.findUnique({
        where: { telefone: value.telefone },
    });
    if (usuarioComTelefone) {
        throw new AppError(400, 'Telefone já registrado');
    }
    // Hash da senha com bcrypt
    const senhaHash = await hashSenha(value.senha);
    // Criar novo usuário
    const novoUsuario = await prisma.usuario.create({
        data: {
            nome: value.nome,
            email: value.email,
            telefone: value.telefone,
            senha: senhaHash,
        },
    });
    // Gerar token
    const token = gerarToken({
        id: novoUsuario.id,
        email: novoUsuario.email,
        isAdmin: novoUsuario.isAdmin,
    });
    const { senha: _, ...usuarioSemSenha } = novoUsuario;
    res.status(201).json({
        sucesso: true,
        mensagem: 'Usuário registrado com sucesso',
        dados: {
            usuario: usuarioSemSenha,
            token,
        },
    });
});
export const loginController = asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    // Validar dados de entrada com Joi
    const { valido, mensagens, value } = validar(loginSchema, {
        email,
        senha,
    });
    if (!valido) {
        throw new AppError(400, mensagens || 'Email/telefone ou senha inválidos');
    }
    // Verificar se é email ou telefone
    const isEmail = value.email.includes('@');
    const telefoneFormatado = value.email.replace(/\D/g, ''); // Remove caracteres não numéricos
    // Buscar usuário no banco por email ou telefone
    const usuario = await prisma.usuario.findFirst({
        where: isEmail
            ? { email: value.email }
            : { telefone: telefoneFormatado },
    });
    if (!usuario) {
        throw new AppError(401, 'Credenciais inválidas');
    }
    // Verificar senha com bcrypt
    const senhaValida = await compararSenha(value.senha, usuario.senha);
    if (!senhaValida) {
        throw new AppError(401, 'Credenciais inválidas');
    }
    // Gerar token
    const token = gerarToken({
        id: usuario.id,
        email: usuario.email,
        isAdmin: usuario.isAdmin,
    });
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.status(200).json({
        sucesso: true,
        mensagem: 'Login realizado com sucesso',
        dados: {
            usuario: usuarioSemSenha,
            token,
        },
    });
});
export const logoutController = asyncHandler(async (req, res) => {
    // Token é gerenciado no frontend (localStorage)
    // Backend apenas confirma logout
    res.json({
        sucesso: true,
        mensagem: 'Logout realizado com sucesso',
    });
});
/**
 * Solicitar Recuperação de Senha
 * POST /api/auth/solicitar-recuperacao
 */
export const solicitarRecuperacaoSenha = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        throw new AppError(400, 'Email é obrigatório');
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new AppError(400, 'Email inválido');
    }
    // Buscar usuário pelo email
    const usuario = await prisma.usuario.findUnique({
        where: { email: email.toLowerCase() },
    });
    // Por segurança, sempre retornar sucesso mesmo se usuário não existir
    // (não revelar se email está cadastrado ou não)
    if (!usuario) {
        console.log(`⚠️ Tentativa de recuperação para email não cadastrado: ${email}`);
        return res.json({
            sucesso: true,
            mensagem: 'Se o email estiver cadastrado, você receberá um link de recuperação',
        });
    }
    // Gerar token JWT temporário (expira em 1 hora)
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        console.error('\u274c JWT_SECRET n\u00e3o configurado!');
        throw new AppError(500, 'Erro interno do servidor');
    }
    const tokenRecuperacao = jwt.sign({
        id: usuario.id,
        email: usuario.email,
        tipo: 'recuperacao-senha',
    }, JWT_SECRET, { expiresIn: '1h' } // Token expira em 1 hora
    );
    console.log(`📧 Enviando email de recuperação para: ${usuario.email}`);
    // Enviar email com link de recuperação
    const assunto = '[FutevoleiPro] Recuperação de Senha';
    const html = emailRecuperacaoSenha(usuario.nome, tokenRecuperacao);
    const emailEnviado = await enviarEmail({
        para: usuario.email,
        assunto,
        html,
    });
    if (!emailEnviado) {
        console.error('❌ Falha ao enviar email de recuperação');
        // Não revelar ao usuário que o email falhou (segurança)
    }
    res.json({
        sucesso: true,
        mensagem: 'Se o email estiver cadastrado, você receberá um link de recuperação',
    });
});
/**
 * Resetar Senha com Token
 * POST /api/auth/resetar-senha
 */
export const resetarSenha = asyncHandler(async (req, res) => {
    const { token, novaSenha, confirmarNovaSenha } = req.body;
    // Validar campos obrigatórios
    if (!token || typeof token !== 'string') {
        throw new AppError(400, 'Token é obrigatório');
    }
    if (!novaSenha || typeof novaSenha !== 'string') {
        throw new AppError(400, 'Nova senha é obrigatória');
    }
    if (!confirmarNovaSenha || typeof confirmarNovaSenha !== 'string') {
        throw new AppError(400, 'Confirmação de senha é obrigatória');
    }
    // Validar senhas iguais
    if (novaSenha !== confirmarNovaSenha) {
        throw new AppError(400, 'As senhas não coincidem');
    }
    // Validar força da senha
    if (novaSenha.length < 6) {
        throw new AppError(400, 'Senha deve ter no mínimo 6 caracteres');
    }
    // Verificar e decodificar token
    let payload;
    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            throw new AppError(500, 'Erro interno do servidor');
        }
        payload = jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError(400, 'Token expirado. Solicite uma nova recuperação de senha');
        }
        throw new AppError(400, 'Token inválido');
    }
    // Verificar se é token de recuperação
    if (payload.tipo !== 'recuperacao-senha') {
        throw new AppError(400, 'Token inválido para recuperação de senha');
    }
    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
        where: { id: payload.id },
    });
    if (!usuario) {
        throw new AppError(404, 'Usuário não encontrado');
    }
    // Hash da nova senha
    const novaSenhaHash = await hashSenha(novaSenha);
    // Atualizar senha no banco
    await prisma.usuario.update({
        where: { id: usuario.id },
        data: { senha: novaSenhaHash },
    });
    console.log(`✅ Senha resetada com sucesso para: ${usuario.email}`);
    // Enviar email de confirmação
    const dataHora = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'long',
        timeStyle: 'short',
    });
    const assunto = '[FutevoleiPro] Senha Alterada com Sucesso';
    const html = emailSenhaAlterada(usuario.nome, dataHora);
    await enviarEmail({
        para: usuario.email,
        assunto,
        html,
    });
    res.json({
        sucesso: true,
        mensagem: 'Senha alterada com sucesso! Você já pode fazer login com a nova senha',
    });
});
/**
 * Atualizar Perfil do Usuário
 * PUT /api/auth/perfil
 */
export const atualizarPerfil = asyncHandler(async (req, res) => {
    const { nome, telefone, senhaAtual, novaSenha } = req.body;
    const usuarioId = req.usuario.id;
    // Buscar usuário atual
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
    });
    if (!usuario) {
        throw new AppError(404, 'Usuário não encontrado');
    }
    const dadosAtualizacao = {};
    // Atualizar nome se fornecido
    if (nome && nome.trim() !== '') {
        if (nome.length < 3) {
            throw new AppError(400, 'Nome deve ter no mínimo 3 caracteres');
        }
        dadosAtualizacao.nome = nome.trim();
    }
    // Atualizar telefone se fornecido
    if (telefone && telefone.trim() !== '') {
        // Validar formato do telefone
        const telefoneLimpo = telefone.replace(/\D/g, '');
        if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
            throw new AppError(400, 'Telefone inválido');
        }
        // Verificar se telefone já está em uso por outro usuário
        const telefoneEmUso = await prisma.usuario.findFirst({
            where: {
                telefone: telefone,
                id: { not: usuarioId },
            },
        });
        if (telefoneEmUso) {
            throw new AppError(400, 'Telefone já está em uso por outro usuário');
        }
        dadosAtualizacao.telefone = telefone;
    }
    // Atualizar senha se fornecida
    if (novaSenha) {
        if (!senhaAtual) {
            throw new AppError(400, 'Senha atual é obrigatória para alterar a senha');
        }
        // Verificar senha atual
        const senhaValida = await compararSenha(senhaAtual, usuario.senha);
        if (!senhaValida) {
            throw new AppError(400, 'Senha atual incorreta');
        }
        // Validar nova senha
        if (novaSenha.length < 6) {
            throw new AppError(400, 'Nova senha deve ter no mínimo 6 caracteres');
        }
        dadosAtualizacao.senha = await hashSenha(novaSenha);
    }
    // Se não há nada para atualizar
    if (Object.keys(dadosAtualizacao).length === 0) {
        throw new AppError(400, 'Nenhum dado para atualizar');
    }
    // Atualizar usuário
    const usuarioAtualizado = await prisma.usuario.update({
        where: { id: usuarioId },
        data: dadosAtualizacao,
    });
    const { senha: _, ...usuarioSemSenha } = usuarioAtualizado;
    res.json({
        sucesso: true,
        mensagem: 'Perfil atualizado com sucesso',
        dados: { usuario: usuarioSemSenha },
    });
});
/**
 * Obter Perfil do Usuário Logado
 * GET /api/auth/perfil
 */
export const obterPerfil = asyncHandler(async (req, res) => {
    const usuarioId = req.usuario.id;
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            isAdmin: true,
            createdAt: true,
        },
    });
    if (!usuario) {
        throw new AppError(404, 'Usuário não encontrado');
    }
    res.json({
        sucesso: true,
        mensagem: 'Perfil obtido com sucesso',
        dados: { usuario },
    });
});
// Obter contato do admin (Leo Campos) para recuperação de senha
export const obterContatoAdmin = asyncHandler(async (req, res) => {
    // Buscar o Leo Campos especificamente pelo email
    const admin = await prisma.usuario.findUnique({
        where: { email: 'leo1907campos@hotmail.com' },
        select: {
            nome: true,
            telefone: true,
        },
    });
    if (!admin || !admin.telefone) {
        throw new AppError(404, 'Contato do admin não encontrado');
    }
    res.json({
        sucesso: true,
        dados: {
            nome: admin.nome,
            telefone: admin.telefone,
        },
    });
});
/**
 * Listar todos os usuários (apenas admin)
 * GET /api/auth/usuarios
 */
export const listarUsuarios = asyncHandler(async (req, res) => {
    // Verificar se é admin
    if (!req.usuario?.isAdmin) {
        throw new AppError(403, 'Apenas administradores podem listar usuários');
    }
    const usuarios = await prisma.usuario.findMany({
        select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            isAdmin: true,
        },
        orderBy: { nome: 'asc' },
    });
    res.json({
        sucesso: true,
        dados: usuarios,
    });
});
//# sourceMappingURL=authController.js.map