import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui';

export const gerarToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
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
