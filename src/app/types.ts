export interface Aula {
  id: string;
  titulo: string;
  descricao?: string;
  professorId?: string;
  professor_id?: string; // para compatibilidade com API
  data: string; // formato YYYY-MM-DD
  horario: string; // formato HH:MM
  duracao: number; // em minutos
  local: string;
  vagas: number;
  vagasDisponiveis: number;
  preco: number;
  status: 'aberta' | 'cheia' | 'cancelada' | 'finalizada';
  criadaEm?: string;
  atualizadaEm?: string;
  createdAt?: string; // para compatibilidade com API
  updatedAt?: string; // para compatibilidade com API
  professor?: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface Inscricao {
  id: string;
  aluno_id: string;
  aula_id: string;
  alunoId?: string;
  aulaId?: string;
  alunoNome?: string;
  nomeManual?: string;
  status?: 'pendente' | 'confirmada' | 'cancelada';
  statusPagamento?: 'pendente' | 'pago' | 'cancelado' | 'reembolsado';
  valorPago?: number;
  inscritoEm?: string;
  pagamentoEm?: string;
  pixCodigo?: string;
  mercadoPagoId?: string;
  dataPresenca?: string;
  presente?: boolean;
  pagamento?: {
    id: string;
    status: string;
    metodo: string;
  };
  aula?: {
    id: string;
    titulo: string;
    data?: string;
    preco?: number;
    local?: string;
  };
  aluno?: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagamento {
  id: string;
  inscricaoId: string;
  alunoId: string;
  valor: number;
  status: 'pendente' | 'processando' | 'aprovado' | 'rejeitado' | 'cancelado';
  metodo: 'pix' | 'cartao';
  mercadoPagoId?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  createdAt?: string;
  updatedAt?: string;
  pagamentoEm?: string;
}

export interface APIResponse<T = any> {
  sucesso: boolean;
  mensagem?: string;
  dados?: T;
  erro?: string;
}
