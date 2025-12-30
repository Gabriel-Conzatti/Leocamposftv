"""
Sistema de Agendamento de Aulas de Futevôlei
Arquivo principal - Flask App
"""
import os
from flask import Flask, session
from dotenv import load_dotenv
from models import db
from auth import auth_bp
from routes import routes_bp

# Carregar variáveis de ambiente
load_dotenv()

# Criar aplicação Flask
app = Flask(__name__)
db = SQLAlchemy()
# Configurações
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar banco de dados
db.init_app(app)

# Registrar blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(routes_bp)

@app.route('/')
def index():
    """Página inicial - redireciona para login ou classes"""
    if 'user_id' in session:
        from flask import redirect, url_for
        # Redireciona admin para hub, aluno para aulas
        if session.get('user_role') == 'ADMIN':
            return redirect(url_for('routes.admin_home'))
        return redirect(url_for('routes.list_classes'))
    from flask import redirect, url_for
    return redirect(url_for('auth.login'))

if __name__ == '__main__':
    with app.app_context():
        # Verificar conexão com banco
        try:
            db.engine.connect()
            print("✓ Conectado ao banco de dados!")
        except Exception as e:
            print(f"✗ Erro ao conectar no banco: {e}")
            exit(1)
    
    print("🚀 Servidor iniciado em http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
