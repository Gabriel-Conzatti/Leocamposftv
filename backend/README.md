# Backend - Sistema de Aulas de Futevolei

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do backend:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/futevolei
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRE=7d

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
MERCADO_PAGO_PUBLIC_KEY=sua_chave_publica_aqui

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Aulas
- `GET /api/aulas` - Listar todas as aulas
- `POST /api/aulas` - Criar nova aula (apenas professor)
- `GET /api/aulas/:id` - Obter detalhes da aula
- `PUT /api/aulas/:id` - Atualizar aula (apenas professor)
- `DELETE /api/aulas/:id` - Deletar aula (apenas professor)

### Inscrições
- `POST /api/inscricoes` - Inscrever em uma aula
- `GET /api/inscricoes/aula/:id` - Listar inscrições de uma aula
- `GET /api/inscricoes/usuario/:id` - Listar inscrições do usuário
- `DELETE /api/inscricoes/:id` - Cancelar inscrição

### Pagamentos
- `POST /api/pagamentos/criar` - Criar pagamento PIX
- `POST /api/pagamentos/webhook` - Webhook do Mercado Pago
- `GET /api/pagamentos/:id` - Status do pagamento

### Usuários
- `GET /api/usuarios/:id` - Obter perfil do usuário
- `PUT /api/usuarios/:id` - Atualizar perfil
- `GET /api/usuarios/:id/aulas` - Aulas do usuário (para alunos)
- `GET /api/usuarios/:id/turmas` - Turmas do professor
