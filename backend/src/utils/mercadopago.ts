import axios from 'axios';
import 'dotenv/config';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 segundos

// Função para obter o token (carregado após dotenv)
const getToken = () => process.env.MERCADO_PAGO_ACCESS_TOKEN;

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Criar pagamento PIX real com QR Code
export const criarPagamentoPix = async (dados: {
  titulo: string;
  descricao: string;
  valor: number;
  email: string;
  nomeAluno: string;
  aulaId: string;
  inscricaoId: string;
}) => {
  const TOKEN = getToken();
  
  if (!TOKEN || !TOKEN.startsWith('APP_USR-')) {
    console.log('⚠️ Token não configurado, usando fallback de preferência');
    return null;
  }

  try {
    console.log('\n💳 Criando pagamento PIX...');
    console.log('   Aula:', dados.titulo);
    console.log('   Valor: R$', dados.valor);
    
    const res = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: Number(dados.valor),
        description: `${dados.titulo} - ${dados.descricao}`,
        payment_method_id: 'pix',
        payer: {
          email: dados.email,
          first_name: dados.nomeAluno.split(' ')[0],
          last_name: dados.nomeAluno.split(' ').slice(1).join(' ') || 'Aluno',
        },
        external_reference: dados.inscricaoId,
      },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${dados.inscricaoId}-${Date.now()}`,
        },
        timeout: 15000,
      }
    );

    console.log('✅ Pagamento PIX criado!');
    console.log('   ID:', res.data.id);
    console.log('   Status:', res.data.status);
    
    const pixData = res.data.point_of_interaction?.transaction_data;
    
    if (pixData) {
      console.log('   QR Code Base64:', pixData.qr_code_base64 ? 'SIM' : 'NÃO');
      console.log('   QR Code (copia e cola):', pixData.qr_code ? pixData.qr_code.substring(0, 50) + '...' : 'NÃO');
    }

    return {
      id: res.data.id.toString(),
      status: res.data.status,
      qrCodeBase64: pixData?.qr_code_base64 || null,
      qrCode: pixData?.qr_code || null,
      ticketUrl: pixData?.ticket_url || null,
      isPix: true,
    };
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', error.response?.data || error.message);
    return null;
  }
};

export const criarPreferencaPagamento = async (dados: {
  titulo: string;
  descricao: string;
  valor: number;
  email: string;
  nomeAluno: string;
  aulaId: string;
  inscricaoId: string;
}) => {
  const TOKEN = getToken();
  
  // Criar preferência de checkout primeiro (para ter o link de cartão)
  let checkoutLink = '';
  
  if (TOKEN && TOKEN.startsWith('APP_USR-')) {
    try {
      console.log('📝 Criando preferência de checkout (link cartão)...');
      const checkoutRes = await axios.post(
        'https://api.mercadopago.com/checkout/preferences',
        {
          items: [
            {
              title: dados.titulo,
              description: dados.descricao,
              quantity: 1,
              unit_price: Number(dados.valor),
              currency_id: 'BRL',
            },
          ],
          payer: {
            email: dados.email,
            name: dados.nomeAluno,
          },
          external_reference: dados.inscricaoId,
        },
        {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      checkoutLink = checkoutRes.data.init_point;
      console.log('✅ Link cartão criado:', checkoutLink);
    } catch (err: any) {
      console.log('⚠️ Erro ao criar link cartão:', err.message);
    }
  }

  // Agora tenta criar pagamento PIX direto (QR code real)
  const pixResult = await criarPagamentoPix(dados);
  
  if (pixResult && pixResult.qrCodeBase64) {
    console.log('🎉 PIX com QR Code real criado com sucesso!');
    return {
      id: pixResult.id,
      init_point: checkoutLink || pixResult.ticketUrl || '', // Link do cartão primeiro, fallback para PIX
      qrData: pixResult.qrCode || '',
      qrCodeBase64: pixResult.qrCodeBase64,
      isPix: true,
      isSimulated: false,
    };
  }

  // Fallback: usar apenas preferência de checkout (link)
  console.log('📝 Fallback: Usando apenas preferência de checkout...');
  
  if (checkoutLink) {
    return {
      id: `pref_${Date.now()}`,
      init_point: checkoutLink,
      qrData: checkoutLink,
      isPix: false,
      isSimulated: false,
    };
  }
  
  let ultimoErro: any = null;

  for (let tentativa = 1; tentativa <= RETRY_ATTEMPTS; tentativa++) {
    try {
      console.log(`\n💳 Tentativa ${tentativa}/${RETRY_ATTEMPTS}: Criando preferência...`);

      if (TOKEN && TOKEN.startsWith('APP_USR-')) {
        try {
          const res = await axios.post(
            'https://api.mercadopago.com/checkout/preferences',
            {
              items: [
                {
                  title: dados.titulo,
                  description: dados.descricao,
                  quantity: 1,
                  unit_price: Number(dados.valor),
                  currency_id: 'BRL',
                },
              ],
              payer: {
                email: dados.email,
                name: dados.nomeAluno,
              },
              external_reference: dados.inscricaoId,
            },
            {
              headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );

          console.log('✅ Preferência criada!');
          console.log('   ID:', res.data.id);
          console.log('   init_point:', res.data.init_point);

          return {
            id: res.data.id,
            init_point: res.data.init_point,
            qrData: res.data.init_point,
            isPix: false,
            isSimulated: false,
          };
        } catch (apiError: any) {
          ultimoErro = apiError;
          console.log(`⚠️  API falhou:`, apiError.response?.data || apiError.message);
          if (tentativa < RETRY_ATTEMPTS) {
            await sleep(RETRY_DELAY);
            continue;
          }
        }
      }

      // Mock fallback
      const mockId = `pref_${Date.now()}`;
      return {
        id: mockId,
        init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${mockId}`,
        qrData: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${mockId}`,
        isPix: false,
        isSimulated: true,
      };
    } catch (error: any) {
      ultimoErro = error;
      if (tentativa < RETRY_ATTEMPTS) {
        await sleep(RETRY_DELAY);
      }
    }
  }

  const mockId = `pref_${Date.now()}`;
  return {
    id: mockId,
    init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${mockId}`,
    qrData: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${mockId}`,
    isPix: false,
    isSimulated: true,
  };
};

// Buscar pagamentos por external_reference (inscricaoId)
export const buscarPagamentosPorReferencia = async (externalReference: string) => {
  const TOKEN = getToken();
  
  if (!TOKEN) {
    console.log('⚠️ Token não configurado para buscar pagamentos');
    return null;
  }

  try {
    console.log('🔍 Buscando pagamentos para referência:', externalReference);
    
    const res = await axios.get(
      `https://api.mercadopago.com/v1/payments/search`,
      {
        params: {
          external_reference: externalReference,
          sort: 'date_created',
          criteria: 'desc',
        },
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
        timeout: 10000,
      }
    );

    console.log('📦 Pagamentos encontrados:', res.data.results?.length || 0);
    
    if (res.data.results && res.data.results.length > 0) {
      const pagamento = res.data.results[0];
      console.log('💳 Último pagamento:', {
        id: pagamento.id,
        status: pagamento.status,
        status_detail: pagamento.status_detail,
      });
      return pagamento;
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Erro ao buscar pagamentos:', error.response?.data || error.message);
    return null;
  }
};

export const obterStatusPagamento = async (paymentId: string) => {
  return { id: paymentId, status: 'pending' };
};

export const verificarWebhookMercadoPago = (signature: string, body: any) => {
  return signature && body && body.type;
};

export default {
  criarPreferencaPagamento,
  criarPagamentoPix,
  obterStatusPagamento,
  verificarWebhookMercadoPago,
  buscarPagamentosPorReferencia,
};
