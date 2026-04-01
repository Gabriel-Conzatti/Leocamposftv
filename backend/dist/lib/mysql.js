import mysql from 'mysql2/promise';
let pool = null;
const getPool = () => {
    if (pool) {
        return pool;
    }
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL não configurada');
    }
    const url = new URL(databaseUrl);
    pool = mysql.createPool({
        host: url.hostname,
        port: Number(url.port || '3306'),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ''),
        waitForConnections: true,
        connectionLimit: 2,
        connectTimeout: 10000,
    });
    return pool;
};
export const buscarUsuarioLogin = async (emailOuTelefone) => {
    const isEmail = emailOuTelefone.includes('@');
    const telefoneFormatado = emailOuTelefone.replace(/\D/g, '');
    const query = isEmail
        ? 'SELECT id, nome, email, telefone, senha, isAdmin FROM usuarios WHERE email = ? LIMIT 1'
        : 'SELECT id, nome, email, telefone, senha, isAdmin FROM usuarios WHERE telefone = ? LIMIT 1';
    const params = [isEmail ? emailOuTelefone : telefoneFormatado];
    const [rows] = await getPool().query(query, params);
    const usuarios = rows;
    if (!usuarios.length) {
        return null;
    }
    const usuario = usuarios[0];
    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone ?? null,
        senha: usuario.senha,
        isAdmin: Boolean(usuario.isAdmin),
    };
};
//# sourceMappingURL=mysql.js.map