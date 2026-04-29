import mysql from 'mysql2/promise';

type UsuarioLogin = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  senha: string;
  isAdmin: boolean;
};

let pool: mysql.Pool | null = null;
let poolIpv4: mysql.Pool | null = null;

const ERROS_TRANSITORIOS = new Set([
  'PROTOCOL_CONNECTION_LOST',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

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
  } as any);

  return poolIpv4;
};

const deveTentarIpv4 = (mensagemErro: string) => {
  const msg = mensagemErro.toLowerCase();
  return (
    (msg.includes('access denied') && msg.includes("'@")) ||
    msg.includes('enotfound') ||
    msg.includes('eai_again') ||
    msg.includes('connect etimedout') ||
    msg.includes('ehostunreach') ||
    msg.includes('enetunreach')
  );
};

const erroTransitorio = (error: any) => {
  const code = String(error?.code || '').toUpperCase();
  const msg = String(error?.message || '').toLowerCase();

  if (ERROS_TRANSITORIOS.has(code)) {
    return true;
  }

  return (
    msg.includes('pool is closed') ||
    msg.includes('cannot enqueue') ||
    msg.includes('connection is in closed state') ||
    msg.includes('connection lost') ||
    msg.includes('server has gone away') ||
    msg.includes('read econreset') ||
    msg.includes('socket hang up')
  );
};

const resetPools = async () => {
  const fechar = async (instancia: mysql.Pool | null) => {
    if (!instancia) {
      return;
    }
    await instancia.end().catch(() => undefined);
  };

  await Promise.all([fechar(pool), fechar(poolIpv4)]);
  pool = null;
  poolIpv4 = null;
};

const executarQueryResiliente = async (query: string, params: unknown[]) => {
  try {
    return await getPool().query(query, params);
  } catch (error: any) {
    const mensagem = String(error?.message || error || '');

    if (deveTentarIpv4(mensagem)) {
      try {
        return await getIpv4Pool().query(query, params);
      } catch (erroIpv4: any) {
        if (!erroTransitorio(erroIpv4)) {
          throw erroIpv4;
        }
      }
    }

    if (!erroTransitorio(error)) {
      throw error;
    }

    await resetPools();

    try {
      return await getPool().query(query, params);
    } catch (retryError: any) {
      const retryMsg = String(retryError?.message || retryError || '');
      if (deveTentarIpv4(retryMsg)) {
        return await getIpv4Pool().query(query, params);
      }
      throw retryError;
    }
  }
};

export const buscarUsuarioLogin = async (
  emailOuTelefone: string,
): Promise<UsuarioLogin | null> => {
  const identificador = String(emailOuTelefone || '').trim();
  const isEmail = identificador.includes('@');
  const telefoneFormatado = identificador.replace(/\D/g, '');
  const emailNormalizado = identificador.toLowerCase();

  const query = isEmail
    ? 'SELECT id, nome, email, telefone, senha, isAdmin FROM usuarios WHERE email = ? LIMIT 1'
    : 'SELECT id, nome, email, telefone, senha, isAdmin FROM usuarios WHERE telefone = ? LIMIT 1';

  const params = [isEmail ? emailNormalizado : telefoneFormatado];

  const [rows] = await executarQueryResiliente(query, params);

  const usuarios = rows as Array<any>;

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

export const testarConexaoMySQL = async (): Promise<[boolean, string | null]> => {
  try {
    await executarQueryResiliente('SELECT 1', []);
    return [true, null];
  } catch (error: any) {
    const mensagem = String(error?.message || 'Erro de conexão com banco');

    if (deveTentarIpv4(mensagem)) {
      try {
        await getIpv4Pool().query('SELECT 1');
        return [true, null];
      } catch (errorIpv4: any) {
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
  } catch (error: any) {
    return {
      erroParseDatabaseUrl: String(error?.message || error || 'Erro ao ler DATABASE_URL'),
    };
  }
};
