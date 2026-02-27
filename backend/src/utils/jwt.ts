import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';

// IMPORTANTE: JWT_SECRET DEVE ser definido via variável de ambiente
// NUNCA use um fallback em produção
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('\u274c ERRO CR\u00cdTICO: JWT_SECRET n\u00e3o configurado!');
  console.error('Configure a vari\u00e1vel de ambiente JWT_SECRET antes de iniciar o servidor.');
  // Em produ\u00e7\u00e3o, isso impede o servidor de iniciar sem configura\u00e7\u00e3o adequada
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const gerarToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET n\u00e3o configurado. Configure a vari\u00e1vel de ambiente.');
  }
  return jwt.sign(payload as any, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const verificarToken = (token: string): JWTPayload => {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado');
    }
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};

export const decodificarToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};
