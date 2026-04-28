import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';

// IMPORTANTE: JWT_SECRET DEVE ser definido via variável de ambiente.
// Não derrubamos o processo no boot para manter a API observável (health/logs).
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('ERRO CRITICO: JWT_SECRET nao configurado. Endpoints que usam JWT vao falhar ate configurar a variavel.');
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
