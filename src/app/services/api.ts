import axios, { AxiosInstance, AxiosError } from 'axios';
import { Aula, APIResponse } from '../types';

// Em produção, VITE_API_URL vem do Render (ex: https://futevolei-api.onrender.com)
// Adiciona /api se necessário
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

class APIService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para tratar erros
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Redirecionar para login se for erro 401 em rota protegida
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth')) {
          this.token = null;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Carregar token do localStorage ao iniciar
    const token = localStorage.getItem('token');
    if (token) {
      this.token = token;
    }
  }

  // ===== AUTENTICAÇÃO =====
  async login(email: string, senha: string) {
    try {
      const response = await this.api.post<APIResponse>('/auth/login', {
        email,
        senha,
      });

      const { dados } = response.data;
      if (dados) {
        const { token } = dados as any;
        this.token = token;
        localStorage.setItem('token', token);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(nome: string, email: string, telefone: string, senha: string, confirmarSenha: string) {
    try {
      const response = await this.api.post<APIResponse>('/auth/register', {
        nome,
        email,
        telefone,
        senha,
        confirmarSenha,
      });

      const { dados } = response.data;
      if (dados) {
        const { token } = dados as any;
        this.token = token;
        localStorage.setItem('token', token);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { sucesso: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async solicitarRecuperacaoSenha(email: string) {
    try {
      const response = await this.api.post<APIResponse>('/auth/solicitar-recuperacao', {
        email,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetarSenha(token: string, novaSenha: string, confirmarNovaSenha: string) {
    try {
      const response = await this.api.post<APIResponse>('/auth/resetar-senha', {
        token,
        novaSenha,
        confirmarNovaSenha,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async obterContatoAdmin() {
    try {
      const response = await this.api.get<APIResponse>('/auth/contato-admin');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async obterPerfil() {
    try {
      const response = await this.api.get<APIResponse>('/auth/perfil');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async atualizarPerfil(dados: { nome?: string; telefone?: string; senhaAtual?: string; novaSenha?: string }) {
    try {
      const response = await this.api.put<APIResponse>('/auth/perfil', dados);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===== AULAS =====
  async listarAulas() {
    try {
      const response = await this.api.get<APIResponse>('/aulas');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async obterAula(id: string) {
    try {
      const response = await this.api.get<APIResponse>(`/aulas/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async criarAula(aula: Omit<Aula, 'id' | 'criadaEm' | 'atualizadaEm' | 'professorId'>) {
    try {
      const response = await this.api.post<APIResponse>('/aulas', aula);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async atualizarAula(id: string, aula: Partial<Aula>) {
    try {
      const response = await this.api.put<APIResponse>(`/aulas/${id}`, aula);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deletarAula(id: string) {
    try {
      const response = await this.api.delete<APIResponse>(`/aulas/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async obterAulasProfessor() {
    try {
      const response = await this.api.get<APIResponse>('/aulas/professor/minhas-aulas');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listarInscritosAula(aulaId: string) {
    try {
      const response = await this.api.get<APIResponse>(`/aulas/${aulaId}/inscritos`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async confirmarAula(aulaId: string, observacoes?: string) {
    try {
      const response = await this.api.put<APIResponse>(`/aulas/${aulaId}/confirmar`, { observacoes });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===== INSCRIÇÕES =====
  async inscreverAula(aulaId: string) {
    try {
      const response = await this.api.post<APIResponse>('/inscricoes', { aulaId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async obterMinhasInscricoes() {
    try {
      const response = await this.api.get<APIResponse>('/inscricoes/usuario/minhas-inscricoes');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async obterInscricoesAula(aulaId: string) {
    try {
      const response = await this.api.get<APIResponse>(`/inscricoes/aula/${aulaId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listarInscricoes() {
    try {
      const response = await this.api.get<APIResponse>('/inscricoes');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelarInscricao(inscricaoId: string) {
    try {
      const response = await this.api.delete<APIResponse>(`/inscricoes/${inscricaoId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async adicionarInscritoManual(aulaId: string, nome?: string, observacao?: string, usuarioId?: string) {
    try {
      const response = await this.api.post<APIResponse>('/inscricoes/admin/adicionar', {
        aulaId,
        nome,
        observacao,
        usuarioId,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listarUsuarios() {
    try {
      const response = await this.api.get<APIResponse>('/auth/usuarios');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removerInscritoAdmin(inscricaoId: string, removerPagamento: boolean = false) {
    try {
      const response = await this.api.delete<APIResponse>(
        `/inscricoes/admin/${inscricaoId}?removerPagamento=${removerPagamento}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  // ===== PAGAMENTOS =====
  async criarPreferencaMercadoPago(aulaId: string) {
    try {
      const response = await this.api.post<APIResponse>('/pagamentos/mercado-pago/preferencia', {
        aulaId,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async obterStatusPagamento(pagamentoId: string) {
    try {
      const response = await this.api.get<APIResponse>(`/pagamentos/${pagamentoId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async simularPagamento(pagamentoId: string, status: string = 'approved') {
    try {
      const response = await this.api.post<APIResponse>('/pagamentos/simular', {
        pagamentoId,
        status,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Verificar status do pagamento no Mercado Pago (polling)
  async verificarStatusPagamento(inscricaoId: string) {
    try {
      const response = await this.api.get<APIResponse>(`/pagamentos/verificar/${inscricaoId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===== UTILIDADES =====
  getToken() {
    return this.token || localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  private handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.mensagem || error.response?.data?.erro || error.message;
      const customError = new Error(message) as any;
      customError.response = error.response;
      return customError;
    }
    return error;
  }
}

export const api = new APIService();
