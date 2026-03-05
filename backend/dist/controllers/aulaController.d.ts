import { Request, Response } from 'express';
export declare const listarAulas: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const obterAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const criarAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const atualizarAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deletarAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const obterAulasProfessor: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Notificar todos os alunos sobre uma nova aula disponível
 * POST /api/aulas/:aulaId/notificar
 */
export declare const notificarAlunosSobreNovaAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Cancelar aula e notificar todos os alunos inscritos
 * PUT /api/aulas/:aulaId/cancelar
 */
export declare const cancelarAulaComNotificacao: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const listarInscritosAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const confirmarAula: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=aulaController.d.ts.map