# Redeploy na Hostinger - Guia Passo a Passo

## 📍 Localizar o Botão de Redeploy

### Opção 1: Via App Manager (Mais Comum)

```
1. Acesse: https://hpanel.hostinger.com
2. Faça Login
3. Procure por um desses nomes no menu lateral:
   - "Node.js Applications" ← Mais comum
   - "App Manager"
   - "Applications"
   - "Deployed Applications"
4. Clique nela
5. PROCURE na lista por um app com:
   - Nome: "leocamposftv" ou "api.leocamposftv.com"
   - Status: "Running" (verde) ou "Stopped" (vermelho)
6. Clique NO NOME do app para abrir detalhes
```

### Opção 2: Via Render/Deploy Integrado

Se sua app está em https://render.com ou similar:
```
1. Acesse o painel correspondente
2. Procure por: "Manual Deploy" ou "Deploy Latest"
3. Clique
4. Aguarde 3-5 minutos
```

### Opção 3: Via SSH (Se Nenhuma Das Acima Funcionar)

```bash
# Conecte via SSH na Hostinger
ssh seu-usuario@seu-servidor.com

# Navegue até a pasta
cd /home/seu-usuario/leocamposftv

# Faça pull dos commits novos
git pull origin main

# Compile TypeScript
npm run build  # ou npx tsc

# Reinicie a aplicação
pm2 restart leocamposftv  # ou systemctl restart seu-app
```

---

## 🎯 Encontrando o Botão de Redeploy

Quando você clicar na aplicação, procure por um desses botões/links:

### ✅ Botões Corretos (Clique em um destes)
```
[Redeploy]           ← MELHOR OPÇÃO
[Deploy]             ← Também funciona
[Force Deploy]       ← Funciona
[Deploy from Git]    ← Funciona
[Sync from GitHub]   ← Funciona
[Update]             ← Funciona
[Force Update]       ← Funciona
```

### ❌ Botões Errados (NÃO clique aqui)
```
[Restart]       ← Só reinicia, não puxa código
[Stop]          ← Desliga a app
[Delete]        ← Apaga a aplicação
```

---

## 📸 Exemplo de Painel Hostinger (Referência)

Quando você achar a aplicação, a tela deve parecer assim:

```
┌─────────────────────────────────────────┐
│  Aplicações Node.js                     │
├─────────────────────────────────────────┤
│                                         │
│  ✓ leocamposftv (api.leocamposftv.com) │
│  Status: Running (Verde)                │
│  Port: 3001                             │
│  Conectar: [Button]                     │
│  Redeploy: [Button] ← CLIQUE AQUI       │
│  Restart: [Button]                      │
│  Stop: [Button]                         │
│  Settings: [Button]                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## ⏱️ O Que Acontece Após Clicar em Redeploy

### Timeline de Deploy

```
T+0:00  → Clica em Redeploy
        → Sistema mostra: "Deploy iniciado..."

T+0:30  → Git pull dos commits (30 segundos)
        → Mostra: "Clonando repositório..."

T+1:00  → Compilação TypeScript (30 segundos)
        → Mostra: "Compilando aplicação..."

T+1:30  → Instalação de dependências (1 minuto)
        → Mostra: "Instalando pacotes..."

T+2:30  → Startup da aplicação (1 minuto)
        → Mostra: "Iniciando servidor..."

T+3:30  → ✅ Deploy completo
        → Mostra: "Deploy concluído com sucesso"
        → Status: "Running" (verde)
```

**Total esperado: 3-5 minutos**

---

## 🧪 Testes Após Deploy

### Imediatamente após o deploy terminar:

**TESTE 1: Espere 1 minuto extra**
```
⏰ Aguarde mais 1 minuto
   (às vezes API leva tempo para ficar "pronta")
```

**TESTE 2: Health Check (Via Terminal)**
```bash
curl -i https://api.leocamposftv.com/api/health
```

Você deve ver:
```
HTTP/1.1 200 OK
Content-Type: application/json

{"sucesso":true,"mensagem":"Servidor funcionando",...}
```

✅ Se ver **HTTP 200** → Deploy funcionou!
❌ Se ver **HTTP 503** → Deploy não funcionou, tentar novamente

**TESTE 3: CORS Preflight (Via Terminal)**
```bash
curl -i -X OPTIONS https://api.leocamposftv.com/api/auth/login \
  -H "Origin: https://leocamposftv.com" \
  -H "Access-Control-Request-Method: POST"
```

Procure por:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://leocamposftv.com ← IMPORTANTE
```

✅ Se tem o header → CORS funciona!
❌ Se não tem → Voltar ao passo 1

**TESTE 4: Login no Browser**
1. Acesse https://leocamposftv.com
2. Clique em "Login" (se houver página de login)
3. Digite email e senha
4. Clique "Entrar"

✅ Se funcionar → 🎉 PROBLEMA RESOLVIDO!
❌ Se erro → Verificar console (F12) para mensagem exata

---

## 🔍 Se Algo der Errado

### Cenário 1: Deploy parece "preso" ou não termina
```
Solução:
  1. Aguarde 10 minutos inteiros
  2. Se ainda "pendente", recarregue a página (F5)
  3. Se ainda preso, clique "Cancel" e tente novamente
```

### Cenário 2: Deploy retorna "ERROR" ou similar
```
Procure por mensagem de erro. Causas comuns:

"Não consegui compilar TypeScript"
  → Há erro de sintaxe em algum arquivo .ts
  → Solução: Corrija o arquivo e faça novo commit

"npm install falhou"
  → Há conflito de dependências
  → Solução: Execute npm install local e commit package-lock.json

"Porta já em uso"
  → Outro processo já ocupa porta 3001
  → Solução: Restart da aplicação
```

### Cenário 3: Deploy sucede mas API ainda retorna 503
```
Possíveis causas:
  1. Variáveis de ambiente não configuradas
     → Verificar em Settings se DATABASE_URL e JWT_SECRET existem
  
  2. Banco de dados não acessível
     → Testar: mysql -h srv2037.hstgr.io -u u278435480_administrador -p
     → Se der erro, banco pode estar down
  
  3. Código ainda é antigo (deploy não pegou)
     → Verificar em Hostinger se branch é 'main'
     → Fazer novo redeploy
```

### Cenário 4: Erro de CORS ainda aparece mesmo após deploy
```
Possíveis causas:
  1. Proxy/WAF da Hostinger bloqueando headers
     → Contactar suporte Hostinger
  
  2. Frontend usando URL errada
     → Verificar se está em https://leocamposftv.com
     → Não em http:// ou localhost
  
  3. Refresh de cache do browser
     → Abrir em modo Incógnito (Ctrl+Shift+N)
     → Ou limpar cache (Ctrl+Shift+Delete)
```

---

## 📞 Se Nada Funcionar

Quando você fizer o redeploy e continuar com erro, nos diga:

1. **Status atual**: Qual erro está vendo?
2. **Teste 1 resultado**: `curl https://api.leocamposftv.com/api/health` → retorna o quê?
3. **Hostinger logs**: Tem mensagem de erro no painel?
4. **Git status**: `git log --oneline -1` na sua máquina (qual commit?)

---

## ✨ Checklist Final

Antes de fazer o redeploy, confirme:

- [ ] Você tem acesso ao painel Hostinger (login funciona)
- [ ] Consegue ver a aplicação Node.js na lista
- [ ] Encontrou o botão "Redeploy" (ou similar)
- [ ] Tem uma aba de terminal aberta para testar depois
- [ ] Conhece uma credencial válida para fazer login (teste posterior)

---

**Pronto? Vá em frente com o redeploy! Estou aqui para ajudar se der problema.** 🚀
