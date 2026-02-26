import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface EsqueciSenhaProps {
  onBackToLogin: () => void;
}

export function EsqueciSenha({ onBackToLogin }: EsqueciSenhaProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Digite seu email');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Digite um email válido');
      return;
    }

    setLoading(true);
    try {
      const response = await api.solicitarRecuperacaoSenha(email);
      
      if (response.sucesso) {
        setEmailEnviado(true);
        toast.success('Link de recuperação enviado! Verifique seu email.');
      } else {
        toast.error(response.mensagem || 'Erro ao solicitar recuperação');
      }
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação:', error);
      const errorMessage = error.response?.data?.mensagem || 'Erro ao solicitar recuperação. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            
            <h2 className="text-white text-3xl font-bold mb-3">Recuperar Senha</h2>
            <p className="text-white/90 text-base">
              {emailEnviado 
                ? 'Verifique seu email e siga as instruções para redefinir sua senha.'
                : 'Digite seu email para receber um link de recuperação de senha.'
              }
            </p>
          </div>

          {!emailEnviado ? (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-white/90 text-sm mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu email cadastrado"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 pr-10"
                      autoFocus
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full font-semibold text-base disabled:opacity-50"
                  style={{ backgroundColor: '#FFD966', color: '#0D5A6E' }}
                >
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-[#0D3D4C] rounded-xl p-4 text-white/90 text-sm">
                <p className="mb-2">✅ Email enviado com sucesso!</p>
                <p className="mb-2">Verifique sua caixa de entrada e também a pasta de spam.</p>
                <p>O link é válido por <strong>1 hora</strong>.</p>
              </div>

              {/* Resend Button */}
              <Button
                type="button"
                onClick={() => {
                  setEmailEnviado(false);
                  setEmail('');
                }}
                className="w-full h-12 rounded-full font-semibold text-base"
                style={{ backgroundColor: '#FFD966', color: '#0D5A6E' }}
              >
                Enviar Novamente
              </Button>
            </div>
          )}

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
