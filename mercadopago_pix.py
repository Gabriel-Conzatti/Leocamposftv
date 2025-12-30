"""
Integração com Mercado Pago
Geração de PIX dinâmico e verificação de pagamentos
"""
import os
import mercadopago


def create_pix_payment(enrollment_id, amount, description, payer_email, payer_name):
    """
    Criar pagamento PIX no Mercado Pago
    
    Args:
        enrollment_id: ID da inscrição
        amount: Valor em reais
        description: Descrição do pagamento
        payer_email: E-mail do pagador
        payer_name: Nome do pagador
    
    Returns:
        dict com: payment_id, qr_code, qr_code_base64
    """
    try:
        # Inicializar SDK do Mercado Pago aqui (depois do .env ser carregado)
        access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
        if not access_token:
            print("✗ MERCADOPAGO_ACCESS_TOKEN não encontrado")
            return {"error": "Token do Mercado Pago não configurado"}
        
        sdk = mercadopago.SDK(access_token)
        
        # Dados do pagamento
        payment_data = {
            "transaction_amount": float(amount),
            "description": description,
            "payment_method_id": "pix",
            "payer": {
                "email": payer_email,
                "first_name": payer_name.split()[0] if payer_name else "Cliente",
                "last_name": payer_name.split()[-1] if len(payer_name.split()) > 1 else ""
            },
            "external_reference": str(enrollment_id)
        }
        
        # Adicionar notification_url apenas se a URL não for localhost
        base_url = os.getenv('BASE_URL', 'http://localhost:5000')
        if base_url and 'localhost' not in base_url and '127.0.0.1' not in base_url:
            payment_data["notification_url"] = f"{base_url}/webhooks/mercadopago"
        
        # Criar pagamento
        payment_response = sdk.payment().create(payment_data)
        payment = payment_response["response"]
        
        # Verificar se foi criado
        if payment_response["status"] not in [200, 201]:
            return {"error": f"Erro ao criar pagamento: {payment}"}
        
        # Extrair dados do PIX
        pix_data = payment.get("point_of_interaction", {}).get("transaction_data", {})
        
        print(f"✓ PIX criado com sucesso! ID: {payment['id']}")
        
        return {
            "payment_id": payment["id"],
            "qr_code": pix_data.get("qr_code"),  # Código copia e cola
            "qr_code_base64": pix_data.get("qr_code_base64"),  # QR Code em base64
            "ticket_url": pix_data.get("ticket_url")
        }
        
    except Exception as e:
        print(f"✗ Erro ao criar PIX: {e}")
        return {"error": str(e)}


def check_payment_status(payment_id):
    """
    Verificar status de um pagamento no Mercado Pago
    
    Args:
        payment_id: ID do pagamento no Mercado Pago
    
    Returns:
        dict com dados do pagamento ou None se erro
    """
    try:
        # Inicializar SDK
        access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
        if not access_token:
            print("✗ MERCADOPAGO_ACCESS_TOKEN não encontrado")
            return None
        
        sdk = mercadopago.SDK(access_token)
        
        payment_response = sdk.payment().get(payment_id)
        
        if payment_response["status"] == 200:
            return payment_response["response"]
        
        return None
        
    except Exception as e:
        print(f"✗ Erro ao consultar pagamento: {e}")
        return None


def refund_payment(payment_id):
    """
    Estornar um pagamento
    Args:
        payment_id: ID do pagamento no Mercado Pago
    
    Returns:
        True se sucesso, False se erro
    """
    try:
        # Inicializar SDK
        access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
        if not access_token:
            print("✗ MERCADOPAGO_ACCESS_TOKEN não encontrado")
            return False

        sdk = mercadopago.SDK(access_token)

        refund_response = sdk.refund().create(payment_id)
        
        if refund_response["status"] in [200, 201]:
            return True
        
        return False
        
    except Exception as e:
        print(f"✗ Erro ao estornar pagamento: {e}")
        return False
