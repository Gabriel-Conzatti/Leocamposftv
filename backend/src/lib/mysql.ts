import mysql from 'mysql2/promise';

type UsuarioLogin = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  senha: string;
  isAdmin: boolean;
};

type UsuarioLista = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  isAdmin: boolean;
};

let pool: mysql.Pool | null = null;

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

export const buscarUsuarioLogin = async (
  emailOuTelefone: string,
): Promise<UsuarioLogin | null> => {
  const isEmail = emailOuTelefone.includes('@');
  const telefoneFormatado = emailOuTelefone.replace(/\D/g, '');

  const query = isEmail
    ? 'SELECT id, nome, email, telefone, senha, isAdmin FROM usuarios WHERE email = ? LIMIT 1'
    : 'SELECT id, nome, email, telefone, senha, isAdmin FROM usuarios WHERE telefone = ? LIMIT 1';

  const params = [isEmail ? emailOuTelefone : telefoneFormatado];

  const [rows] = await getPool().query(query, params);
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

export const listarUsuariosMysql = async (): Promise<UsuarioLista[]> => {
  const query = 'SELECT id, nome, email, telefone, isAdmin FROM usuarios ORDER BY nome ASC';

  const [rows] = await getPool().query(query);
  const usuarios = rows as Array<any>;

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone ?? null,
    isAdmin: Boolean(usuario.isAdmin),
  }));
};
