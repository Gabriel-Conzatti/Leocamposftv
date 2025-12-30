"""
Models do banco de dados usando SQLAlchemy ORM
Mapeamento das tabelas existentes no PostgreSQL
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

db = SQLAlchemy()

class User(db.Model):
    """Tabela de usuários (alunos e admins)"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='ALUNO')  # ADMIN ou ALUNO (armazenado como string)
    phone = db.Column(db.String(20))
    gender = db.Column(db.String(20), default='UNSPECIFIED')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    enrollments = db.relationship('Enrollment', backref='user', lazy=True)
    
    def set_password(self, password):
        """Criar hash da senha"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verificar senha"""
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        """Verificar se é admin"""
        return self.role == 'ADMIN'


class Class(db.Model):
    """Tabela de aulas"""
    __tablename__ = 'classes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    starts_at = db.Column(db.DateTime, nullable=False)
    ends_at = db.Column(db.DateTime, nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    price_cents = db.Column(db.Integer, nullable=False)  # em centavos
    status = db.Column(db.String(50), default='OPEN')  # OPEN, CANCELLED, DONE
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    enrollments = db.relationship('Enrollment', backref='class_ref', lazy=True)
    
    @property
    def price(self):
        """Retorna preço em reais (conversão de centavos)"""
        return self.price_cents / 100.0
    
    @property
    def date(self):
        """Data da aula (para compatibilidade com templates)"""
        return self.starts_at.date()
    
    @property
    def time(self):
        """Hora da aula (para compatibilidade com templates)"""
        return self.starts_at.time()
    
    @property
    def duration_minutes(self):
        """Duração em minutos (calculado a partir de starts_at e ends_at)"""
        delta = self.ends_at - self.starts_at
        return int(delta.total_seconds() / 60)
    
    def get_enrolled_count(self):
        """Contar inscrições confirmadas"""
        return Enrollment.query.filter_by(
            class_id=self.id,
            status='CONFIRMED'
        ).count()
    
    def is_full(self):
        """Verificar se está lotado"""
        return self.get_enrolled_count() >= self.capacity
    
    def get_available_spots(self):
        """Vagas disponíveis"""
        return self.capacity - self.get_enrolled_count()


class Enrollment(db.Model):
    """Tabela de inscrições em aulas"""
    __tablename__ = 'enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    status = db.Column(db.String(50), default='AWAITING_PAYMENT')  # AWAITING_PAYMENT, WAITLIST, CANCELLED, CONFIRMED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    cancelled_at = db.Column(db.DateTime)
    
    # Relacionamentos
    payment = db.relationship('Payment', backref='enrollment', uselist=False, lazy=True)


class Payment(db.Model):
    """Tabela de pagamentos"""
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollments.id'), nullable=False)
    method = db.Column(db.String(50), default='PIX')  # PIX, TRANSFER, etc
    status = db.Column(db.String(50), default='PENDING')  # PENDING, SUBMITTED, PAID, REJECTED
    amount_cents = db.Column(db.Integer, nullable=False)  # em centavos
    description = db.Column(db.String(255))
    proof_url = db.Column(db.String(255))
    submitted_at = db.Column(db.DateTime)
    validated_by = db.Column(db.String(36))  # UUID do validador
    validated_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    provider = db.Column(db.String(50))  # mercadopago, manual, etc
    provider_charge_id = db.Column(db.String(255))  # ID do Mercado Pago
    txid = db.Column(db.String(255))  # TXID do PIX
    pix_payload = db.Column(db.Text)  # Código PIX copia-e-cola
    qr_code_base64 = db.Column(db.Text)
    qr_code_url = db.Column(db.String(255))
    webhook_raw = db.Column(db.Text)  # JSON bruto do webhook
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def amount(self):
        """Retorna valor em reais (conversão de centavos)"""
        return self.amount_cents / 100.0


class Attendance(db.Model):
    """Tabela de presença"""
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(50), default='ABSENT')  # PRESENT, ABSENT, EXCUSED
    marked_by = db.Column(db.String(36), nullable=False)  # UUID do admin que marcou
    marked_at = db.Column(db.DateTime, default=datetime.utcnow)


class Settings(db.Model):
    """Tabela de configurações do sistema (chave PIX)"""
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    pix_key = db.Column(db.String(255), nullable=False)
    pix_receiver_name = db.Column(db.String(255), nullable=False)
    pix_city = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
