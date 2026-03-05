interface EmailOpcoes {
    para: string;
    assunto: string;
    html: string;
}
/**
 * Envia um email genérico
 */
export declare const enviarEmail: (opcoes: EmailOpcoes) => Promise<boolean>;
/**
 * Template: Confirmação de Nova Inscrição
 */
export declare const emailNovaInscricao: (nomeAluno: string, nomeAula: string, dataAula: string, horarioAula: string, localAula: string, preco: number) => string;
/**
 * Template: Confirmação de Pagamento
 */
export declare const emailConfirmacaoPagamento: (nomeAluno: string, nomeAula: string, dataAula: string, horarioAula: string, localAula: string, preco: number) => string;
/**
 * Template: Nova Aula Disponível
 */
export declare const emailNovaAulaDisponivel: (nomeAluno: string, nomeAula: string, dataAula: string, horarioAula: string, localAula: string, descricao: string, preco: number) => string;
/**
 * Template: Aviso de Agendamento / Lembrete 24h Antes
 */
export declare const emailLembreteAula: (nomeAluno: string, nomeAula: string, dataAula: string, horarioAula: string, localAula: string, professorNome: string) => string;
/**
 * Template: Cancelamento de Aula
 */
export declare const emailAulaCancelada: (nomeAluno: string, nomeAula: string, dataAula: string, horarioAula: string, motivo?: string) => string;
/**
 * Template: Aula Confirmada (enviado pelo professor)
 */
export declare const emailAulaConfirmada: (nomeAluno: string, nomeAula: string, dataAula: string, horarioAula: string, localAula: string, professorNome: string, observacoes?: string) => string;
/**
 * Template: Confirmação de Inscrição (Alerta Genérico)
 */
export declare const emailAvisoAgendamento: (nomeAluno: string, nomeAula: string, dataAula: string, horarioAula: string) => string;
/**
 * Template: Recuperação de Senha
 */
export declare const emailRecuperacaoSenha: (nomeUsuario: string, tokenReset: string, urlFrontend?: string) => string;
/**
 * Template: Confirmação de Senha Alterada
 */
export declare const emailSenhaAlterada: (nomeUsuario: string, dataHora: string) => string;
export {};
//# sourceMappingURL=emailService.d.ts.map