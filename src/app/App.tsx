import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { LoginPage } from '@/components/LoginPage';
import { RegisterPage } from '@/components/RegisterPage';
import { EsqueciSenha } from '@/components/EsqueciSenha';
import { RecuperarSenha } from '@/components/RecuperarSenha';
import { AlunoDashboard } from '@/components/AlunoDashboard';
import { ProfessorDashboard } from '@/components/ProfessorDashboard';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { Usuario, Aula, Inscricao } from '@/types';

type Page = 'login' | 'register' | 'dashboard' | 'esqueci-senha' | 'recuperar-senha';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<(Usuario & { isAdmin?: boolean }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [recuperacaoToken, setRecuperacaoToken] = useState<string>('');

  // Verificar se há token de recuperação na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const page = urlParams.get('page');
    
    if (token) {
      setRecuperacaoToken(token);
      setCurrentPage('recuperar-senha');
      // Limpar URL sem recarregar a página
      window.history.replaceState({}, '', window.location.pathname);
    } else if (page === 'esqueci-senha') {
      setCurrentPage('esqueci-senha');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadAulas = async () => {
    try {
      const response = await api.obterAulasProfessor();
      if (response.dados) {
        setAulas(response.dados as Aula[]);
      }
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    }
  };

  const loadInscricoes = async () => {
    try {
      const response = await api.listarInscricoes();
      if (response.dados) {
        const inscricoesFormatadas = (response.dados as any[]).map(insc => ({
          ...insc,
          // Usar alunoNome que já vem formatado do backend (inclui nomeManual para inscritos manualmente)
          alunoNome: insc.alunoNome || insc.aluno?.nome || insc.usuario?.nome || insc.nomeManual || 'Aluno',
        }));
        setInscricoes(inscricoesFormatadas as Inscricao[]);
      }
    } catch (error) {
      console.error('Erro ao carregar inscrições:', error);
    }
  };

  const loadDadosAdmin = async () => {
    await loadAulas();
    await loadInscricoes();
  };

  // Polling para atualizar dados do admin a cada 10 segundos
  useEffect(() => {
    if (currentUser?.isAdmin && currentPage === 'dashboard') {
      const interval = setInterval(() => {
        loadDadosAdmin();
      }, 10000); // 10 segundos

      return () => clearInterval(interval);
    }
  }, [currentUser, currentPage]);

  // Restaurar usuário do localStorage ao carregar a página
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setCurrentPage('dashboard');
        if (user.isAdmin) {
          loadDadosAdmin();
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userName: string) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setCurrentPage('dashboard');
        if (user.isAdmin) {
          loadDadosAdmin();
        }
        return;
      } catch (error) {
        console.error('Erro ao recuperar usuário do localStorage:', error);
      }
    }
    // Fallback se algo der errado
    setCurrentUser({ id: `user_${Date.now()}`, nome: userName, email: '' });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentPage('login');
    setAulas([]);
    setInscricoes([]);
  };

  const handleCreateAula = async (aula: Omit<Aula, 'id' | 'criadaEm' | 'atualizadaEm' | 'profesor_id' | 'professorId' | 'professor' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.criarAula(aula);
      if (response.dados) {
        toast.success('Aula criada com sucesso!');
        await loadDadosAdmin();
      }
    } catch (error: any) {
      const mensagemErro = error.response?.data?.mensagem || error.message || 'Erro ao criar aula';
      toast.error(`Erro: ${mensagemErro}`);
    }
  };

  const handleUpdateAula = async (id: string, aula: Partial<Aula>) => {
    try {
      const response = await api.atualizarAula(id, aula);
      if (response.dados) {
        toast.success('Aula atualizada com sucesso!');
        // Recarregar as aulas e inscrições para garantir sincronização
        await loadDadosAdmin();
      }
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      toast.error('Erro ao atualizar aula');
    }
  };

  const handleDeleteAula = async (id: string) => {
    try {
      await api.deletarAula(id);
      // Recarregar as aulas e inscrições para garantir sincronização
      await loadDadosAdmin();
      toast.success('Aula deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar aula:', error);
      toast.error('Erro ao deletar aula');
    }
  };

  const handleRegister = (userData: {
    nome: string;
    email: string;
    telefone: string;
    senha: string;
  }) => {
    // Recuperar o usuário do localStorage que foi salvo no RegisterPage
    const userDataStored = localStorage.getItem('user');
    if (userDataStored) {
      try {
        const user = JSON.parse(userDataStored);
        setCurrentUser(user);
        toast.success('Conta criada com sucesso!');
        setCurrentPage('dashboard');
        // Carregar aulas e inscrições se for admin
        if (user.isAdmin) {
          loadDadosAdmin();
        }
        return;
      } catch (error) {
        console.error('Erro ao recuperar usuário do localStorage:', error);
      }
    }
    // Fallback se algo der errado
    const newUser = {
      id: `user_${Date.now()}`,
      nome: userData.nome,
      email: userData.email,
    };
    setCurrentUser(newUser);
    toast.success('Conta criada com sucesso!');
    setCurrentPage('dashboard');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <>
      {currentPage === 'login' ? (
        <LoginPage 
          onLogin={handleLogin}
          onGoToRegister={() => setCurrentPage('register')}
        />
      ) : currentPage === 'register' ? (
        <RegisterPage 
          onRegister={handleRegister}
          onBackToLogin={() => setCurrentPage('login')}
        />
      ) : currentPage === 'esqueci-senha' ? (
        <EsqueciSenha 
          onBackToLogin={() => setCurrentPage('login')}
        />
      ) : currentPage === 'recuperar-senha' ? (
        <RecuperarSenha 
          token={recuperacaoToken}
          onBackToLogin={() => setCurrentPage('login')}
          onSucessoRecuperacao={() => {
            setCurrentPage('login');
            setRecuperacaoToken('');
          }}
        />
      ) : currentUser ? (
        currentUser.isAdmin ? (
          <ProfessorDashboard
            professorNome={currentUser.nome}
            onLogout={handleLogout}
            aulas={aulas}
            inscricoes={inscricoes}
            onCreateAula={handleCreateAula}
            onUpdateAula={handleUpdateAula}
            onDeleteAula={handleDeleteAula}
            onRefresh={loadDadosAdmin}
          />
        ) : (
          <AlunoDashboard
            alunoId={currentUser.id}
            alunoNome={currentUser.nome}
            isAdmin={currentUser.isAdmin || false}
            onLogout={handleLogout}
          />
        )
      ) : null}
      <Toaster />
    </>
  );
}