type UsuarioLogin = {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    senha: string;
    isAdmin: boolean;
};
export declare const buscarUsuarioLogin: (emailOuTelefone: string) => Promise<UsuarioLogin | null>;
export declare const testarConexaoMySQL: () => Promise<[boolean, string | null]>;
export declare const obterResumoConexaoBanco: () => {
    host: string;
    port: number;
    database: string;
    userMascara: string | null;
    senhaTamanho: number;
    senhaTemEspacos: boolean;
    erroParseDatabaseUrl?: undefined;
} | {
    erroParseDatabaseUrl: string;
    host?: undefined;
    port?: undefined;
    database?: undefined;
    userMascara?: undefined;
    senhaTamanho?: undefined;
    senhaTemEspacos?: undefined;
};
export {};
//# sourceMappingURL=mysql.d.ts.map