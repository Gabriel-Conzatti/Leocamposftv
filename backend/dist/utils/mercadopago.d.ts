import 'dotenv/config';
export declare const criarPagamentoPix: (dados: {
    titulo: string;
    descricao: string;
    valor: number;
    email: string;
    nomeAluno: string;
    aulaId: string;
    inscricaoId: string;
}) => Promise<{
    id: any;
    status: any;
    qrCodeBase64: any;
    qrCode: any;
    ticketUrl: any;
    isPix: boolean;
} | null>;
export declare const criarPreferencaPagamento: (dados: {
    titulo: string;
    descricao: string;
    valor: number;
    email: string;
    nomeAluno: string;
    aulaId: string;
    inscricaoId: string;
}) => Promise<{
    id: any;
    init_point: any;
    qrData: any;
    qrCodeBase64: any;
    isPix: boolean;
    isSimulated: boolean;
} | {
    id: any;
    init_point: any;
    qrData: any;
    isPix: boolean;
    isSimulated: boolean;
    qrCodeBase64?: undefined;
}>;
export declare const buscarPagamentosPorReferencia: (externalReference: string) => Promise<any>;
export declare const obterStatusPagamento: (paymentId: string) => Promise<{
    id: string;
    status: string;
}>;
export declare const verificarWebhookMercadoPago: (signature: string, body: any) => any;
declare const _default: {
    criarPreferencaPagamento: (dados: {
        titulo: string;
        descricao: string;
        valor: number;
        email: string;
        nomeAluno: string;
        aulaId: string;
        inscricaoId: string;
    }) => Promise<{
        id: any;
        init_point: any;
        qrData: any;
        qrCodeBase64: any;
        isPix: boolean;
        isSimulated: boolean;
    } | {
        id: any;
        init_point: any;
        qrData: any;
        isPix: boolean;
        isSimulated: boolean;
        qrCodeBase64?: undefined;
    }>;
    criarPagamentoPix: (dados: {
        titulo: string;
        descricao: string;
        valor: number;
        email: string;
        nomeAluno: string;
        aulaId: string;
        inscricaoId: string;
    }) => Promise<{
        id: any;
        status: any;
        qrCodeBase64: any;
        qrCode: any;
        ticketUrl: any;
        isPix: boolean;
    } | null>;
    obterStatusPagamento: (paymentId: string) => Promise<{
        id: string;
        status: string;
    }>;
    verificarWebhookMercadoPago: (signature: string, body: any) => any;
    buscarPagamentosPorReferencia: (externalReference: string) => Promise<any>;
};
export default _default;
//# sourceMappingURL=mercadopago.d.ts.map