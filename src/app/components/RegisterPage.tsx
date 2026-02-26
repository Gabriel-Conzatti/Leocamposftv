import { useState } from 'react';
import { Eye, EyeOff, Mail, User, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface RegisterPageProps {
  onRegister: (userData: {
    nome: string;
    email: string;
    telefone: string;
    senha: string;
  }) => void;
  onBackToLogin: () => void;
}

export function RegisterPage({ onRegister, onBackToLogin }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.nome || !formData.email || !formData.telefone || !formData.senha) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Digite um email válido');
      return;
    }

    // Validação de telefone (básica)
    const telefoneRegex = /^\d{10,11}$/;
    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    if (!telefoneRegex.test(telefoneLimpo)) {
      toast.error('Digite um telefone válido (10 ou 11 dígitos)');
      return;
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const response = await api.register(
        formData.nome,
        formData.email,
        telefoneLimpo,
        formData.senha,
        formData.confirmarSenha
      );

      if (response.sucesso) {
        const userData = (response.dados as any)?.usuario;
        const token = (response.dados as any)?.token;
        
        // Salvar no localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        toast.success('Usuário registrado com sucesso!');
        onRegister(formData);
      } else {
        toast.error(response.mensagem || 'Erro ao registrar');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.mensagem || error.message || 'Erro ao registrar';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTelefone = (value: string) => {
    const numero = value.replace(/\D/g, '');
    if (numero.length <= 10) {
      return numero.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-b" style={{ backgroundColor: '#0D5A6E' }}>
      <div className="w-full max-w-md">
        <div className="bg-[#124C5E] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Back Button */}
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 sm:mb-6 transition-colors text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para login</span>
          </button>

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
            
            <h2 className="text-white text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Criar Conta</h2>
            <p className="text-white/90 text-sm sm:text-base">
              Preencha seus dados para começar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
            {/* Nome Completo */}
            <div>
              <Label htmlFor="nome" className="text-white/90 text-xs sm:text-sm mb-2 block">
                Nome Completo *
              </Label>
              <div className="relative">
                <Input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 sm:h-14 px-4 pr-10 text-sm sm:text-base"
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-white/90 text-xs sm:text-sm mb-2 block">
                Email *
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 sm:h-14 px-4 pr-10 text-sm sm:text-base"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
              </div>
            </div>

            {/* Telefone/WhatsApp */}
            <div>
              <Label htmlFor="telefone" className="text-white/90 text-xs sm:text-sm mb-2 block">
                WhatsApp *
              </Label>
              <div className="relative">
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => {
                    const formatted = formatTelefone(e.target.value);
                    setFormData({ ...formData, telefone: formatted });
                  }}
                  maxLength={15}
                  className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 sm:h-14 px-4 pr-10 text-sm sm:text-base"
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
              </div>
            </div>

            {/* Senha */}
            <div>
              <Label htmlFor="senha" className="text-white/90 text-xs sm:text-sm mb-2 block">
                Senha *
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
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
            </div>

            {/* Confirmar Senha */}
            <div>
              <Label htmlFor="confirmarSenha" className="text-white/90 text-xs sm:text-sm mb-2 block">
                Confirmar Senha *
              </Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  className="w-full bg-[#0D3D4C] border-none text-white placeholder:text-white/50 rounded-xl h-12 sm:h-14 px-4 pr-10 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 sm:h-14 rounded-full font-semibold text-sm sm:text-base mt-4 sm:mt-6 disabled:opacity-50"
              style={{ backgroundColor: '#FFD966', color: '#0D5A6E' }}
            >
              {loading ? 'Registrando...' : 'Criar Conta'}
            </Button>
          </form>

          {/* Termos */}
          <p className="text-white/60 text-xs text-center mt-4 sm:mt-6 leading-relaxed px-2">
            Ao criar uma conta, você concorda com nossos{' '}
            <button className="text-[#FFD966] hover:underline font-medium">
              Termos de Uso
            </button>
            {' '}e{' '}
            <button className="text-[#FFD966] hover:underline font-medium">
              Política de Privacidade
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
