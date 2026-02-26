import { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface RecuperarSenhaProps {
  token: string;
  onBackToLogin: () => void;
  onSucessoRecuperacao: () => void;
}

export function RecuperarSenha({ token, onBackToLogin, onSucessoRecuperacao }: RecuperarSenhaProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValido, setTokenValido] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      toast.error('Token inválido ou expirado');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (novaSenha.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const response = await api.resetarSenha(token, novaSenha, confirmarSenha);
      
      if (response.sucesso) {
        toast.success('Senha alterada com sucesso! Faça login com sua nova senha.');
        setTimeout(() => {
          onSucessoRecuperacao();
        }, 2000);
      } else {
        toast.error(response.mensagem || 'Erro ao resetar senha');
      }
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      const errorMessage = error.response?.data?.mensagem || error.response?.data?.erro || 'Erro ao resetar senha. Tente novamente.';
      toast.error(errorMessage);
      
      // Se token expirou, marcar como inválido
      if (errorMessage.includes('expirado') || errorMessage.includes('inválido')) {
        setTokenValido(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValido) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0D5A6E' }}>
        <div className="w-full max-w-md">
          <div className="bg-[#124C5E] rounded-3xl p-8 shadow-2xl">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <img 
                src="/images/logo leo.jpg" 
                alt="Leo Campos Futevôlei" 
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-white text-2xl font-semibold mb-2">Leo Campos</h1>
              <p className="text-white/80 text-sm mb-6">Futevôlei</p>
              
              <h2 className="text-white text-3xl font-bold mb-3">⚠️ Link Inválido</h2>
              <p className="text-white/90 text-base">
                O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.
              </p>
            </div>

            {/* Message */}
            <div className="bg-[#0D3D4C] rounded-xl p-4 text-white/90 text-sm mb-6">
              <p className="mb-2">Os links de recuperação são válidos por <strong>1 hora</strong>.</p>
              <p>Solicite um novo link para redefinir sua senha.</p>
            </div>

            {/* Back to Login */}
            <Button
              type="button"
              onClick={onBackToLogin}
              className="w-full h-12 rounded-full font-semibold text-base"
              style={{ backgroundColor: '#FFD966', color: '#0D5A6E' }}
            >
              Voltar para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0D5A6E' }}>
      <div className="w-full max-w-md">
        <div className="bg-[#124C5E] rounded-3xl p-8 shadow-2xl">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <img 
              src="/images/logo leo.jpg" 
              alt="Leo Campos Futevôlei" 
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-white text-2xl font-semibold mb-2">Leo Campos</h1>
            <p className="text-white/80 text-sm mb-6">Futevôlei</p>
            
            <h2 className="text-white text-3xl font-bold mb-3">Nova Senha</h2>
            <p className="text-white/90 text-base">
              Digite sua nova senha abaixo.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nova Senha */}
            <div>
              <Label htmlFor="novaSenha" className="text-white/90 text-sm mb-2 block">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showNovaSenha ? 'text' : 'password'}
                  placeholder="Digite sua nova senha (mínimo 6 caracteres)"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showNovaSenha ? (
                    <EyeOff className="w-5 h-5 text-white/50" />
                  ) : (
                    <Eye className="w-5 h-5 text-white/50" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <Label htmlFor="confirmarSenha" className="text-white/90 text-sm mb-2 block">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmarSenha ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmarSenha ? (
                    <EyeOff className="w-5 h-5 text-white/50" />
                  ) : (
                    <Eye className="w-5 h-5 text-white/50" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength Hint */}
            <div className="bg-[#0D3D4C] rounded-xl p-3 text-white/80 text-xs">
              <p>💡 Dica: Use uma senha forte com pelo menos 6 caracteres</p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full font-semibold text-base disabled:opacity-50"
              style={{ backgroundColor: '#FFD966', color: '#0D5A6E' }}
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-white text-base font-medium hover:underline"
              onClick={onBackToLogin}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
