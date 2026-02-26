import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';

export const verificarAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.usuario) {
    throw new AppError(401, 'Usuário não autenticado');
  }

  if (!req.usuario.isAdmin) {
    throw new AppError(403, 'Acesso negado. Apenas administradores podem executar essa ação.');
  }

  next();
};
