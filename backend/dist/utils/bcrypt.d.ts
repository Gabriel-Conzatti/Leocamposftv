/**
 * Hash uma senha com bcrypt
 */
export declare const hashSenha: (senha: string) => Promise<string>;
/**
 * Compara uma senha com seu hash
 */
export declare const compararSenha: (senha: string, hash: string) => Promise<boolean>;
//# sourceMappingURL=bcrypt.d.ts.map