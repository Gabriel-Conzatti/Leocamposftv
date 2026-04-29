export class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
export const errorHandler = (err, _req, res, _next) => {
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
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=errors.js.map