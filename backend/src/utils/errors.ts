import express, { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      sucesso: false,
      mensagem: err.message,
      erro: err.message,
    });
  }

  console.error('Erro não tratado:', err);

  // Em produção, mostrar erro se for sobre variáveis de ambiente (temporary debugging)
  const isEnvError = err.message?.includes('JWT_SECRET') || err.message?.includes('DATABASE_URL');
  
  res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno do servidor',
    erro: process.env.NODE_ENV === 'development' || isEnvError ? err.message : undefined,
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
