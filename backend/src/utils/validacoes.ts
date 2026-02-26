import Joi from 'joi';

// Schemas de validação
export const registroSchema = Joi.object({
  nome: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nome deve ter no mínimo 3 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
    }),
  telefone: Joi.string()
    .pattern(/^\d{10,11}$/)
    .required()
    .messages({
      'string.pattern.base': 'Telefone inválido (10 ou 11 dígitos)',
      'any.required': 'Telefone é obrigatório',
    }),
  senha: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Senha deve ter no mínimo 6 caracteres',
      'any.required': 'Senha é obrigatória',
    }),
  confirmarSenha: Joi.string()
    .valid(Joi.ref('senha'))
    .required()
    .messages({
      'any.only': 'Senhas não conferem',
      'any.required': 'Confirmar senha é obrigatório',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
    }),
  senha: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha é obrigatória',
    }),
});

export const criarAulaSchema = Joi.object({
  titulo: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Título deve ter no mínimo 3 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'any.required': 'Título é obrigatório',
    }),
  descricao: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres',
    }),
  data: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
  )
    .required()
    .messages({
      'date.base': 'Data inválida',
      'string.pattern.base': 'Data inválida (formato YYYY-MM-DD)',
      'any.required': 'Data é obrigatória',
    }),
  horario: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Horário inválido (formato HH:MM)',
      'any.required': 'Horário é obrigatório',
    }),
  duracao: Joi.number()
    .min(15)
    .max(240)
    .required()
    .messages({
      'number.min': 'Duração mínima é 15 minutos',
      'number.max': 'Duração máxima é 240 minutos',
      'any.required': 'Duração é obrigatória',
    }),
  local: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Local deve ter no mínimo 3 caracteres',
      'string.max': 'Local deve ter no máximo 200 caracteres',
      'any.required': 'Local é obrigatório',
    }),
  preco: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Preço deve ser positivo',
      'any.required': 'Preço é obrigatório',
    }),
  vagas: Joi.number()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.min': 'Vagas mínimas é 1',
      'number.max': 'Vagas máximas é 100',
      'any.required': 'Vagas é obrigatório',
    }),
});

export const inscreverAulaSchema = Joi.object({
  aulaId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'ID da aula inválido',
      'any.required': 'ID da aula é obrigatório',
    })
    .optional() // Alguns IDs podem não ser UUID, deixar flexível
    .messages({
      'any.required': 'ID da aula é obrigatório',
    }),
});

export const pagamentoSchema = Joi.object({
  inscricaoId: Joi.string()
    .required()
    .messages({
      'any.required': 'ID da inscrição é obrigatório',
    }),
  valor: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Valor deve ser positivo',
      'any.required': 'Valor é obrigatório',
    }),
  metodo: Joi.string()
    .valid('pix', 'cartao')
    .optional()
    .messages({
      'any.only': 'Método deve ser pix ou cartao',
    }),
});
// Função para validar objeto contra schema
export const validar = (schema: Joi.ObjectSchema, obj: any) => {
  const { error, value } = schema.validate(obj, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const mensagens = error.details.map((d) => d.message).join('; ');
    return { valido: false, mensagens, value: null };
  }

  return { valido: true, mensagens: null, value };
};
