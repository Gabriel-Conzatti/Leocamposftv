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
export {};
//# sourceMappingURL=mysql.d.ts.map