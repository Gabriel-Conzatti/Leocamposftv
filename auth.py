"""
Módulo de Autenticação
Login, registro e logout
"""
import re
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from models import db, User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Buscar usuário
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            # Login bem-sucedido
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['user_role'] = user.role
            
            flash(f'Bem-vindo, {user.name}!', 'success')
            
            # Redirecionar admin para painel admin
            if user.is_admin():
                return redirect(url_for('routes.admin_home'))
            return redirect(url_for('routes.list_classes'))
        else:
            flash('E-mail ou senha incorretos', 'error')
    
    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Página de registro"""
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        phone = request.form.get('phone')
        gender = request.form.get('gender')
        
        # Validações simples
        if not name or len(name.strip()) < 3:
            flash('Informe seu nome completo (mínimo 3 caracteres).', 'error')
            return redirect(url_for('auth.register'))

        if not email or '@' not in email:
            flash('E-mail inválido.', 'error')
            return redirect(url_for('auth.register'))

        if not phone:
            flash('Telefone é obrigatório.', 'error')
            return redirect(url_for('auth.register'))

        # Aceita apenas dígitos e formatações comuns
        phone_clean = re.sub(r'\D', '', phone)
        if len(phone_clean) < 10:
            flash('Telefone inválido. Use DDD + número.', 'error')
            return redirect(url_for('auth.register'))

        if not gender:
            flash('Selecione um gênero.', 'error')
            return redirect(url_for('auth.register'))

        # Senha: 8+ chars, maiúscula, minúscula, número, caractere especial
        if not password or len(password) < 8:
            flash('Senha deve ter pelo menos 8 caracteres.', 'error')
            return redirect(url_for('auth.register'))
        if not re.search(r'[A-Z]', password):
            flash('Senha precisa ter pelo menos 1 letra maiúscula.', 'error')
            return redirect(url_for('auth.register'))
        if not re.search(r'[a-z]', password):
            flash('Senha precisa ter pelo menos 1 letra minúscula.', 'error')
            return redirect(url_for('auth.register'))
        if not re.search(r'[0-9]', password):
            flash('Senha precisa ter pelo menos 1 número.', 'error')
            return redirect(url_for('auth.register'))
        if not re.search(r'[^A-Za-z0-9]', password):
            flash('Senha precisa ter pelo menos 1 caractere especial.', 'error')
            return redirect(url_for('auth.register'))

        # Verificar se e-mail já existe
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('E-mail já cadastrado', 'error')
            return redirect(url_for('auth.register'))
        
        # Criar novo usuário
        new_user = User(
            name=name,
            email=email,
            phone=phone,
            gender=gender,
            role='ALUNO'  # Novo usuário sempre é aluno
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Cadastro realizado com sucesso! Faça login.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('register.html')


@auth_bp.route('/logout')
def logout():
    """Fazer logout"""
    session.clear()
    flash('Você saiu do sistema', 'info')
    return redirect(url_for('auth.login'))


def login_required(f):
    """Decorator para proteger rotas"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Você precisa estar logado', 'error')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator para rotas de admin"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Você precisa estar logado', 'error')
            return redirect(url_for('auth.login'))
        if session.get('user_role') != 'ADMIN':
            flash('Acesso negado', 'error')
            return redirect(url_for('routes.list_classes'))
        return f(*args, **kwargs)
    return decorated_function
