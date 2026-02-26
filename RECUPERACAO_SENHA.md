# 🔐 Recuperação de Senha via Email

Sistema completo de recuperação de senha para alunos via email.

## 📋 Funcionalidades

### 1️⃣ Solicitar Recuperação
- **Endpoint**: `POST /api/auth/solicitar-recuperacao`
- **Autenticação**: Não requerida (rota pública)
- **Body**:
```json
{
  "email": "aluno@example.com"
}
```
- **Resposta**:
```json
{
  "sucesso": true,
  "mensagem": "Se o email estiver cadastrado, você receberá um link de recuperação"
}
```

**⚡ O que acontece:**
1. Sistema busca usuário pelo email
2. Gera token JWT temporário (válido por 1 hora)
3. Envia email com link de recuperação
4. Por segurança, sempre retorna sucesso (não revela se email existe)

### 2️⃣ Resetar Senha
- **Endpoint**: `POST /api/auth/resetar-senha`
- **Autenticação**: Não requerida (usa token do email)
- **Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "novaSenha": "minhaNovaSenha123",
  "confirmarNovaSenha": "minhaNovaSenha123"
}
```
- **Resposta**:
```json
{
  "sucesso": true,
  "mensagem": "Senha alterada com sucesso! Você já pode fazer login com a nova senha"
}
```

**⚡ O que acontece:**
1. Valida o token JWT (verifica se não expirou)
2. Verifica se as senhas coincidem
3. Valida força da senha (mínimo 6 caracteres)
4. Atualiza senha no banco (com hash bcrypt)
5. Envia email de confirmação

## 📧 Emails Enviados

### Email de Recuperação
**Assunto**: [FutevoleiPro] Recuperação de Senha

**Conteúdo**:
- Saudação personalizada com nome do usuário
- Botão/link para redefinir senha
- Link formato: `http://localhost:5173/recuperar-senha?token={JWT}`
- Aviso de expiração (1 hora)
- Dicas de segurança
- Design profissional HTML/CSS

### Email de Confirmação
**Assunto**: [FutevoleiPro] Senha Alterada com Sucesso

**Conteúdo**:
- Confirmação de alteração
- Data e hora da mudança
- Alerta de segurança ("Se não foi você, contate imediatamente")
- Dicas de proteção de conta

## ⚙️ Configuração

### 1. Variáveis de Ambiente
Adicione no `.env`:
```env
# JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Frontend (para links no email)
FRONTEND_URL=http://localhost:5173

# SMTP (para envio de emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

### 2. Token de Recuperação
- **Tipo**: JWT
- **Validade**: 1 hora
- **Payload**:
```json
{
  "id": 123,
  "email": "aluno@example.com",
  "tipo": "recuperacao-senha",
  "iat": 1234567890,
  "exp": 1234571490
}
```

## 🛡️ Segurança

### Medidas Implementadas:
1. ✅ **Token temporário** - Expira em 1 hora
2. ✅ **Tipo específico** - Token só serve para recuperação (`tipo: 'recuperacao-senha'`)
3. ✅ **Não revela existência** - Sempre retorna sucesso na solicitação
4. ✅ **Senha forte** - Mínimo 6 caracteres
5. ✅ **Confirmação dupla** - Exige confirmar nova senha
6. ✅ **Hash bcrypt** - Senha nunca é armazenada em texto plano
7. ✅ **Email de confirmação** - Notifica usuário sobre mudança
8. ✅ **Logs seguros** - Não loga senhas, apenas eventos

### Ataques Prevenidos:
- ❌ Enumeração de usuários (sempre retorna sucesso)
- ❌ Token replay (expira em 1h)
- ❌ Uso incorreto de token (valida tipo)
- ❌ Força bruta (token único por solicitação)

## 🎨 Frontend - Telas Necessárias

### 1. Página "Esqueci minha senha"
**Rota**: `/esqueci-senha`

```tsx
// Exemplo de componente
function EsqueciSenha() {
  const [email, setEmail] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:3001/api/auth/solicitar-recuperacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    // Mostrar mensagem de sucesso
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Digite seu email"
      />
      <button type="submit">Enviar link de recuperação</button>
    </form>
  );
}
```

### 2. Página "Redefinir senha"
**Rota**: `/recuperar-senha?token={JWT}`

```tsx
// Exemplo de componente
function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:3001/api/auth/resetar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token,
        novaSenha,
        confirmarNovaSenha: confirmarSenha
      })
    });
    const data = await response.json();
    // Redirecionar para login
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="password" 
        value={novaSenha}
        onChange={(e) => setNovaSenha(e.target.value)}
        placeholder="Nova senha"
      />
      <input 
        type="password" 
        value={confirmarSenha}
        onChange={(e) => setConfirmarSenha(e.target.value)}
        placeholder="Confirmar nova senha"
      />
      <button type="submit">Redefinir senha</button>
    </form>
  );
}
```

### 3. Link na página de Login
```tsx
<Link to="/esqueci-senha">Esqueci minha senha</Link>
```

## 🧪 Testes

### Teste 1: Solicitar Recuperação
```bash
curl -X POST http://localhost:3001/api/auth/solicitar-recuperacao \
  -H "Content-Type: application/json" \
  -d '{"email":"aluno@example.com"}'
```

**Verificar**: Email deve chegar com link contendo token

### Teste 2: Resetar Senha
```bash
curl -X POST http://localhost:3001/api/auth/resetar-senha \
  -H "Content-Type: application/json" \
  -d '{
    "token":"TOKEN_DO_EMAIL",
    "novaSenha":"novaSenha123",
    "confirmarNovaSenha":"novaSenha123"
  }'
```

**Verificar**: 
- Senha deve ser alterada
- Email de confirmação deve ser enviado
- Login deve funcionar com nova senha

### Teste 3: Token Expirado
```bash
# Espere 1 hora após solicitar recuperação
curl -X POST http://localhost:3001/api/auth/resetar-senha \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_EXPIRADO","novaSenha":"123","confirmarNovaSenha":"123"}'
```

**Resultado esperado**:
```json
{
  "sucesso": false,
  "erro": "Token expirado. Solicite uma nova recuperação de senha"
}
```

### Teste 4: Senhas Diferentes
```bash
curl -X POST http://localhost:3001/api/auth/resetar-senha \
  -H "Content-Type: application/json" \
  -d '{
    "token":"TOKEN_VALIDO",
    "novaSenha":"senha123",
    "confirmarNovaSenha":"senha456"
  }'
```

**Resultado esperado**:
```json
{
  "sucesso": false,
  "erro": "As senhas não coincidem"
}
```

### Teste 5: Email Não Cadastrado
```bash
curl -X POST http://localhost:3001/api/auth/solicitar-recuperacao \
  -H "Content-Type: application/json" \
  -d '{"email":"naoexiste@example.com"}'
```

**Resultado esperado**: Sucesso (por segurança, não revela que email não existe)

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                     RECUPERAÇÃO DE SENHA                        │
└─────────────────────────────────────────────────────────────────┘

1. ALUNO ESQUECE SENHA
   │
   ├─► Acessa página "Esqueci minha senha"
   │
   └─► Digite email e clica "Enviar"

2. BACKEND PROCESSA SOLICITAÇÃO
   │
   ├─► Busca usuário no banco
   │
   ├─► Gera token JWT (validade: 1h)
   │
   └─► Envia email com link de recuperação

3. ALUNO RECEBE EMAIL
   │
   ├─► Email: "Recuperação de Senha"
   │
   ├─► Link: http://localhost:5173/recuperar-senha?token=...
   │
   └─► Clica no link (válido por 1 hora)

4. ALUNO REDEFINE SENHA
   │
   ├─► Página carrega com token na URL
   │
   ├─► Digite nova senha (2x)
   │
   └─► Clica "Redefinir"

5. BACKEND VALIDA E ATUALIZA
   │
   ├─► Verifica token (JWT válido?)
   │
   ├─► Valida senhas (coincidem? força ok?)
   │
   ├─► Atualiza senha no banco (hash bcrypt)
   │
   └─► Envia email de confirmação

6. ALUNO CONFIRMA
   │
   ├─► Email: "Senha Alterada com Sucesso"
   │
   └─► Faz login com nova senha
```

## 🎯 Checklist de Implementação

### Backend ✅
- [x] Função `solicitarRecuperacaoSenha` em authController
- [x] Função `resetarSenha` em authController
- [x] Rotas POST `/api/auth/solicitar-recuperacao`
- [x] Rotas POST `/api/auth/resetar-senha`
- [x] Email template `emailRecuperacaoSenha`
- [x] Email template `emailSenhaAlterada`
- [x] Validação de token JWT com tipo específico
- [x] Validação de força de senha
- [x] Logs de segurança

### Frontend ⏳
- [ ] Página `/esqueci-senha`
- [ ] Página `/recuperar-senha`
- [ ] Link "Esqueci minha senha" na página de login
- [ ] Validação de formulários
- [ ] Mensagens de erro/sucesso
- [ ] Redirecionamento após sucesso

### Testes ⏳
- [ ] Teste de solicitação com email válido
- [ ] Teste de solicitação com email inválido
- [ ] Teste de reset com token válido
- [ ] Teste de reset com token expirado
- [ ] Teste de reset com token inválido
- [ ] Teste de senhas que não coincidem
- [ ] Teste de senha muito curta
- [ ] Verificar recebimento de emails

### Documentação ✅
- [x] README de recuperação de senha
- [x] Exemplos de API
- [x] Código de exemplo frontend
- [x] Fluxo completo
- [x] Checklist de segurança

## 🚨 Erros Comuns e Soluções

### Email não chega
**Problema**: Email de recuperação não é recebido
**Solução**: 
1. Verifique configuração SMTP no `.env`
2. Verifique pasta de spam
3. Teste com outro provedor (Gmail, SendGrid, etc.)

### Token expirado
**Problema**: Usuário demora mais de 1h para usar o link
**Solução**: Solicitar nova recuperação de senha

### Senhas não coincidem
**Problema**: Frontend permite senhas diferentes
**Solução**: Adicionar validação no frontend antes de enviar

### Token inválido
**Problema**: Token foi modificado ou é de outro tipo
**Solução**: Garantir que token vem da URL sem alterações

## 📚 Arquivos Modificados

```
backend/
├── src/
│   ├── controllers/
│   │   └── authController.ts          ← Adicionadas 2 funções
│   ├── routes/
│   │   └── authRoutes.ts             ← Adicionadas 2 rotas
│   └── services/
│       └── emailService.ts            ← Adicionados 2 templates
```

## 🔗 Endpoints da API

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| POST | `/api/auth/solicitar-recuperacao` | ❌ Não | Solicitar link de recuperação |
| POST | `/api/auth/resetar-senha` | ❌ Não | Redefinir senha com token |

## 💡 Melhorias Futuras

1. **Rate limiting** - Limitar tentativas de recuperação por IP
2. **Histórico de senhas** - Não permitir reutilizar últimas 3 senhas
3. **Força de senha** - Exigir maiúsculas, números, caracteres especiais
4. **2FA** - Autenticação de dois fatores
5. **Notificação por SMS** - Além de email
6. **Auditoria** - Log de todas as trocas de senha

---

✅ **Sistema pronto para uso!** Basta criar as páginas no frontend e testar o fluxo completo.
