"""
Rotas principais do sistema
Aulas, inscrições e pagamentos
"""
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from models import db, Class, Enrollment, Payment, User
from auth import login_required, admin_required
from mercadopago_pix import create_pix_payment, check_payment_status
from datetime import datetime, timedelta
from sqlalchemy import func

routes_bp = Blueprint('routes', __name__)


# ===== ROTAS DE ALUNOS =====

@routes_bp.route('/classes')
@login_required
def list_classes():
    """Listar todas as aulas disponíveis"""
    from datetime import datetime as dt
    # Buscar aulas ativas futuras (status OPEN)
    classes = Class.query.filter(
        Class.status == 'OPEN',
        Class.starts_at >= dt.now()
    ).order_by(Class.starts_at).all()
    
    # Buscar inscrições do usuário (confirmadas e pendentes)
    user_enrollments = Enrollment.query.filter(
        Enrollment.user_id == session['user_id'],
        Enrollment.status.in_(['CONFIRMED', 'AWAITING_PAYMENT'])
    ).all()

    enrolled_class_ids = [e.class_id for e in user_enrollments if e.status == 'CONFIRMED']
    enrollment_map = {e.class_id: e for e in user_enrollments}
    
    return render_template(
        'classes.html',
        classes=classes,
        enrolled_class_ids=enrolled_class_ids,
        enrollment_map=enrollment_map
    )


@routes_bp.route('/classes/<int:class_id>')
@login_required
def class_detail(class_id):
    """Detalhes de uma aula"""
    class_obj = Class.query.get_or_404(class_id)
    
    # Buscar inscrições confirmadas
    enrollments = Enrollment.query.filter_by(
        class_id=class_id,
        status='CONFIRMED'
    ).join(User).all()
    
    # Formatar nomes (primeiro nome + inicial do sobrenome)
    enrolled_students = []
    for enrollment in enrollments:
        user = enrollment.user
        name_parts = user.name.split()
        if len(name_parts) > 1:
            display_name = f"{name_parts[0]} {name_parts[1][0]}."
        else:
            display_name = name_parts[0]
        enrolled_students.append(display_name)
    
    # Verificar se usuário já está inscrito CONFIRMADO (não contar AWAITING_PAYMENT)
    user_enrollment = Enrollment.query.filter_by(
        user_id=session['user_id'],
        class_id=class_id
    ).filter(Enrollment.status.in_(['CONFIRMED', 'AWAITING_PAYMENT'])).first()
    
    from flask import make_response
    response = make_response(render_template(
        'class_detail.html',
        class_obj=class_obj,
        enrolled_students=enrolled_students,
        user_enrollment=user_enrollment
    ))
    
    # Desabilitar cache para sempre buscar a página atualizada
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response


@routes_bp.route('/classes/<int:class_id>/enroll', methods=['POST'])
@login_required
def enroll_class(class_id):
    """Preparar pagamento para inscrição"""
    try:
        class_obj = Class.query.get_or_404(class_id)
        
        # Verificar se aula está aberta
        if class_obj.status != 'OPEN':
            flash('Esta aula não está disponível', 'error')
            return redirect(url_for('routes.class_detail', class_id=class_id))
        
        # Verificar se já existe uma inscrição deste usuário para esta aula
        existing = Enrollment.query.filter_by(
            user_id=session['user_id'],
            class_id=class_id
        ).first()

        if existing:
            if existing.status == 'CONFIRMED':
                flash('Você já está inscrito nesta aula', 'warning')
                return redirect(url_for('routes.class_detail', class_id=class_id))

            if existing.status == 'AWAITING_PAYMENT':
                # Regenerar PIX para pendente
                Payment.query.filter_by(enrollment_id=existing.id).delete()
                db.session.commit()
                enrollment = existing
                flash('Novo código PIX gerado. A anterior foi cancelada.', 'info')
            else:
                # CANCELLED ou outros status: reaproveitar inscrição
                Payment.query.filter_by(enrollment_id=existing.id).delete()
                existing.status = 'AWAITING_PAYMENT'
                existing.cancelled_at = None
                db.session.commit()
                enrollment = existing
        else:
            # Verificar capacidade (apenas inscrições CONFIRMADAS contam)
            if class_obj.is_full():
                flash('Esta aula está lotada', 'error')
                return redirect(url_for('routes.class_detail', class_id=class_id))
            
            # Criar nova inscrição com status AWAITING_PAYMENT
            enrollment = Enrollment(
                user_id=session['user_id'],
                class_id=class_id,
                status='AWAITING_PAYMENT'
            )
            db.session.add(enrollment)
            db.session.commit()
        
        # Criar novo pagamento PIX
        user = User.query.get(session['user_id'])
        pix_data = create_pix_payment(
            enrollment_id=enrollment.id,
            amount=float(class_obj.price),
            description=f"Aula: {class_obj.title} - {class_obj.date}",
            payer_email=user.email,
            payer_name=user.name
        )
        
        if pix_data.get('error'):
            flash(f'Erro ao gerar PIX: {pix_data["error"]}', 'error')
            return redirect(url_for('routes.class_detail', class_id=class_id))
        
        # Salvar novo pagamento
        payment = Payment(
            enrollment_id=enrollment.id,
            amount_cents=int(float(class_obj.price) * 100),
            method='PIX',
            status='PENDING',
            provider='mercadopago',
            provider_charge_id=str(pix_data['payment_id']),
            pix_payload=pix_data['qr_code'],
            qr_code_base64=pix_data['qr_code_base64']
        )
        db.session.add(payment)
        db.session.commit()
        
        try:
            last_msg = None
            # get_flashed_messages é importado do flask
            from flask import get_flashed_messages
            msgs = get_flashed_messages()
            if msgs:
                last_msg = msgs[-1]
            if not last_msg or 'Novo código' not in last_msg:
                flash('Realize o pagamento via PIX para confirmar sua inscrição', 'info')
        except Exception:
            flash('Realize o pagamento via PIX para confirmar sua inscrição', 'info')
        return redirect(url_for('routes.payment_page', enrollment_id=enrollment.id))
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao inscrever: {e}")
        flash(f'Erro ao processar inscrição: {str(e)}', 'error')
        return redirect(url_for('routes.class_detail', class_id=class_id))


@routes_bp.route('/enrollments/<int:enrollment_id>/cancel', methods=['POST'])
@login_required
def cancel_enrollment(enrollment_id):
    """Permitir que o aluno cancele uma inscrição pendente."""
    enrollment = Enrollment.query.get_or_404(enrollment_id)

    # Garantir que pertence ao usuário logado
    if enrollment.user_id != session['user_id']:
        flash('Acesso não autorizado', 'error')
        return redirect(url_for('routes.list_classes'))

    if enrollment.status == 'CANCELLED':
        flash('Essa inscrição já foi cancelada.', 'info')
        return redirect(url_for('routes.class_detail', class_id=enrollment.class_id))

    try:
        # Marcar inscrição como cancelada e registrar data
        enrollment.status = 'CANCELLED'
        enrollment.cancelled_at = datetime.utcnow()

        # Se houver pagamento, anotar status
        payment = Payment.query.filter_by(enrollment_id=enrollment.id).first()
        if payment:
            if payment.status == 'PAID':
                # Mantém pago; apenas registrar observação
                payment.notes = (payment.notes or '') + '\nCancelado pelo aluno (sem estorno automático).'
                payment.validated_at = datetime.utcnow()
            else:
                payment.status = 'REJECTED'
                payment.notes = (payment.notes or '') + '\nCancelado pelo aluno.'
                payment.validated_at = datetime.utcnow()

        db.session.commit()
        flash('Inscrição cancelada com sucesso.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao cancelar inscrição: {e}', 'error')

    return redirect(url_for('routes.class_detail', class_id=enrollment.class_id))


@routes_bp.route('/payment/<int:enrollment_id>')
@login_required
def payment_page(enrollment_id):
    """Página de pagamento PIX"""
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    payment = Payment.query.filter_by(enrollment_id=enrollment_id).first_or_404()
    class_obj = Class.query.get_or_404(enrollment.class_id)
    
    # Verificar se o enrollment pertence ao usuário
    if enrollment.user_id != session['user_id']:
        flash('Acesso não autorizado', 'error')
        return redirect(url_for('routes.dashboard'))
    
    return render_template(
        'payment.html',
        payment=payment,
        enrollment=enrollment,
        class_obj=class_obj
    )


@routes_bp.route('/payment/<int:enrollment_id>/status')
@login_required
def payment_status(enrollment_id):
    """API para verificar status do pagamento"""
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    payment = Payment.query.filter_by(enrollment_id=enrollment_id).first_or_404()
    
    # Verificar se o enrollment pertence ao usuário
    if enrollment.user_id != session['user_id']:
        return jsonify({'error': 'Acesso negado'}), 403

    # Consultar o Mercado Pago quando ainda estiver pendente
    if payment.status != 'PAID' and payment.provider_charge_id:
        try:
            mp_payment = check_payment_status(payment.provider_charge_id)
            status = mp_payment.get('status') if mp_payment else None

            if status == 'approved':
                payment.status = 'PAID'
                payment.submitted_at = datetime.utcnow()
                payment.validated_at = datetime.utcnow()
                enrollment.status = 'CONFIRMED'
                db.session.commit()
            elif status in ['rejected', 'cancelled']:
                payment.status = 'REJECTED'
                db.session.commit()
        except Exception as e:
            # Mantém o status atual em caso de falha, mas registra no servidor
            print(f"Erro ao sincronizar status do pagamento {payment.id}: {e}")
    
    return jsonify({
        'payment_status': payment.status,
        'enrollment_status': enrollment.status,
        'paid': payment.status == 'PAID'
    })


@routes_bp.route('/payment/<int:enrollment_id>/refresh', methods=['POST'])
@login_required
def payment_refresh(enrollment_id):
    """Consulta o Mercado Pago e atualiza o status do pagamento manualmente."""
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    payment = Payment.query.filter_by(enrollment_id=enrollment_id).first_or_404()

    # Verificar se o enrollment pertence ao usuário
    if enrollment.user_id != session['user_id']:
        return jsonify({'error': 'Acesso negado'}), 403

    try:
        from mercadopago_pix import check_payment_status

        mp_payment = check_payment_status(payment.provider_charge_id)
        if not mp_payment:
            return jsonify({'error': 'Falha ao consultar pagamento'}), 500

        status = mp_payment.get('status')

        if status == 'approved':
            payment.status = 'PAID'
            payment.submitted_at = datetime.utcnow()
            payment.validated_at = datetime.utcnow()
            enrollment.status = 'CONFIRMED'
            db.session.commit()
            return jsonify({'status': 'approved'}), 200
        elif status in ['rejected', 'cancelled']:
            payment.status = 'REJECTED'
            db.session.commit()
            return jsonify({'status': 'rejected'}), 200
        else:
            # pending / in_process etc
            return jsonify({'status': 'pending'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@routes_bp.route('/payment/<int:enrollment_id>/test-approve', methods=['POST'])
@login_required
def test_approve_payment(enrollment_id):
    """Rota de teste: simular aprovação de pagamento (desenvolvimento apenas)"""
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    payment = Payment.query.filter_by(enrollment_id=enrollment_id).first_or_404()
    
    # Verificar se o enrollment pertence ao usuário
    if enrollment.user_id != session['user_id']:
        return jsonify({'error': 'Acesso negado'}), 403
    
    # Aprovar pagamento
    payment.status = 'PAID'
    payment.submitted_at = datetime.utcnow()
    payment.validated_at = datetime.utcnow()
    
    # Confirmar inscrição
    enrollment.status = 'CONFIRMED'
    
    db.session.commit()
    
    return jsonify({'status': 'approved'}), 200


# ===== DASHBOARD ADMIN =====

@routes_bp.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    """Página do dashboard administrativo."""
    now = datetime.utcnow()
    return render_template(
        'admin_dashboard.html',
        current_month=now.month,
        current_year=now.year
    )


@routes_bp.route('/admin/dashboard/data')
@admin_required
def admin_dashboard_data():
    """API de dados do dashboard (KPI + gráficos)."""
    # Filtros de período (padrão: mês/ano atual)
    month = request.args.get('month', type=int) or datetime.utcnow().month
    year = request.args.get('year', type=int) or datetime.utcnow().year

    try:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
    except Exception:
        return jsonify({'error': 'Parâmetros de data inválidos'}), 400

    # KPIs mensais
    total_classes = db.session.query(func.count(Class.id)).filter(
        Class.starts_at >= start_date,
        Class.starts_at < end_date
    ).scalar() or 0

    cancelled_classes = db.session.query(func.count(Class.id)).filter(
        Class.starts_at >= start_date,
        Class.starts_at < end_date,
        Class.status == 'CANCELLED'
    ).scalar() or 0

    total_enrollments = db.session.query(func.count(Enrollment.id)).join(Class).filter(
        Class.starts_at >= start_date,
        Class.starts_at < end_date
    ).scalar() or 0

    unique_students = db.session.query(func.count(func.distinct(Enrollment.user_id))).join(Class).filter(
        Class.starts_at >= start_date,
        Class.starts_at < end_date
    ).scalar() or 0

    revenue_cents = db.session.query(func.coalesce(func.sum(Payment.amount_cents), 0)).join(
        Enrollment, Payment.enrollment_id == Enrollment.id
    ).join(Class, Enrollment.class_id == Class.id).filter(
        Payment.status == 'PAID',
        Class.starts_at >= start_date,
        Class.starts_at < end_date
    ).scalar() or 0
    revenue_brl = float(revenue_cents) / 100.0 if revenue_cents else 0.0

    confirmed_count = db.session.query(func.count(Enrollment.id)).join(Class).filter(
        Class.starts_at >= start_date,
        Class.starts_at < end_date,
        Enrollment.status == 'CONFIRMED'
    ).scalar() or 0

    total_capacity = db.session.query(func.coalesce(func.sum(Class.capacity), 0)).filter(
        Class.starts_at >= start_date,
        Class.starts_at < end_date
    ).scalar() or 0

    cancel_rate = round((cancelled_classes / total_classes) * 100, 1) if total_classes else 0.0
    avg_occupancy = round((confirmed_count / total_capacity) * 100, 1) if total_capacity else 0.0

    # Status das inscrições (pizza)
    status_rows = db.session.query(
        Enrollment.status,
        func.count(Enrollment.id)
    ).join(Class).filter(
        Class.starts_at >= start_date,
        Class.starts_at < end_date
    ).group_by(Enrollment.status).all()
    enrollment_status = {row[0]: row[1] for row in status_rows}

    # Séries por mês (ano selecionado)
    classes_per_month_rows = db.session.query(
        func.to_char(func.date_trunc('month', Class.starts_at), 'YYYY-MM').label('month'),
        func.count(Class.id)
    ).filter(func.extract('year', Class.starts_at) == year).group_by('month').order_by('month').all()

    students_per_month_rows = db.session.query(
        func.to_char(func.date_trunc('month', Class.starts_at), 'YYYY-MM').label('month'),
        func.count(func.distinct(Enrollment.user_id))
    ).join(Class, Enrollment.class_id == Class.id).filter(
        func.extract('year', Class.starts_at) == year
    ).group_by('month').order_by('month').all()

    revenue_per_month_rows = db.session.query(
        func.to_char(func.date_trunc('month', Class.starts_at), 'YYYY-MM').label('month'),
        func.coalesce(func.sum(Payment.amount_cents), 0)
    ).join(Enrollment, Payment.enrollment_id == Enrollment.id).join(Class, Enrollment.class_id == Class.id).filter(
        func.extract('year', Class.starts_at) == year,
        Payment.status == 'PAID'
    ).group_by('month').order_by('month').all()

    cancelled_per_month_rows = db.session.query(
        func.to_char(func.date_trunc('month', Class.starts_at), 'YYYY-MM').label('month'),
        func.count(Class.id)
    ).filter(
        func.extract('year', Class.starts_at) == year,
        Class.status == 'CANCELLED'
    ).group_by('month').order_by('month').all()

    # Ocupação por dia da semana (período filtrado)
    confirmed_sub = db.session.query(
        Enrollment.class_id.label('class_id'),
        func.count(Enrollment.id).label('confirmed_count')
    ).filter(Enrollment.status == 'CONFIRMED').group_by(Enrollment.class_id).subquery()

    weekday_rows = db.session.query(
        func.extract('dow', Class.starts_at).label('dow'),
        func.to_char(Class.starts_at, 'Dy').label('weekday'),
        func.coalesce(func.sum(confirmed_sub.c.confirmed_count), 0).label('confirmed_sum'),
        func.coalesce(func.sum(Class.capacity), 0).label('capacity_sum')
    ).outerjoin(confirmed_sub, confirmed_sub.c.class_id == Class.id).filter(
        Class.starts_at >= start_date,
        Class.starts_at < end_date
    ).group_by('dow', 'weekday').order_by('dow').all()

    def normalize_month_series(rows, convert_to_brl=False):
        labels = []
        data = []
        for month_label, value in rows:
            labels.append(month_label)
            data.append(float(value) / 100.0 if convert_to_brl else int(value))
        return {'labels': labels, 'data': data}

    charts = {
        'classes_per_month': normalize_month_series(classes_per_month_rows),
        'students_per_month': normalize_month_series(students_per_month_rows),
        'revenue_per_month': normalize_month_series(revenue_per_month_rows, convert_to_brl=True),
        'cancelled_per_month': normalize_month_series(cancelled_per_month_rows),
        'status_pie': {
            'labels': list(enrollment_status.keys()),
            'data': list(enrollment_status.values())
        },
        'weekday_occupancy': {
            'labels': [],
            'data': []
        }
    }

    for row in weekday_rows:
        occupancy = 0.0
        if row.capacity_sum and row.capacity_sum > 0:
            occupancy = round((row.confirmed_sum / row.capacity_sum) * 100, 1)
        charts['weekday_occupancy']['labels'].append(row.weekday.strip())
        charts['weekday_occupancy']['data'].append(occupancy)

    response_payload = {
        'period': {'month': month, 'year': year},
        'kpis': {
            'total_classes': int(total_classes),
            'cancelled_classes': int(cancelled_classes),
            'unique_students': int(unique_students),
            'total_enrollments': int(total_enrollments),
            'revenue_brl': revenue_brl,
            'cancel_rate': cancel_rate,
            'avg_occupancy': avg_occupancy
        },
        'charts': charts
    }

    return jsonify(response_payload)

@routes_bp.route('/admin/classes')
@admin_required
def admin_classes():
    """Painel admin - listar aulas"""
    classes = Class.query.order_by(Class.starts_at.desc()).all()
    return render_template('admin_classes.html', classes=classes)


@routes_bp.route('/admin/classes/create', methods=['GET', 'POST'])
@admin_required
def create_class():
    """Criar nova aula"""
    if request.method == 'POST':
        title = request.form.get('title')
        date_str = request.form.get('date')
        time_str = request.form.get('time')
        duration = request.form.get('duration_minutes', 90)
        capacity = request.form.get('capacity')
        price = request.form.get('price')
        
        # Converter data e hora
        class_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        class_time = datetime.strptime(time_str, '%H:%M').time()
        
        # Criar aula
        new_class = Class(
            title=request.form.get('title'),
            starts_at=datetime.combine(class_date, class_time),
            ends_at=datetime.combine(class_date, datetime.strptime(time_str, '%H:%M').time()) + timedelta(minutes=int(duration)),
            capacity=int(capacity),
            price_cents=int(float(price) * 100),  # converter para centavos
            status='OPEN',
            created_by=session['user_id'],
            notes=request.form.get('notes')
        )
        
        db.session.add(new_class)
        db.session.commit()
        
        flash('Aula criada com sucesso!', 'success')
        return redirect(url_for('routes.admin_classes'))
    
    return render_template('create_class.html')


@routes_bp.route('/admin/classes/<int:class_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_class(class_id):
    """Editar aula existente"""
    class_obj = Class.query.get_or_404(class_id)
    
    if request.method == 'POST':
        # Atualizar dados
        class_obj.title = request.form.get('title')
        class_obj.notes = request.form.get('notes')
        
        # Atualizar data e hora se fornecidas
        date_str = request.form.get('date')
        time_str = request.form.get('time')
        if date_str and time_str:
            class_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            class_time = datetime.strptime(time_str, '%H:%M').time()
            class_obj.starts_at = datetime.combine(class_date, class_time)
            
            duration = int(request.form.get('duration_minutes', 90))
            class_obj.ends_at = class_obj.starts_at + timedelta(minutes=duration)
        
        # Atualizar capacidade e preço
        capacity = request.form.get('capacity')
        price = request.form.get('price')
        
        if capacity:
            class_obj.capacity = int(capacity)
        
        if price:
            class_obj.price_cents = int(float(price) * 100)
        
        db.session.commit()
        flash('Aula atualizada com sucesso!', 'success')
        return redirect(url_for('routes.admin_classes'))
    
    # GET - Mostrar formulário com dados atuais
    return render_template('edit_class.html', class_obj=class_obj)


@routes_bp.route('/admin/classes/<int:class_id>/view')
@admin_required
def view_class_detail_admin(class_id):
    """Detalhes da aula para admin com lista de inscritos."""
    class_obj = Class.query.get_or_404(class_id)

    enrollments = Enrollment.query.filter_by(class_id=class_id).join(User).all()
    enrollment_ids = [e.id for e in enrollments]
    payments = Payment.query.filter(Payment.enrollment_id.in_(enrollment_ids)).all() if enrollment_ids else []
    payment_map = {p.enrollment_id: p for p in payments}

    # Agrupar por status
    confirmed = [e for e in enrollments if e.status == 'CONFIRMED']
    pending = [e for e in enrollments if e.status == 'AWAITING_PAYMENT']
    others = [e for e in enrollments if e.status not in ['CONFIRMED', 'AWAITING_PAYMENT']]

    return render_template(
        'admin_class_detail.html',
        class_obj=class_obj,
        confirmed=confirmed,
        pending=pending,
        others=others,
        payment_map=payment_map
    )


@routes_bp.route('/admin/classes/<int:class_id>/cancel', methods=['POST'])
@admin_required
def cancel_class(class_id):
    """Cancelar aula"""
    class_obj = Class.query.get_or_404(class_id)
    class_obj.status = 'CANCELLED'
    db.session.commit()
    
    flash('Aula cancelada', 'success')
    return redirect(url_for('routes.admin_classes'))


# ===== WEBHOOK MERCADO PAGO =====

@routes_bp.route('/webhooks/mercadopago', methods=['POST'])
def mercadopago_webhook():
    """Webhook do Mercado Pago para notificações de pagamento"""
    try:
        data = request.get_json()
        
        # Mercado Pago envia notificações de vários tipos
        # Filtrar apenas pagamentos
        if data.get('type') != 'payment':
            return jsonify({'status': 'ignored'}), 200
        
        # Obter ID do pagamento
        payment_id = data.get('data', {}).get('id')
        if not payment_id:
            return jsonify({'error': 'payment_id not found'}), 400
        
        # Buscar pagamento no banco
        payment = Payment.query.filter_by(provider_charge_id=str(payment_id)).first()
        if not payment:
            return jsonify({'error': 'payment not found in database'}), 404
        
        # Consultar status no Mercado Pago
        from mercadopago_pix import check_payment_status
        mp_payment = check_payment_status(payment_id)
        
        if not mp_payment:
            return jsonify({'error': 'failed to fetch payment from MP'}), 500
        
        # Verificar se foi aprovado
        if mp_payment.get('status') == 'approved':
            # Atualizar pagamento
            payment.status = 'PAID'
            payment.submitted_at = datetime.utcnow()
            payment.validated_at = datetime.utcnow()
            
            # Atualizar inscrição de AWAITING_PAYMENT para CONFIRMED
            if payment.enrollment_id:
                enrollment = Enrollment.query.get(payment.enrollment_id)
                if enrollment:
                    enrollment.status = 'CONFIRMED'
                    db.session.commit()
                    print(f"✓ Pagamento aprovado e inscrição confirmada: {payment_id}")
                    return jsonify({'status': 'payment_confirmed'}), 200
            
            db.session.commit()
            print(f"✓ Pagamento aprovado: {payment_id}")
            return jsonify({'status': 'payment_confirmed'}), 200
        
        return jsonify({'status': 'payment_not_approved'}), 200
        
    except Exception as e:
        print(f"✗ Erro no webhook: {e}")
        return jsonify({'error': str(e)}), 500

# ===== ROTAS ADMIN - DELETAR USUÁRIOS =====

@routes_bp.route('/admin/users')
@admin_required
def list_users():
    """Listar todos os usuários (admin only)"""
    users = User.query.all()
    return render_template('admin_users.html', users=users)


@routes_bp.route('/admin/users/<user_id>/delete', methods=['POST'])
@admin_required
def delete_user(user_id):
    """Deletar um usuário (admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            flash('❌ Usuário não encontrado', 'error')
            return redirect(url_for('routes.list_users'))
        
        # Não permitir deletar a si mesmo
        if str(user.id) == str(session.get('user_id')):
            flash('❌ Você não pode deletar sua própria conta!', 'error')
            return redirect(url_for('routes.list_users'))
        
        user_email = user.email
        
        # Deletar todas as inscrições do usuário
        Enrollment.query.filter_by(user_id=user_id).delete()
        
        # Deletar todos os pagamentos do usuário
        Payment.query.filter_by(
            user_id=user_id
        ).delete()
        
        # Deletar o usuário
        db.session.delete(user)
        db.session.commit()
        
        flash(f'✓ Usuário {user_email} deletado com sucesso!', 'success')
        return redirect(url_for('routes.list_users'))
        
    except Exception as e:
        db.session.rollback()
        flash(f'❌ Erro ao deletar usuário: {str(e)}', 'error')
        return redirect(url_for('routes.list_users'))


@routes_bp.route('/admin/users/<user_id>/view')
@admin_required
def view_user_details(user_id):
    """Ver detalhes de um usuário e suas inscrições"""
    user = User.query.get_or_404(user_id)
    
    # Buscar inscrições do usuário
    enrollments = Enrollment.query.filter_by(user_id=user_id).join(Class).all()
    
    # Buscar pagamentos do usuário
    payments = Payment.query.filter_by(user_id=user_id).all()
    
    return render_template(
        'admin_user_details.html',
        user=user,
        enrollments=enrollments,
        payments=payments
    )


@routes_bp.route('/profile')
@login_required
def user_profile():
    """Perfil do usuário com histórico de aulas e pagamentos."""
    user = User.query.get_or_404(session['user_id'])

    # Inscrições do usuário + aulas
    enrollments = Enrollment.query.filter_by(user_id=user.id).join(Class).order_by(Class.starts_at.desc()).all()
    enrollment_ids = [e.id for e in enrollments]

    payments = Payment.query.filter(Payment.enrollment_id.in_(enrollment_ids)).all() if enrollment_ids else []
    payment_map = {p.enrollment_id: p for p in payments}

    # KPIs simples
    from datetime import datetime as dt, timezone

    def normalize_to_utc_naive(d):
        """Converte datetime para UTC sem tzinfo para comparação segura."""
        if not d:
            return None
        try:
            if d.tzinfo is not None:
                return d.astimezone(timezone.utc).replace(tzinfo=None)
            return d
        except Exception:
            return d

    now_utc_naive = dt.utcnow()
    confirmed_count = sum(1 for e in enrollments if e.status == 'CONFIRMED')
    pending_count = sum(1 for e in enrollments if e.status == 'AWAITING_PAYMENT')
    total_paid_brl = sum(p.amount for p in payments if p.status == 'PAID')
    upcoming_count = sum(
        1
        for e in enrollments
        if getattr(e, 'class_ref', None)
        and normalize_to_utc_naive(e.class_ref.starts_at) is not None
        and normalize_to_utc_naive(e.class_ref.starts_at) >= now_utc_naive
    )

    stats = {
        'confirmed': confirmed_count,
        'pending': pending_count,
        'total_paid_brl': total_paid_brl,
        'upcoming': upcoming_count,
    }

    return render_template(
        'profile.html',
        user=user,
        enrollments=enrollments,
        payment_map=payment_map,
        stats=stats
    )


@routes_bp.route('/admin')
@admin_required
def admin_home():
    """Hub inicial do admin para escolher destino."""
    return render_template('admin_home.html')