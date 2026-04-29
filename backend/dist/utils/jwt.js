import jwt from 'jsonwebtoken';
// IMPORTANTE: JWT_SECRET DEVE ser definido via variável de ambiente
// NUNCA use um fallback em produção
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ ERRO CRÍTICO: JWT_SECRET não configurado!');
    console.error('Configure a variável de ambiente JWT_SECRET antes de iniciar o servidor.');
    console.error('No Hostinger, acesse: Settings > Environment Variables');
    // Não fazer process.exit - deixar o servidor rodar e retornar erro descritivo no login
}
export const gerarToken = (payload) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado. Configure a variável de ambiente JWT_SECRET no painel Hostinger.');
    }
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d',
    });
};
export const verificarToken = (token) => {
    try {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET não configurado');
        }
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Token inválido ou expirado');
    }
};
export const decodificarToken = (token) => {
    try {
        return jwt.decode(token);
    }
    catch {
        return null;
    }
};
//# sourceMappingURL=jwt.js.map