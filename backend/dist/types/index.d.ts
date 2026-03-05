export interface Usuario {
    id: string;
    nome: string;
    email: string;
    senha?: string;
    telefone?: string;
    dataNascimento?: string;
    criadoEm: string;
    atualizadoEm: string;
}
export interface Aula {
    id: string;
    professorId: string;
    data: string;
    horario: string;
    local: string;
    vagasTotal: number;
    vagasDisponiveis: number;
    valor: number;
    status: 'aberta' | 'cheia' | 'cancelada' | 'finalizada';
    descricao?: string;
    criadaEm: string;
    atualizadaEm: string;
}
export interface Inscricao {
    id: string;
    aulaId: string;
    alunoId: string;
    alunoNome: string;
    statusPagamento: 'pendente' | 'pago' | 'cancelado' | 'reembolsado';
    valorPago: number;
    inscritoEm: string;
    pagamentoEm?: string;
    pixCodigo?: string;
    mercadoPagoId?: string;
    dataPresenca?: string;
    presente?: boolean;
}
export interface Pagamento {
    id: string;
    inscricaoId: string;
    alunoId: string;
    valor: number;
    status: 'pendente' | 'processando' | 'aprovado' | 'rejeitado' | 'cancelado';
    tipo: 'pix' | 'cartao' | 'boleto';
    mercadoPagoId?: string;
    pixQRCode?: string;
    pixCopyPaste?: string;
    criadoEm: string;
    atualizadoEm: string;
    pagamentoEm?: string;
}
export interface JWTPayload {
    id: string;
    email: string;
    isAdmin: boolean;
    iat?: number;
    exp?: number;
}
export interface APIResponse<T = any> {
    sucesso: boolean;
    mensagem: string;
    dados?: T;
    erro?: string;
}
export interface PaginadoResponse<T> {
    itens: T[];
    total: number;
    pagina: number;
    totalPaginas: number;
}
//# sourceMappingURL=index.d.ts.map