import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10;
/**
 * Hash uma senha com bcrypt
 */
export const hashSenha = async (senha) => {
    return bcrypt.hash(senha, SALT_ROUNDS);
};
/**
 * Compara uma senha com seu hash
 */
export const compararSenha = async (senha, hash) => {
    return bcrypt.compare(senha, hash);
};
//# sourceMappingURL=bcrypt.js.map