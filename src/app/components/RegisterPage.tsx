import { useState } from 'react';
import { Eye, EyeOff, Mail, User, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const validarFormulario = () => {
    // Validações
    if (!formData.nome || !formData.email || !formData.telefone || !formData.senha) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Digite um email válido');
      return false;
    }

    // Validação de telefone (básica)
    const telefoneRegex = /^\d{10,11}$/;
    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    if (!telefoneRegex.test(telefoneLimpo)) {
      toast.error('Digite um telefone válido (10 ou 11 dígitos)');
      return false;
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    // Mostrar popup de confirmação
    setMostrarConfirmacao(true);
  };

  const confirmarRegistro = async () => {
    setMostrarConfirmacao(false);
    const telefoneLimpo = formData.telefone.replace(/\D/g, '');

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
    <div className="min-h-screen py-6 sm:py-8 px-3 sm:px-4" style={{ backgroundColor: '#0D5A6E' }}>
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[#124C5E] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl">
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
            <button 
              type="button"
              onClick={() => setMostrarTermos(true)}
              className="text-[#FFD966] hover:underline font-medium"
            >
              Termos de Uso
            </button>
            {' '}e{' '}
            <button 
              type="button"
              onClick={() => setMostrarPrivacidade(true)}
              className="text-[#FFD966] hover:underline font-medium"
            >
              Política de Privacidade
            </button>
          </p>
        </div>
      </div>

      {/* Dialog de Termos de Uso */}
      <Dialog open={mostrarTermos} onOpenChange={setMostrarTermos}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: '#0D5A6E' }}>
              Termos de Uso e Condições Gerais
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4 py-4">
            <p className="text-xs text-gray-500">Última atualização: 27 de fevereiro de 2026 | Foro: Comarca de Triunfo/RS</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>1. ACEITE E VALIDADE JURÍDICA</h3>
            <p className="text-sm">Ao criar uma conta, acessar ou utilizar qualquer funcionalidade da plataforma Leo Campos FTV, o usuário declara, para todos os fins de direito, que:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Leu integralmente estes Termos;</li>
              <li>Compreendeu todas as cláusulas;</li>
              <li>Concorda de forma livre, informada e inequívoca;</li>
              <li>Possui capacidade civil plena para contratar.</li>
            </ul>
            <p className="text-sm">O aceite eletrônico possui validade jurídica, nos termos do art. 107 do Código Civil e da legislação aplicável.</p>
            <p className="text-sm"><strong>Caso não concorde, o usuário deverá cessar imediatamente o uso da plataforma.</strong></p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>2. RESPONSABILIDADE INTEGRAL DO USUÁRIO</h3>
            <p className="text-sm">O usuário assume responsabilidade exclusiva e integral por:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Veracidade das informações fornecidas;</li>
              <li>Atualização de seus dados cadastrais;</li>
              <li>Segurança de login e senha;</li>
              <li>Todas as atividades realizadas sob sua conta;</li>
              <li>Uso adequado da plataforma.</li>
            </ul>
            <p className="text-sm">A Leo Campos FTV não se responsabiliza por danos decorrentes de:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Uso indevido da conta;</li>
              <li>Compartilhamento de senha;</li>
              <li>Acesso por terceiros;</li>
              <li>Negligência do próprio usuário.</li>
            </ul>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>3. INDENIZAÇÃO E RESPONSABILIDADE CIVIL</h3>
            <p className="text-sm">O usuário concorda em indenizar, defender e isentar a Leo Campos FTV, seus administradores, parceiros e colaboradores de quaisquer:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Reclamações judiciais ou extrajudiciais;</li>
              <li>Danos diretos ou indiretos;</li>
              <li>Multas, penalidades ou prejuízos;</li>
              <li>Honorários advocatícios;</li>
              <li>Custas processuais;</li>
            </ul>
            <p className="text-sm">decorrentes de: uso indevido da plataforma; violação destes Termos; fornecimento de dados falsos; condutas ilícitas ou fraudulentas.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>4. LIMITAÇÃO MÁXIMA DE RESPONSABILIDADE</h3>
            <p className="text-sm">A responsabilidade da Leo Campos FTV, quando aplicável, ficará limitada ao valor efetivamente pago pelo usuário nos últimos 12 (doze) meses.</p>
            <p className="text-sm">A plataforma não se responsabiliza por:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Lucros cessantes;</li>
              <li>Danos indiretos;</li>
              <li>Perda de oportunidade;</li>
              <li>Danos morais decorrentes de mau uso;</li>
              <li>Falhas de internet ou servidores externos;</li>
              <li>Ataques cibernéticos fora de seu controle razoável.</li>
            </ul>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>5. CONDUTA PROIBIDA</h3>
            <p className="text-sm">É expressamente proibido:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Utilizar a plataforma para fins ilícitos;</li>
              <li>Inserir dados falsos ou de terceiros sem autorização;</li>
              <li>Tentar invadir, hackear ou explorar vulnerabilidades;</li>
              <li>Realizar engenharia reversa do sistema;</li>
              <li>Copiar layout, código ou estrutura;</li>
              <li>Utilizar bots ou automações não autorizadas.</li>
            </ul>
            <p className="text-sm">O descumprimento poderá resultar em: bloqueio imediato; exclusão definitiva da conta; adoção de medidas judiciais.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>6. PAGAMENTOS E OBRIGAÇÕES FINANCEIRAS</h3>
            <p className="text-sm">Ao contratar qualquer serviço pago, o usuário:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Reconhece a obrigação de pagamento integral;</li>
              <li>Concorda com as condições informadas no momento da contratação;</li>
              <li>Autoriza a cobrança por intermediadores financeiros.</li>
            </ul>
            <p className="text-sm">A inadimplência poderá resultar em: suspensão automática; cancelamento da conta; inclusão em medidas de cobrança legais.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>7. USUÁRIOS MENORES DE IDADE</h3>
            <p className="text-sm">Caso o usuário seja menor de 18 anos, o cadastro deverá ser realizado por seu responsável legal.</p>
            <p className="text-sm">O responsável assume responsabilidade integral por: informações fornecidas; conduta do menor; obrigações financeiras.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>8. PROPRIEDADE INTELECTUAL</h3>
            <p className="text-sm">Todo o sistema, incluindo: marca Leo Campos FTV; logotipo; código-fonte; layout; estrutura; banco de dados; é protegido por legislação nacional e internacional de propriedade intelectual.</p>
            <p className="text-sm"><strong>É vedada qualquer reprodução sem autorização formal e expressa.</strong></p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>9. FORÇA MAIOR</h3>
            <p className="text-sm">A Leo Campos FTV não será responsabilizada por falhas decorrentes de: caso fortuito; força maior; falhas de energia; instabilidades de rede; ataques externos; atos governamentais.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>10. CANCELAMENTO</h3>
            <p className="text-sm">A Leo Campos FTV poderá suspender ou cancelar contas a qualquer momento em caso de: violação destes Termos; suspeita de fraude; risco à segurança da plataforma; inadimplência.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>11. PRIVACIDADE E DADOS</h3>
            <p className="text-sm">O tratamento de dados pessoais seguirá a Política de Privacidade da Leo Campos FTV, em conformidade com a LGPD.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>12. ALTERAÇÕES</h3>
            <p className="text-sm">A Leo Campos FTV poderá alterar estes Termos a qualquer momento, sendo responsabilidade do usuário revisá-los periodicamente.</p>
            <p className="text-sm">O uso contínuo da plataforma após atualização implica concordância automática com a nova versão.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>13. FORO</h3>
            <p className="text-sm"><strong>Fica eleito o foro da Comarca de Triunfo/RS, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</strong></p>
          </div>
          <Button onClick={() => setMostrarTermos(false)} className="w-full" style={{ backgroundColor: '#0D5A6E' }}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog de Política de Privacidade */}
      <Dialog open={mostrarPrivacidade} onOpenChange={setMostrarPrivacidade}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: '#0D5A6E' }}>
              Política de Privacidade
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4 py-4">
            <p className="text-xs text-gray-500">Última atualização: 27 de fevereiro de 2026</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>1. INTRODUÇÃO</h3>
            <p className="text-sm">A presente Política de Privacidade tem como objetivo demonstrar o compromisso da plataforma Leo Campos FTV com a proteção dos dados pessoais de seus usuários, clientes, parceiros e demais titulares, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD) e demais normas aplicáveis.</p>
            <p className="text-sm">Ao utilizar a plataforma Leo Campos FTV, o usuário declara que leu, compreendeu e concorda com as disposições desta Política.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>2. IDENTIFICAÇÃO DO CONTROLADOR</h3>
            <p className="text-sm">O controlador dos dados pessoais tratados no âmbito da plataforma é:</p>
            <p className="text-sm"><strong>Leo Campos FTV</strong><br/>Sede: Triunfo, Estado do Rio Grande do Sul – Brasil</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>3. DADOS PESSOAIS COLETADOS</h3>
            <p className="text-sm font-semibold">3.1 Dados fornecidos diretamente pelo usuário:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Nome completo</li>
              <li>CPF ou documento de identificação</li>
              <li>E-mail</li>
              <li>Telefone</li>
              <li>Endereço completo</li>
              <li>CEP</li>
              <li>Informações relacionadas à matrícula, participação em aulas ou eventos</li>
              <li>Dados de pagamento, quando aplicável</li>
            </ul>
            <p className="text-sm font-semibold mt-2">3.2 Dados coletados automaticamente:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Endereço IP</li>
              <li>Dados de geolocalização aproximada</li>
              <li>Informações do navegador e dispositivo</li>
              <li>Cookies e identificadores eletrônicos</li>
              <li>Histórico de acesso e uso da plataforma</li>
            </ul>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>4. FINALIDADE DO TRATAMENTO</h3>
            <p className="text-sm">Os dados pessoais são tratados para:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Realizar cadastro e autenticação</li>
              <li>Gerenciar aulas, treinos, eventos e atividades</li>
              <li>Processar pagamentos e cobranças</li>
              <li>Enviar comunicações administrativas</li>
              <li>Cumprir obrigações legais e fiscais</li>
              <li>Prevenir fraudes e garantir segurança da informação</li>
              <li>Melhorar a experiência do usuário</li>
            </ul>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>5. BASE LEGAL (LGPD)</h3>
            <p className="text-sm">O tratamento ocorre com fundamento em:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Execução de contrato</li>
              <li>Cumprimento de obrigação legal</li>
              <li>Legítimo interesse</li>
              <li>Exercício regular de direitos</li>
              <li>Consentimento do titular, quando necessário</li>
            </ul>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>6. COMPARTILHAMENTO DE DADOS</h3>
            <p className="text-sm">Os dados poderão ser compartilhados com:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Instituições financeiras e intermediadores de pagamento</li>
              <li>Prestadores de serviço de tecnologia</li>
              <li>Contabilidade e assessoria jurídica</li>
              <li>Autoridades públicas, quando exigido por lei</li>
            </ul>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>7. SEGURANÇA E ARMAZENAMENTO</h3>
            <p className="text-sm">A Leo Campos FTV adota medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados, vazamentos, perda ou destruição.</p>
            <p className="text-sm">Os dados serão mantidos pelo período necessário ao cumprimento das finalidades previstas ou conforme exigido por lei.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>8. DIREITOS DO TITULAR</h3>
            <p className="text-sm">Nos termos do artigo 18 da LGPD, o titular poderá:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Confirmar a existência de tratamento</li>
              <li>Acessar seus dados</li>
              <li>Corrigir informações</li>
              <li>Solicitar exclusão ou anonimização</li>
              <li>Revogar consentimento</li>
            </ul>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>9. ALTERAÇÕES</h3>
            <p className="text-sm">Esta Política poderá ser atualizada a qualquer momento, sendo publicada a versão vigente na plataforma.</p>
            
            <h3 className="font-bold text-base" style={{ color: '#0D5A6E' }}>10. FORO</h3>
            <p className="text-sm">Fica eleito o foro da Comarca de Triunfo/RS, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
          </div>
          <Button onClick={() => setMostrarPrivacidade(false)} className="w-full" style={{ backgroundColor: '#0D5A6E' }}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Termos */}
      <Dialog open={mostrarConfirmacao} onOpenChange={setMostrarConfirmacao}>
        <DialogContent className="max-w-sm bg-[#124C5E] border-none rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl text-center">Confirmação</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            <p className="text-white/90 text-sm leading-relaxed">
              Ao clicar em confirmar, você declara que leu e aceita os{' '}
              <button 
                type="button"
                onClick={() => {
                  setMostrarConfirmacao(false);
                  setMostrarTermos(true);
                }}
                className="text-[#FFD966] hover:underline font-medium"
              >
                Termos de Uso
              </button>
              {' '}e a{' '}
              <button 
                type="button"
                onClick={() => {
                  setMostrarConfirmacao(false);
                  setMostrarPrivacidade(true);
                }}
                className="text-[#FFD966] hover:underline font-medium"
              >
                Política de Privacidade
              </button>
              .
            </p>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setMostrarConfirmacao(false)}
                className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmarRegistro}
                className="flex-1"
                style={{ backgroundColor: '#FFD966', color: '#0D5A6E' }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
