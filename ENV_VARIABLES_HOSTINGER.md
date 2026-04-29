# Configurar Variáveis de Ambiente na Hostinger

## O Problema

A API está retornando 503 porque faltam variáveis de ambiente críticas:
- `JWT_SECRET` - necessária para gerar tokens
- `DATABASE_URL` - necessária para conectar ao banco

## Solução: Configurar Variáveis em Hostinger

### MÉTODO 1: Via Painel Hostinger (Mais Fácil)

1. **Acesse**: https://hpanel.hostinger.com
2. **Procure por:**
   - "Node.js Applications"
   - "Environment Variables"
   - "Settings"
   - ".env Configuration"

3. **Procure por um campo que diz:**
   - "Environment Variables"
   - "Config Variables"
   - ".env Variables"

4. **Adicione estas variáveis:**

```
NODE_ENV=production
PORT=3000
JWT_SECRET=sua-chave-secreta-aqui-pode-ser-qualquer-coisa
DATABASE_URL=mysql://u278435480_administrador:suaSenhaAqui123%40@srv2037.hstgr.io:3306/u278435480_leocampostfvBD
FRONTEND_URL=https://leocamposftv.com
```

5. **Salve as configurações**

6. **Reinicie a aplicação**

### MÉTODO 2: Via SSH (Alternativo)

```bash
# Conecte via SSH
ssh seu-usuario@seu-servidor.com

# Vá para a pasta da aplicação
cd /home/seu-usuario/leocamposftv

# Crie arquivo .env
nano .env

# Cole isto no arquivo:
NODE_ENV=production
PORT=3000
JWT_SECRET=sua-chave-secreta
DATABASE_URL=mysql://u278435480_administrador:suaSenhaAqui123%40@srv2037.hstgr.io:3306/u278435480_leocampostfvBD

# Salve (Ctrl+O, Enter, Ctrl+X)

# Reinicie a aplicação
pm2 restart leocamposftv
# ou
systemctl restart seu-app-name
```

### MÉTODO 3: Upload de Arquivo .env

1. Copie o arquivo `.env.production.example` para `.env`
2. Preencha os valores
3. Use SFTP ou SCP para upload para Hostinger
4. Coloque na raiz do projeto backend

---

## Variáveis Explicadas

| Variável | Valor | Por que é necessária |
|----------|-------|----------------------|
| `NODE_ENV` | `production` | Define o ambiente (produção) |
| `PORT` | `3000` ou `3001` | Porta que Express irá escutar |
| `JWT_SECRET` | Qualquer string | Segredo para assinar tokens JWT |
| `DATABASE_URL` | `mysql://...` | Credenciais para conectar ao banco |
| `FRONTEND_URL` | `https://leocamposftv.com` | URL do frontend (para CORS) |

---

## Valores Específicos Para Seu Projeto

### JWT_SECRET
Pode ser qualquer valor. Exemplos:
- `seu-super-mega-secret-key-12345`
- `jwt-secret-2026-04-28`
- `producao-api-token-xyz`

⚠️ **IMPORTANTE**: Use algo único e seguro em produção real. Não deixe em branco!

### DATABASE_URL
Use este valor exatamente (já testado e correto):
```
mysql://u278435480_administrador:suaSenhaAqui123%40@srv2037.hstgr.io:3306/u278435480_leocampostfvBD
```

Nota: `%40` é o caractere `@` URL encoded (necessário!)

### FRONTEND_URL
Use este valor:
```
https://leocamposftv.com
```

---

## Verificar se as Variáveis Foram Configuradas

### Via Terminal (SSH)
```bash
env | grep JWT_SECRET
env | grep DATABASE_URL
env | grep NODE_ENV
```

Deve mostrar os valores que você configurou.

### Via Health Check
```bash
curl https://api.leocamposftv.com/api/health
```

Se retornar `HTTP 200` com JSON (não 503), as variáveis estão configuradas!

---

## Se Ainda Retornar 503

### Passo 1: Verificar Logs
1. Acesse painel Hostinger
2. Procure por "Application Logs" ou "Error Logs"
3. Procure por mensagens de erro

### Passo 2: Comum - Banco de Dados Indisponível
```
Mensagem de erro: "PROTOCOL_CONNECTION_LOST" ou "Lost connection"
Solução: Banco de dados pode estar down
  - Tente conectar manualmente: mysql -h srv2037.hstgr.io -u u278435480_administrador -p
  - Se falhar, banco está down - contate suporte Hostinger
```

### Passo 3: Comum - DATABASE_URL Malformada
```
Mensagem de erro: "ER_NOT_SUPPORTED_AUTH_PLUGIN"
Solução: Use exatamente:
  mysql://u278435480_administrador:suaSenhaAqui123%40@srv2037.hstgr.io:3306/u278435480_leocampostfvBD
  (sem aspas, sem espaços, com %40)
```

### Passo 4: Aplicação Ainda Não Iniciou
```
Mensagem: Nada nos logs
Solução: Aguarde 2 minutos, alguns servidores são lentos no boot
  Depois tente novamente: curl https://api.leocamposftv.com/api/health
```

---

## Próximos Passos

1. **AGORA**: Configure as variáveis de ambiente no painel Hostinger
2. **DEPOIS**: Aguarde 1-2 minutos
3. **TESTE**: `curl https://api.leocamposftv.com/api/health`
4. **RESULTADO ESPERADO**: `HTTP 200` com JSON (não 503)
5. **ENTÃO**: Tente login em https://leocamposftv.com

---

## Checklist Final

Antes de reportar problema:
- [ ] JWT_SECRET está configurada (não vazia)
- [ ] DATABASE_URL está exatamente com %40 para @
- [ ] NODE_ENV=production
- [ ] PORT=3000 ou 3001
- [ ] Salvou as configurações
- [ ] Reiniciou a aplicação
- [ ] Aguardou 2 minutos
- [ ] Testou health check com curl

Se tudo isso foi feito e ainda não funciona, compartilhe:
- Output de: `curl -i https://api.leocamposftv.com/api/health`
- Logs de erro da aplicação (se houver)
- Mensagem de erro exata do browser
