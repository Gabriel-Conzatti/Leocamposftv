# 📊 Diagrama de Fluxos - Sistema de Notificações por Email

## Fluxo 1: Inscrição em Aula

```
┌─────────────────────────────────────────────────────────────────┐
│                        ALUNO                                    │
│                 (aplicação frontend)                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Clica em "Inscrever em Aula"  │
         └──────────────┬──────────────────┘
                        │
                        ▼
     ┌──────────────────────────────────────┐
     │  POST /api/inscricoes/inscrever      │
     │  (inscricaoController.ts)            │
     └──────────────┬───────────────────────┘
                    │
       ┌────────────┴──────────────┐
       ▼                           ▼
  ┌─────────────┐         ┌──────────────┐
  │ Validar     │         │ Criar no BD  │
  │ Inscrição   │         │ (Inscricao)  │
  └──────┬──────┘         └──────┬───────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌──────────────────────┐
         │ Atualizar Vagas      │
         │ (Aula table)         │
         └──────────┬───────────┘
                    │
                    ▼
  ┌──────────────────────────────────┐
  │ Buscar informações da aula       │
  │ (titulo, data, horario, local)   │
  └──────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Gerar HTML do EMAIL        │
    │ (emailAvisoAgendamento)    │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Enviar Notificação SMTP    │
    │ (enviarEmail)              │
    └────────────┬───────────────┘
                 │
                 ▼
         ┌──────────────┐
         │   EMAIL      │
         │  ENVIADO ✅  │
         │              │
         │ Assunto:     │
         │ "Você foi    │
         │  agendado    │
         │  para aula"  │
         └──────────────┘
```

---

## Fluxo 2: Confirmação de Pagamento

```
┌────────────────────────────────────────────┐
│           MERCADO PAGO                     │
│      (Sistema de Pagamento)                │
└────────────────────┬─────────────────────┘
                     │
         [Aluno faz pagamento e aprova]
                     │
                     ▼
        ┌────────────────────────┐
        │ WEBHOOK RECEBIDO       │
        │ Pagamento aprovado!    │
        └────────────┬───────────┘
                     │
                     ▼
      ┌──────────────────────────┐
      │ POST /webhooks/mercado   │
      │ (pagamentoController)    │
      └──────────────┬───────────┘
                     │
       ┌─────────────┴──────────────┐
       ▼                            ▼
  ┌──────────────┐        ┌───────────────┐
  │ Validar      │        │ Atualizar     │
  │ Pagamento    │        │ Pagamento BD  │
  │              │        │ status:       │
  │              │        │ confirmado    │
  └──────┬───────┘        └───────┬───────┘
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
            ┌──────────────────────┐
            │ Atualizar Inscrição  │
            │ status: confirmada   │
            └──────────┬───────────┘
                       │
                       ▼
        ┌────────────────────────────┐
        │ Buscar Informações da Aula │
        │ (id, titulo, data, etc)    │
        └────────────┬───────────────┘
                     │
                     ▼
         ┌──────────────────────────┐
         │ Gerar HTML do EMAIL      │
         │ (emailConfirmacaoPgto)  │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │ Enviar Notificação SMTP  │
         │ (enviarEmail)            │
         └────────────┬─────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   EMAIL      │
              │  ENVIADO ✅  │
              │              │
              │ Assunto:     │
              │ "Confirmado" │
              └──────────────┘
```

---

## Fluxo 3: Admin Notifica sobre Nova Aula

```
┌──────────────────────────────────┐
│            ADMIN                 │
│     (Professor/Administrador)    │
└────────────────┬─────────────────┘
                 │
      [Clica: Notificar Alunos]
                 │
                 ▼
   ┌─────────────────────────────┐
   │ POST /api/aulas/ID/notificar│
   │ (aulaController.ts)         │
   └────────────────┬────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Validar ID da Aula   │
         │ Buscar informações   │
         └────────────┬─────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │ Buscar TODOS os Alunos   │
        │ (WHERE isAdmin = false)  │
        └────────────┬─────────────┘
                     │
                     ▼
          FOR EACH aluno IN alunos:
         ┌────────────────────────┐
         │ Buscar email do aluno  │
         │ Gerar HTML template    │
         │ (emailNovaAulaDisp)   │
         │ Enviar SMTP            │
         │ Contar enviados        │
         └────────────┬───────────┘
                      │
         [Repete para todos alunos]
                      │
                      ▼
         ┌──────────────────────────┐
         │ Response com resultado   │
         │ "25 emails enviados"     │
         └──────────────┬───────────┘
                        │
         ┌──────────────┴──────────────┐
         │             │               │
         ▼             ▼               ▼
    ┌─────────┐  ┌─────────┐  ┌──────────┐
    │ ALUNO 1 │  │ ALUNO 2 │  │ ALUNO N  │
    │  EMAIL  │  │  EMAIL  │  │  EMAIL   │
    │    ✅   │  │    ✅   │  │    ✅    │
    └─────────┘  └─────────┘  └──────────┘
```

---

## Fluxo 4: Admin Cancela Aula

```
┌──────────────────────────────────┐
│            ADMIN                 │
│     (Professor/Administrador)    │
└────────────────┬─────────────────┘
                 │
    [Clica: Cancelar Aula + Motivo]
                 │
                 ▼
   ┌─────────────────────────────┐
   │ PUT /api/aulas/ID/cancelar  │
   │ {motivo: "..."}             │
   │ (aulaController.ts)         │
   └────────────────┬────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   ┌──────────┐        ┌────────────────┐
   │ Validar  │        │ Atualizar BD   │
   │ ID Aula  │        │ status: cancel │
   └────┬─────┘        └────────┬───────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
     ┌──────────────────────────────┐
     │ Buscar todos inscritos nessa │
     │ aula com suas informações    │
     │ (aluno_id, email, nome)      │
     └──────────────┬───────────────┘
                    │
                    ▼
          FOR EACH inscricao:
         ┌────────────────────────┐
         │ Gerar HTML template    │
         │ (emailAulaCancelada)  │
         │ Incluindo motivo       │
         │ Enviar SMTP            │
         │ Contar enviados        │
         └────────────┬───────────┘
                      │
      [Repete para todos inscritos]
                      │
                      ▼
         ┌──────────────────────────┐
         │ Response com resultado   │
         │ "12 alunos notificados"  │
         └──────────────┬───────────┘
                        │
     ┌──────────────────┴────────────────────┐
     │              │               │        │
     ▼              ▼               ▼        ▼
┌─────────┐  ┌─────────┐  ┌──────────┐  ...
│ INSCRIT │  │ INSCRIT │  │ INSCRIT  │
│    1    │  │    2    │  │    3     │
│  EMAIL  │  │  EMAIL  │  │  EMAIL   │
│    ✅   │  │    ✅   │  │    ✅    │
└─────────┘  └─────────┘  └──────────┘

[Notificando sobre cancelamento,
 reembolso, e outras aulas]
```

---

## Arquitetura Técnica

```
┌────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
│              (React + Vite)                             │
│  - LoginPage, AlunoDashboard, RegisterPage              │
│  - useAPI.ts (chamadas para backend)                    │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼─────────────────────────────────┐
│                    BACKEND                            │
│              (Node.js + Express)                      │
│                                                       │
│  ┌────────────────────────────┐                       │
│  │   CONTROLLERS              │                       │
│  │ ├── inscricaoController    │                       │
│  │ ├── pagamentoController    │                       │
│  │ └── aulaController         │                       │
│  └────────────┬───────────────┘                       │
│               │                                        │
│  ┌────────────▼───────────────────┐                   │
│  │    EMAIL SERVICE               │                   │
│  │  emailService.ts               │                   │
│  │  ├── enviarEmail()             │                   │
│  │  ├── emailNovaInscricao()      │                   │
│  │  ├── emailConfirmacaoPgto()   │                   │
│  │  ├── emailNovaAulaDisponivel()│                   │
│  │  ├── emailAulaCancelada()     │                   │
│  │  └── emailLembreteAula()      │                   │
│  └────────────┬───────────────────┘                   │
│               │                                        │
│  ┌────────────▼───────────────────┐                   │
│  │    SMTP CONFIGURATION          │                   │
│  │  email.ts (Nodemailer)         │                   │
│  │  ├── SMTP_HOST                 │                   │
│  │  ├── SMTP_PORT                 │                   │
│  │  ├── SMTP_SECURE               │                   │
│  │  ├── SMTP_USER                 │                   │
│  │  └── SMTP_PASS                 │                   │
│  └────────────┬───────────────────┘                   │
│               │                                        │
│  ┌────────────▼───────────────────┐                   │
│  │    DATABASE (Prisma)           │                   │
│  │  PostgreSQL                     │                   │
│  │  ├── usuarios (alunos + admin) │                   │
│  │  ├── aulas                      │                   │
│  │  ├── inscricoes                 │                   │
│  │  └── pagamentos                 │                   │
│  └────────────────────────────────┘                   │
│                                                       │
└───────────────┬──────────────────────────────────────┘
                │
                │ SMTP (Port 587/465)
                │
┌───────────────▼──────────────────────────────────────┐
│         EMAIL PROVIDERS                               │
│         (Escolha uma)                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Gmail   │ │SendGrid  │ │ Mailgun  │              │
│  └──────────┘ └──────────┘ └──────────┘              │
└────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados do Email

```
ENTRADA                   PROCESSAMENTO               SAÍDA
═════════════════════════════════════════════════════════════════

1. DADOS DO ALUNO         ┌──────────────┐          TEMPLATES
   - Nome                 │  Validar &   │          HTML
   - Email                │ Sanitizar    │          
                          └──────┬───────┘          
2. DADOS DA AULA          
   - Título               ┌──────▼───────┐          ENVIO SMTP
   - Data/Hora            │  Gerar HTML  │          
   - Local                │  Template    │          Port 587/465
   - Preço                │              │          
                          └──────┬───────┘          
3. MOTIVO (se cancelada)  
                          ┌──────▼──────────┐       ENTREGA
                          │  Configurar     │       Inbox/Spam
                          │  Headers SMTP   │       
                          └──────┬──────────┘       
                          
                          ┌──────▼───────────┐      CONFIRMAÇÃO
                          │ Enviar via SMTP  │      Log
                          │ (Nodemailer)     │      Message ID
                          └──────────────────┘
```

---

## Cronograma de Emails por Evento

```
TIMELINE DOS EVENTOS                       EMAIL ENVIADO
═════════════════════════════════════════════════════════════

TH:00    Aluno vê lista de aulas
TH:05    Aluno clica "Inscrever"          ✉️ Aviso Agendamento
TH:10    ...

TJ:00    Aluno processa pagamento       
TJ:03    Mercado Pago aprova             ✉️ Confirmação Pagamento
TJ:05    ...

TA:00    Admin cria nova aula
TA:30    Admin clica "Notificar"         ✉️ Nova Aula (todos)
TA:32    Alunos veem no email

TB:00    Cancelamento identificado
TB:05    Admin clica "Cancelar"          ✉️ Cancelamento (inscritos)
TB:07    Alunos veem cancelamento        
         + aviso de reembolso
```

---

## Estados Possíveis

```
INSCRICAO                  PAGAMENTO              EMAIL ENVIADO
═════════════════════════════════════════════════════════════

pendente  ────────────┐    pendente              ✅ (aviso agendamento)
                      │
confirmada ←───────────┴─  confirmado            ✅ (confirmação pgto)
                      
cancelada └────────────    rejeitado/reembolsado ✅ (se aula cancelada)


AULA
═════════════════════════════════════════════════════════════

aberta               Inscrições sendo recebidas
                     ✅ Email ao inscrever


cheia                Todas vagas ocupadas
                     
cancelada            ✅ Email para todos inscritos
                     (aviso de cancelamento)
```

---

## Conclusão

Este diagrama mostra como os emails fluem através do sistema, começando pela ação do usuário até a entrega na caixa de entrada. Cada fluxo é independente mas bem integrado! 🚀
