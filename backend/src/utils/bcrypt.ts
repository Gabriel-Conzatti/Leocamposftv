import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash uma senha com bcrypt
 */
export const hashSenha = async (senha: string): Promise<string> => {
  return bcrypt.hash(senha, SALT_ROUNDS);
};

/**
 * Compara uma senha com seu hash
 */
export const compararSenha = async (
  senha: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(senha, hash);
};
