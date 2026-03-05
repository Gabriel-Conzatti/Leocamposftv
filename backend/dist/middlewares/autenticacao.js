import { verificarToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
export const autenticacao = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            throw new AppError(401, 'Token não fornecido');
        }
        const token = header.slice(7);
        const payload = verificarToken(token);
        req.usuario = payload;
        next();
    }
    catch (erro) {
        if (erro instanceof AppError) {
            return res.status(erro.statusCode).json({
                sucesso: false,
                mensagem: erro.message,
                erro: erro.message,
            });
        }
        res.status(401).json({
            sucesso: false,
            mensagem: 'Não autenticado',
            erro: 'Token inválido ou expirado',
        });
    }
};
//# sourceMappingURL=autenticacao.js.map