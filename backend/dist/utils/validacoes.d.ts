import Joi from 'joi';
export declare const registroSchema: Joi.ObjectSchema<any>;
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const criarAulaSchema: Joi.ObjectSchema<any>;
export declare const inscreverAulaSchema: Joi.ObjectSchema<any>;
export declare const pagamentoSchema: Joi.ObjectSchema<any>;
export declare const validar: (schema: Joi.ObjectSchema, obj: any) => {
    valido: boolean;
    mensagens: string;
    value: null;
} | {
    valido: boolean;
    mensagens: null;
    value: any;
};
//# sourceMappingURL=validacoes.d.ts.map