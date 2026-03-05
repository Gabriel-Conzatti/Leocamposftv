import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types/index.js';
declare global {
    namespace Express {
        interface Request {
            usuario?: JWTPayload;
        }
    }
}
export declare const autenticacao: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=autenticacao.d.ts.map