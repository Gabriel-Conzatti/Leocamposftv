import mysql from 'mysql2/promise';
let pool = null;
let poolIpv4 = null;
const getDbUrl = () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL não configurada');
    }
    return new URL(databaseUrl);
};
const getParsedDbInfo = () => {
    const url = getDbUrl();
    return {
        host: url.hostname,
        port: Number(url.port || '3306'),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ''),
    };
};
const getPool = () => {
    if (pool) {
        return pool;
    }
    const db = getParsedDbInfo();
    pool = mysql.createPool({
        host: db.host,
        port: db.port,
        user: db.user,
        password: db.password,
        database: db.database,
        waitForConnections: true,
        connectionLimit: 2,
        connectTimeout: 10000,
    });
    return pool;
};
const getIpv4Pool = () => {
    if (poolIpv4) {
        return poolIpv4;
    }
    const db = getParsedDbInfo();
    poolIpv4 = mysql.createPool({
        host: db.host,
        port: db.port,
        user: db.user,
        password: db.password,
        database: db.database,
        waitForConnections: true,
        connectionLimit: 2,
        connectTimeout: 10000,
        family: 4,
    });
    return poolIpv4;
};
const deveTentarIpv4 = (mensagemErro) => {
    return mensagemErro.includes('Access denied') && mensagemErro.includes("'@");
};
export const buscarUsuarioLogin = async (emailOuTelefone) => {
    const isEmail = emailOuTelefone.includes('@');
    const telefoneFormatado = emailOuTelefone.replace(/\D/g, '');
    const query = isEmail
        ? 'SELECT id, nome, email, telefone, senha, isAdmin FROM usuarios WHERE email = ? LIMIT 1'
        : 'SELECT id, nome, email, telefone, senha, isAdmin FROM usuarios WHERE telefone = ? LIMIT 1';
    const params = [isEmail ? emailOuTelefone : telefoneFormatado];
    let rows;
    try {
        [rows] = await getPool().query(query, params);
    }
    catch (error) {
        const mensagem = String(error?.message || error || '');
        if (deveTentarIpv4(mensagem)) {
            [rows] = await getIpv4Pool().query(query, params);
        }
        else {
            throw error;
        }
    }
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
export const testarConexaoMySQL = async () => {
    try {
        await getPool().query('SELECT 1');
        return [true, null];
    }
    catch (error) {
        const mensagem = String(error?.message || 'Erro de conexão com banco');
        if (deveTentarIpv4(mensagem)) {
            try {
                await getIpv4Pool().query('SELECT 1');
                return [true, null];
            }
            catch (errorIpv4) {
                const mensagemIpv4 = String(errorIpv4?.message || errorIpv4 || 'Erro de conexão com banco (IPv4)');
                return [false, `${mensagem} | fallback IPv4: ${mensagemIpv4}`];
            }
        }
        return [false, mensagem];
    }
};
export const obterResumoConexaoBanco = () => {
    try {
        const db = getParsedDbInfo();
        const senhaTemEspacos = db.password !== db.password.trim();
        return {
            host: db.host,
            port: db.port,
            database: db.database,
            userMascara: db.user ? `${db.user.slice(0, 3)}***` : null,
            senhaTamanho: db.password.length,
            senhaTemEspacos,
        };
    }
    catch (error) {
        return {
            erroParseDatabaseUrl: String(error?.message || error || 'Erro ao ler DATABASE_URL'),
        };
    }
};
//# sourceMappingURL=mysql.js.map