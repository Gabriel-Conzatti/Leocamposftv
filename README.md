# 🏐 Sistema de Agendamento de Aulas de Futevôlei

Sistema web completo para agendamento e pagamento automático de aulas de futevôlei via PIX (Mercado Pago).

## 🚀 Tecnologias

- **Backend:** Python 3 + Flask
- **Banco de dados:** PostgreSQL + SQLAlchemy
- **Pagamentos:** Mercado Pago (PIX automático)
- **Frontend:** HTML + CSS (Bootstrap) + JavaScript

## 📋 Pré-requisitos

- Python 3.8 ou superior
- PostgreSQL instalado e rodando
- Banco de dados `futevolei_scheduler` já criado
- Conta no Mercado Pago com Access Token

## 🔧 Instalação

### 1. Criar ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

O arquivo `.env` já está configurado com:

```env
DATABASE_URL=postgresql+psycopg://futevolei_user:9293@localhost:5432/futevolei_scheduler
SECRET_KEY=e7c1a9c7d3f84b1a9a8f9e7d3c2b1a0f8e9d7c6b5a4f3e2d1c0b9a8f7e6d5c4
PIX_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-8277485876313752-032412-9704379ed482c37649b572efa377aab9-301512742
BASE_URL=http://localhost:5000
```

⚠️ **IMPORTANTE:** O Access Token do Mercado Pago no `.env` é o fornecido por você. Para produção, use suas próprias credenciais.

### 4. Verificar banco de dados

Certifique-se de que o PostgreSQL está rodando e o banco `futevolei_scheduler` existe com as tabelas:
- users
- classes
- enrollments
- payments
- attendance
- settings

## ▶️ Executar o sistema

```bash
python app.py
```

O sistema estará disponível em: **http://localhost:5000**

Você verá a mensagem:
```
✓ Conectado ao banco de dados!
🚀 Servidor iniciado em http://localhost:5000
```

## 👥 Usando o sistema

### Como Aluno

1. **Criar conta:**
   - Acesse http://localhost:5000
   - Clique em "Criar conta"
   - Preencha: nome, e-mail, telefone (opcional) e senha
   - Faça login

2. **Ver aulas disponíveis:**
   - Após login, você verá todas as aulas futuras
   - Informações: data, horário, vagas, valor

3. **Inscrever-se em uma aula:**
   - Clique em "Ver detalhes" na aula desejada
   - Veja quem já está inscrito (apenas primeiro nome + inicial)
   - Clique em "Inscrever-se nesta aula"
   - Você será redirecionado para o pagamento PIX

4. **Pagar via PIX:**
   - Escaneie o QR Code no seu app bancário
   - OU copie o código PIX e cole no app
   - Confirme o pagamento
   - Aguarde (o sistema confirma automaticamente em alguns segundos)
   - Quando aprovado, sua inscrição vira "CONFIRMADA"

### Como Admin

1. **Criar usuário admin no banco:**
   ```sql
   -- Primeiro, crie um usuário normal pelo sistema
   -- Depois, atualize o role para ADMIN:
   UPDATE users SET role = 'ADMIN' WHERE email = 'seu-email@exemplo.com';
   ```

2. **Acessar painel admin:**
   - Faça login com conta admin
   - Você será redirecionado automaticamente para `/admin/classes`

3. **Criar aula:**
   - Clique em "+ Nova Aula"
   - Preencha: título, descrição, data, horário, duração, capacidade, valor
   - Clique em "Criar Aula"

4. **Gerenciar aulas:**
   - Veja todas as aulas criadas
   - Veja quantos alunos estão inscritos
   - Cancele aulas se necessário

## 🔔 Testando Webhook do Mercado Pago

### Opção 1: Usar ngrok (recomendado para testes locais)

```bash
# Instalar ngrok: https://ngrok.com/download

# Rodar ngrok
ngrok http 5000

# Copiar a URL HTTPS gerada (ex: https://abc123.ngrok.io)
# Atualizar no .env:
BASE_URL=https://abc123.ngrok.io
```

Reinicie o servidor Flask após alterar o `.env`.

### Opção 2: Simular pagamento manualmente

Para testar sem fazer pagamento real:

```python
# Abra o Python no terminal com venv ativado
python

# Execute:
from app import app
from models import db, Payment, Enrollment
from datetime import datetime

with app.app_context():
    # Buscar pagamento pendente (use o ID correto)
    payment = Payment.query.filter_by(status='PENDING').first()
    
    if payment:
        # Simular aprovação
        payment.status = 'PAID'
        payment.paid_at = datetime.utcnow()
        
        # Confirmar inscrição
        enrollment = Enrollment.query.get(payment.enrollment_id)
        enrollment.status = 'CONFIRMED'
        
        db.session.commit()
        print(f"✓ Pagamento {payment.id} aprovado!")
```

## 📁 Estrutura do Projeto

```
/
├── app.py                  # Aplicação Flask principal
├── models.py               # Models do banco (SQLAlchemy)
├── auth.py                 # Login, registro, logout
├── routes.py               # Rotas de aulas, inscrições, pagamentos
├── mercadopago_pix.py      # Integração Mercado Pago
├── templates/              # Templates HTML
│   ├── login.html
│   ├── register.html
│   ├── classes.html
│   ├── class_detail.html
│   ├── payment.html
│   ├── admin_classes.html
│   └── create_class.html
├── static/
│   └── style.css           # Estilos customizados
├── .env                    # Variáveis de ambiente
├── requirements.txt        # Dependências Python
└── README.md              # Este arquivo
```

## 🎯 Funcionalidades

### Autenticação
- ✅ Registro de usuários
- ✅ Login com e-mail e senha
- ✅ Senha com hash (bcrypt via Werkzeug)
- ✅ Sessão Flask
- ✅ Roles: ADMIN e ALUNO

### Aulas
- ✅ Admin cria aulas
- ✅ Aulas com: título, descrição, data, hora, duração, capacidade, valor
- ✅ Listar aulas ativas futuras
- ✅ Ver detalhes da aula
- ✅ Ver alunos inscritos (primeiro nome + inicial)
- ✅ Controle de capacidade (vagas)
- ✅ Admin pode cancelar aulas

### Inscrições
- ✅ Aluno se inscreve em aula
- ✅ Status: PENDING (aguardando pagamento) ou CONFIRMED (pago)
- ✅ Verificação de vagas disponíveis
- ✅ Não permite inscrição duplicada

### Pagamentos
- ✅ Geração automática de PIX via Mercado Pago
- ✅ QR Code e código copia-e-cola
- ✅ Webhook para confirmação automática
- ✅ Atualização automática: PENDING → PAID
- ✅ Confirmação automática da inscrição
- ✅ Verificação de status em tempo real (polling 3s)

## 🔒 Segurança

- Senhas com hash (SHA256 via Werkzeug)
- Sessões protegidas com SECRET_KEY
- Decorators `@login_required` e `@admin_required`
- Validação de propriedade (usuário só vê seus próprios pagamentos)
- Proteção contra inscrições duplicadas

## 🐛 Troubleshooting

### Erro de conexão com banco
```
✗ Erro ao conectar no banco: ...
```
**Solução:** Verifique se PostgreSQL está rodando e as credenciais no `.env` estão corretas.

### Erro ao criar PIX
```
Erro ao gerar PIX: ...
```
**Solução:** Verifique se o `MERCADOPAGO_ACCESS_TOKEN` no `.env` está válido.

### Webhook não funciona
**Solução:** Use ngrok para expor localhost ou simule pagamento manualmente (veja seção "Testando Webhook").

### Página em branco
**Solução:** Verifique o console do Flask. Pode ser erro de template ou sessão.

## 📝 Notas Importantes

1. **Não use migrations:** O banco já existe, SQLAlchemy é apenas ORM
2. **Token do Mercado Pago:** O token no `.env` é de **produção** (fornecido por você). Para testes reais, considere usar token de sandbox
3. **Webhook:** Precisa de URL pública (use ngrok para testes locais)
4. **Admin:** Crie manualmente no banco alterando `role` para 'ADMIN'
5. **Logs:** O Flask imprime logs úteis no terminal (✓ sucesso, ✗ erro)

## 🎓 Conceitos Aplicados

- **MVC simplificado:** Models (models.py), Views (templates/), Controllers (routes.py)
- **Blueprints Flask:** Organização modular (auth_bp, routes_bp)
- **ORM:** SQLAlchemy mapeando tabelas existentes
- **API REST:** Webhook recebe POST do Mercado Pago
- **Polling:** Frontend verifica status de pagamento via fetch
- **Sessões:** Flask session para autenticação simples
- **Environment Variables:** Credenciais seguras no .env

## 🚀 Próximos Passos (Possíveis Melhorias)

- [ ] Sistema de mensalidades/planos
- [ ] Múltiplos locais/quadras
- [ ] E-mail de confirmação
- [ ] Histórico de pagamentos
- [ ] Relatórios para admin
- [ ] Presença (check-in)
- [ ] Cancelamento com estorno
- [ ] Notificações push

## 📧 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Flask no terminal
2. Verifique o console do navegador (F12)
3. Consulte a documentação do Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs

---

**Desenvolvido para LeoFTV** 🏐
Sistema simples, funcional e pronto para uso!
