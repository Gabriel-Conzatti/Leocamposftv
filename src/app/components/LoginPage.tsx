import { useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (userName: string) => void;
  onGoToRegister: () => void;
}

export function LoginPage({ onLogin, onGoToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha email e senha');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(email, password);
      console.log('Login response:', response);
      
      if (response.sucesso) {
        const userData = (response.dados as any)?.usuario;
        const token = (response.dados as any)?.token;
        const userName = userData?.nome || email.split('@')[0] || 'Usuário';
        
        console.log('User data from API:', userData);
        
        // Salvar no localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        console.log('Saved to localStorage:', userData);
        
        toast.success('Login realizado com sucesso!');
        onLogin(userName);
      } else {
        const errorMsg = response.mensagem || 'Email ou senha inválidos';
        console.log('Login error response:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Login catch error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.mensagem || error.message || 'Email ou senha inválidos';
      console.log('Final error message:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-b" style={{ backgroundColor: '#0D5A6E' }}>
      <div className="w-full max-w-md">
        <div className="bg-[#124C5E] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <img 
              src="/images/logo leo.jpg" 
              alt="Leo Campos Futevôlei" 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-white text-xl sm:text-2xl font-semibold mb-1 sm:mb-2">Leo Campos</h1>
            <p className="text-white/80 text-xs sm:text-sm mb-3 sm:mb-6">Futevôlei</p>
            
            <h2 className="text-white text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Bem-vindo(a)</h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              Agende suas aulas de futevôlei<br />em segundos.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email/WhatsApp */}
            <div>
              <Label htmlFor="email" className="text-white/90 text-xs sm:text-sm mb-2 block">
                Email / WhatsApp
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="text"
                  placeholder="Digite seu email ou telefone"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 sm:h-14 px-4 pr-10 text-sm sm:text-base"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
              </div>
            </div>

            {/* Senha */}
            <div>
              <Label htmlFor="password" className="text-white/90 text-xs sm:text-sm mb-2 block">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 sm:h-14 px-4 pr-10 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
                  )}
                </button>
              </div>
              
              {/* Forgot Password */}
              <div className="text-right mt-2">
                <button
                  type="button"
                  className="text-[#FFD966] text-xs sm:text-sm hover:underline"
                  onClick={() => window.location.href = '?page=esqueci-senha'}
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 sm:h-14 rounded-full font-semibold text-sm sm:text-base disabled:opacity-50"
              style={{ backgroundColor: '#FFD966', color: '#0D5A6E' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Create Account */}
          <div className="text-center mt-4 sm:mt-6">
            <span className="text-white/70 text-xs sm:text-sm">Novo por aqui?</span>
            <div className="mt-2">
              <button
                type="button"
                className="text-white text-sm sm:text-base font-medium hover:underline"
                onClick={onGoToRegister}
              >
                Criar conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}