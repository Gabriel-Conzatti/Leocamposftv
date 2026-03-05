import { Request, Response } from 'express';
export declare const inscreverAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const obterInscricoesAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const obterInscricoesUsuario: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const cancelarInscricao: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Remover inscrito (apenas admin)
 * DELETE /api/inscricoes/admin/:inscricaoId
 */
export declare const removerInscritoAdmin: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const atualizarPresenca: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const obterTodasInscricoes: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Adicionar inscrito manualmente (apenas admin)
 * POST /api/inscricoes/admin/adicionar
 */
export declare const adicionarInscritoManual: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=inscricaoController.d.ts.map