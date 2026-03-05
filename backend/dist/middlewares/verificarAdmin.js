import { AppError } from '../utils/errors.js';
export const verificarAdmin = (req, res, next) => {
    if (!req.usuario) {
        throw new AppError(401, 'Usuário não autenticado');
    }
    if (!req.usuario.isAdmin) {
        throw new AppError(403, 'Acesso negado. Apenas administradores podem executar essa ação.');
    }
    next();
};
//# sourceMappingURL=verificarAdmin.js.map