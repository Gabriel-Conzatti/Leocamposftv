import { Request, Response } from 'express';
export declare const registroController: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const loginController: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const logoutController: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Solicitar Recuperação de Senha
 * POST /api/auth/solicitar-recuperacao
 */
export declare const solicitarRecuperacaoSenha: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Resetar Senha com Token
 * POST /api/auth/resetar-senha
 */
export declare const resetarSenha: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Atualizar Perfil do Usuário
 * PUT /api/auth/perfil
 */
export declare const atualizarPerfil: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Obter Perfil do Usuário Logado
 * GET /api/auth/perfil
 */
export declare const obterPerfil: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const obterContatoAdmin: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=authController.d.ts.map