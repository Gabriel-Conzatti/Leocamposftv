# ✅ Checklist de Testes - Sistema de Notificações por Email

## 📋 Pré-requisitos

- [ ] Backend rodando com `npm run dev`
- [ ] Frontend rodando com `npm run dev`
- [ ] Variáveis SMTP configuradas em `.env`
- [ ] Servidor SMTP conectado: Veja "✅ Servidor SMTP conectado com sucesso" no console

---

## 🧪 Testes de Configuração

### Teste 1: Verificar Variáveis de Ambiente
```bash
# No backend, verificar .env contém:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```
- [ ] Todas as variáveis presentes
- [ ] Sem espaços desnecessários

### Teste 2: Verificar Conexão SMTP
```bash
npm run dev

# Procurar por uma destas mensagens:
# ✅ Servidor SMTP conectado com sucesso
# ❌ Erro ao conectar com servidor SMTP
```
- [ ] Mensagem de sucesso aparece ao iniciar
- [ ] Console não mostra erros de autenticação

### Teste 3: Verificar Instalação de Dependências
```bash
npm list nodemailer
npm list @types/nodemailer
```
- [ ] nodemailer está instalado
- [ ] @types/nodemailer está instalado

---

## 👤 Testes de Funcionalidade - Alunos

### Teste 4: Inscrição Envia Email
1. [ ] Abrir http://localhost:5173
2. [ ] Fazer login como aluno (criar usuário se necessário)
3. [ ] Navegar para "Aulas"
4. [ ] Clicar em uma aula disponível
5. [ ] Clicar em "Inscrever"
6. [ ] Verificar resposta: "Inscrição realizada com sucesso"
7. [ ] **Verificar email** (checar spam/junk):
   - [ ] Email recebido em poucos segundos
   - [ ] Assunto contém "agendado"
   - [ ] Conteúdo mostra: nome, aula, data, horário, local
   - [ ] Existe botão "Acessar sua conta"

**Status:** _______________

### Teste 5: Confirmação de Pagamento
1. [ ] Com inscrição do Teste 4 ativa
2. [ ] Ir para "Minhas Aulas" ou "Pagamento"
3. [ ] Iniciar pagamento (teste com simulador ou Mercado Pago)
4. [ ] **Se simulador:**
   ```bash
   POST /api/pagamentos/simular
   {
     "pagamentoId": "id-da-inscrição",
     "status": "approved"
   }
   ```
5. [ ] Verificar resposta: "Pagamento simulado com sucesso"
6. [ ] **Verificar email**:
   - [ ] Email "Confirmação de Pagamento" recebido
   - [ ] Assunto contém "Confirmado"
   - [ ] Valor pago está correto
   - [ ] Data/hora da aula estão corretos
   - [ ] Existe aviso para chegar cedo

**Status:** _______________

---

## 👨‍💼 Testes de Funcionalidade - Admin

### Teste 6: Notificar sobre Nova Aula
Pré-requisito: [ ] Existem pelo menos 2 alunos cadastrados

1. [ ] Fazer login como admin
2. [ ] Criar uma nova aula (ou usar aula existente)
3. [ ] Copiar ID da aula
4. [ ] Abrir Postman ou usar curl:
   ```bash
   POST http://localhost:3001/api/aulas/{aulaId}/notificar
   Headers:
     Authorization: Bearer {seu-token-admin}
   ```
5. [ ] Verificar resposta:
   - [ ] `"sucesso": true`
   - [ ] Mensagem mostra número de emails enviados
   - [ ] `emailsEnviados` > 0
6. [ ] **Verificar emails de TODOS os alunos:**
   - [ ] Email "Nova Aula Disponível" recebido
   - [ ] Cada aluno vê seu próprio nome
   - [ ] Detalhes da aula corretos
   - [ ] Existe botão "Inscrever-se Agora"
   - [ ] Cada email é independente (não é um BCC)

**Status:** _______________

**Resultado esperado:**
```json
{
  "sucesso": true,
  "mensagem": "Notificação enviada para 2 alunos",
  "dados": {
    "aulaId": "...",
    "aulaTitulo": "Futevôlei Avançado",
    "totalAlunos": 2,
    "emailsEnviados": 2
  }
}
```

### Teste 7: Cancelar Aula com Notificação
Pré-requisito: [ ] Existem alunos inscritos em uma aula

1. [ ] Fazer login como admin
2. [ ] Selecionar uma aula com inscritos
3. [ ] Copiar ID da aula
4. [ ] Usar endpoint:
   ```bash
   PUT http://localhost:3001/api/aulas/{aulaId}/cancelar
   Headers:
     Authorization: Bearer {seu-token-admin}
     Content-Type: application/json
   Body:
   {
     "motivo": "Indisponibilidade do professor"
   }
   ```
5. [ ] Verificar resposta:
   - [ ] `"sucesso": true`
   - [ ] Mensagem mostra quantos alunos foram notificados
   - [ ] Status da aula muda para "cancelada"
6. [ ] **Verificar emails de TODOS os inscritos:**
   - [ ] Email "Aula Cancelada" recebido
   - [ ] Nome do aluno está correto
   - [ ] Nome da aula está correto
   - [ ] Motivo mencionado
   - [ ] Aviso de reembolso presente
   - [ ] Link para outras aulas disponível

**Status:** _______________

**Resultado esperado:**
```json
{
  "sucesso": true,
  "mensagem": "Aula cancelada. Notificação enviada para 3 alunos",
  "dados": {
    "aula": { ... },
    "totalAlunosNotificados": 3
  }
}
```

---

## 🔍 Testes de Edge Cases

### Teste 8: Email Duplicado (Limpar inbox regularmente)
1. [ ] Inscrever: Email enviado
2. [ ] Pagamento: Email enviado
3. [ ] Total: 2 emails diferentes
4. [ ] Nenhum email duplicado recebido

**Status:** _______________

### Teste 9: Email para Usuário sem Email
1. [ ] Criar usuário com email vazio (se permitido)
2. [ ] Tentar inscrever
3. [ ] Sistema não deve crashear
4. [ ] Console deve mostrar aviso

**Status:** _______________

### Teste 10: Notificar com Nenhum Aluno
1. [ ] Remover todos os alunos temporariamente
2. [ ] Tentar notificar sobre nova aula
3. [ ] [ ] Sistema responde com sucesso
4. [ ] [ ] `emailsEnviados: 0`
5. [ ] [ ] Nenhum erro no console

**Status:** _______________

### Teste 11: Cancelar Aula sem Inscritos
1. [ ] Criar aula sem inscritos
2. [ ] Cancelar aula
3. [ ] [ ] Sistema responde com sucesso
4. [ ] [ ] `totalAlunosNotificados: 0`
5. [ ] [ ] Nenhum erro

**Status:** _______________

---

## 📧 Testes de Conteúdo de Email

### Teste 12: Validar HTML do Email
Para cada email recebido, verificar:
- [ ] Logo/branding visível
- [ ] Cores apropriadas (gradientes)
- [ ] Texto bem formatado
- [ ] Links funcionam (clicáveis)
- [ ] Responsivo em mobile (se abrir em celular)
- [ ] Sem espaçamento estranho
- [ ] Rodapé com informações de contato

**Status:** _______________

### Teste 13: Validar Links nos Emails
1. [ ] Clicar em botão de ação de cada email
2. [ ] [ ] Link "Acessar sua conta" leva a http://localhost:5173
3. [ ] [ ] Link "Inscrever-se Agora" leva a http://localhost:5173/aulas
4. [ ] [ ] Link "Ver detalhes da aula" funciona
5. [ ] [ ] Todos os links abrem em nova aba

**Status:** _______________

---

## 🔐 Testes de Segurança/Conformidade

### Teste 14: Dados Sensíveis não são Expostos
- [ ] Emails não contêm senhas
- [ ] Emails não contêm tokens JWT
- [ ] Emails não contêm dados de pagamento completos
- [ ] Apenas informações necessárias são incluídas

**Status:** _______________

### Teste 15: Footer de Unsubscribe (Futuro)
- [ ] [ ] Email contém footer profissional
- [ ] [ ] Indica que é FutevoleiPro
- [ ] [ ] Ano está correto (2026)

**Status:** _______________

---

## 🌍 Testes com Diferentes Provedores SMTP

### Teste 16: Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```
- [ ] Conexão funciona
- [ ] Emails são entregues
- [ ] Email aparece de seu-email@gmail.com

**Status:** _______________

### Teste 17: Mailgun (Opcional)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@seu-dominio
SMTP_PASS=sua-chave
```
- [ ] Conexão funciona
- [ ] Emails são entregues

**Status:** _______________

### Teste 18: SendGrid (Opcional)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=seu-api-key
```
- [ ] Conexão funciona
- [ ] Emails são entregues

**Status:** _______________

---

## 📊 Testes de Performance

### Teste 19: Envio em Massa
1. [ ] Criar 10+ alunos (se não existem)
2. [ ] Notificar sobre nova aula
3. [ ] Tempo de resposta < 5 segundos
4. [ ] Todos os 10+ emails são enviados
5. [ ] Nenhum timeout ou erro

**Status:** _______________

### Teste 20: Notificações Simultâneas
1. [ ] Aluno 1 se inscreve
2. [ ] Aluno 2 se inscreve (ao mesmo tempo que Admin notifica)
3. [ ] Admin notifica
4. [ ] [ ] Todos recebem emails corretos
5. [ ] [ ] Nenhum conflito ou erro

**Status:** _______________

---

## 🔧 Testes de Robustez

### Teste 21: Servidor SMTP Indisponível
1. [ ] Mudar SMTP_HOST para "localhost" (ou servidor inválido)
2. [ ] Tentar inscrever
3. [ ] [ ] Sistema não crashes
4. [ ] [ ] Console mostra erro de SMTP
5. [ ] [ ] Inscrição é criada mesmo sem email

**Status:** _______________

### Teste 22: Credentials Inválidas
1. [ ] Usar SMTP_PASS inválida
2. [ ] Reiniciar servidor
3. [ ] [ ] Console mostra erro "Invalid credentials"
4. [ ] [ ] Sistema continua rodando
5. [ ] [ ] Inscrição funciona (sem enviar email)

**Status:** _______________

---

## 📝 Testes de Logs

### Teste 23: Console Logging
Verificar que o console mostra:
- [ ] "✅ Servidor SMTP conectado com sucesso" ao iniciar
- [ ] "✅ Email enviado para aluno@email.com: <id>" ao enviar
- [ ] "📧 Notificando X alunos sobre nova aula..."
- [ ] Nenhum erro 500 ou exceção não tratada

**Status:** _______________

---

## 🎯 Summary Checklist

### Funcionalidades Implementadas e Testadas:
- [ ] Serviço de email SMTP funcionando
- [ ] Email ao inscrever em aula
- [ ] Email ao confirmar pagamento
- [ ] Endpoint para notificar todos os alunos
- [ ] Endpoint para cancelar aula com notificação
- [ ] Templates HTML responsivos
- [ ] Suporte a múltiplos provedores SMTP
- [ ] Error handling robusto
- [ ] Logging apropriado

### Qualidade:
- [ ] Sem erros TypeScript
- [ ] Sem console warnings
- [ ] Sem erros 500
- [ ] Documentação completa
- [ ] Código bem comentado

### Documentação:
- [ ] GUIA_EMAILS_PT.md lido e entendido
- [ ] EMAIL_SETUP.md com instruções claras
- [ ] DIAGRAMA_FLUXOS.md visualizado
- [ ] IMPLEMENTATION_SUMMARY.md consultado

---

## 📞 Troubleshooting Final

Se algum teste falhar:

1. **Email não é enviado:**
   - [ ] Verificar connection do SMTP em console
   - [ ] Verificar credenciais SMTP_USER e SMTP_PASS
   - [ ] Para Gmail: Usar senha de app, não senha da conta
   - [ ] Para Gmail: Ativar 2FA primeiro

2. **Servidor SMTP não conecta:**
   - [ ] Verificar SMTP_HOST correto
   - [ ] Verificar porta correta (padrão 587)
   - [ ] Tentar com SMTP_SECURE=false (587) ou true (465)

3. **Emails vão para spam:**
   - [ ] Verificar em pasta "Spam" ou "Promoções"
   - [ ] Para Gmail: Confiar no remetente
   - [ ] Para Mailgun/SendGrid: Domínio precisa estar verificado

4. **Erros de TypeScript:**
   - [ ] `npm install --save-dev @types/nodemailer`
   - [ ] `npx tsc --noEmit` para verificar

5. **Controllers não encontram funções email:**
   - [ ] Verificar imports em controllers
   - [ ] Verificar se emailService.ts está em src/services/
   - [ ] Reiniciar servidor

---

## ✨ Conclusão

Todos os testes passando = Sistema de email **PRONTO PARA PRODUÇÃO** 🚀

Data do teste: ___________
Testado por: ___________
Status final: ✅ / ❌
