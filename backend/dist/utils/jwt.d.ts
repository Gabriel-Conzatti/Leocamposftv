import { JWTPayload } from '../types/index.js';
export declare const gerarToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const verificarToken: (token: string) => JWTPayload;
export declare const decodificarToken: (token: string) => JWTPayload | null;
//# sourceMappingURL=jwt.d.ts.map