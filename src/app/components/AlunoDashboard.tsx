import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, DollarSign, LogOut, ExternalLink, Check, User, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { api } from '@/services/api';
import { useAulas, useInscricoes } from '@/hooks/useAPI';
import type { Aula, Inscricao } from '@/types';
import { EditProfileDialog } from './EditProfileDialog';
import { formatDate, formatCurrency, getStatusLabel } from '@/utils/helpers';

interface AlunoDashboardProps {
  alunoId: string;
  alunoNome: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

export function AlunoDashboard({
  alunoId,
  alunoNome,
  isAdmin,
  onLogout,
}: AlunoDashboardProps) {
  const { aulas, loading: loadingAulas } = useAulas();
  const { inscricoes, loading: loadingInscricoes, recarregar: recarregarInscricoes } = useInscricoes();
  const [inscricaoParaPagar, setInscricaoParaPagar] = useState<Inscricao | null>(null);
  const [mercadoPagoData, setMercadoPagoData] = useState<any>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [inscrevendoAulaId, setInscrevendoAulaId] = useState<string | null>(null);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false);

  const minhasInscricoes = inscricoes.filter(i => i.aluno_id === alunoId);

  // Recarregar inscrições a cada 5 segundos enquanto houver pagamento pendente
  useEffect(() => {
    if (!inscricaoParaPagar) return;
    
    const verificarPagamento = async () => {
      if (mercadoPagoData?.inscricaoId) {
        try {
          const response = await api.verificarStatusPagamento(mercadoPagoData.inscricaoId);
          if (response.sucesso && response.dados?.confirmado) {
            toast.success('Pagamento confirmado! Você está inscrito na aula.');
            setInscricaoParaPagar(null);
            setMercadoPagoData(null);
            setQrCodeImage('');
            recarregarInscricoes();
            return;
          }
        } catch (error) {
          // silencioso - tentar novamente no próximo ciclo
        }
      }
      recarregarInscricoes();
    };
    
    const interval = setInterval(verificarPagamento, 5000); // Verificar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [inscricaoParaPagar, mercadoPagoData, recarregarInscricoes]);

  // Fechar modal e limpar dados quando a inscrição for confirmada
  useEffect(() => {
    if (inscricaoParaPagar && minhasInscricoes.some(i => i.aula_id === inscricaoParaPagar.aula_id && i.status === 'confirmada')) {
      toast.success('Pagamento confirmado! Você está inscrito na aula.');
      setInscricaoParaPagar(null);
      setMercadoPagoData(null);
      setQrCodeImage('');
    }
  }, [minhasInscricoes, inscricaoParaPagar]);

  const getInscricoesAula = (aulaId: string) => {
    return inscricoes.filter(i => i.aula_id === aulaId && i.status === 'confirmada');
  };

  const jaInscrito = (aulaId: string) => {
    return minhasInscricoes.some(i => i.aula_id === aulaId && i.status === 'confirmada');
  };

  const getMinhaInscricao = (aulaId: string) => {
    return minhasInscricoes.find(i => i.aula_id === aulaId && i.status !== 'cancelado');
  };

  const handleInscrever = async (aulaId: string) => {
    // Gerar preferência no Mercado Pago
    const aula = aulas.find(a => a.id === aulaId);
    if (!aula) {
      toast.error('Aula não encontrada');
      return;
    }

    setInscrevendoAulaId(aulaId);
    setLoadingPagamento(true);
    try {
      const response = await api.criarPreferencaMercadoPago(aulaId);

      if (response.sucesso && response.dados) {
        setMercadoPagoData(response.dados);
        
        // Se tem QR Code PIX real (base64), usar ele
        if (response.dados.qrCodeBase64) {
          setQrCodeImage(`data:image/png;base64,${response.dados.qrCodeBase64}`);
        }
        // Senão, gerar QR Code a partir da URL de checkout
        else if (response.dados.init_point) {
          try {
            const qrImage = await QRCode.toDataURL(response.dados.init_point, {
              errorCorrectionLevel: 'H',
              type: 'image/png',
              quality: 0.95,
              margin: 1,
              width: 220,
              color: {
                dark: '#000000',
                light: '#FFFFFF',
              },
            });
            setQrCodeImage(qrImage);
          } catch (qrError) {
            setQrCodeImage('');
          }
        }

        setInscricaoParaPagar({
          id: `temp_${Date.now()}`,
          aluno_id: alunoId,
          aula_id: aulaId,
          alunoNome: alunoNome,
          statusPagamento: 'pendente',
          valorPago: aula.preco,
          inscritoEm: new Date().toISOString(),
        });
      } else {
        toast.error('Erro ao gerar preferência de pagamento');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoadingPagamento(false);
      setInscrevendoAulaId(null);
    }
  };

  const handleSimularPagamento = async () => {
    if (!inscricaoParaPagar || !mercadoPagoData?.pagamentoId) {
      toast.error('Erro: ID do pagamento não encontrado');
      return;
    }
    
    try {
      const response = await api.simularPagamento(mercadoPagoData.pagamentoId, 'approved');

      if (response.sucesso) {
        toast.success('Pagamento aprovado! Verificando inscrição...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        recarregarInscricoes();
      }
    } catch (error: any) {
      toast.error('Erro ao simular pagamento: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta': return 'bg-green-500';
      case 'cheia': return 'bg-yellow-500';
      case 'cancelada': return 'bg-red-500';
      case 'realizada': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };


  const getPagamentoStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-green-500';
      case 'pendente': return 'bg-yellow-500';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPagamentoStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado': return 'Confirmado';
      case 'pendente': return 'Aguardando Pagamento';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
  const hora = new Date().toLocaleTimeString('en-CA', { timeZone: 'America/Sao_Paulo', hour12: false, hour: '2-digit', minute: '2-digit' }); // HH:mm
  const agora = `${hoje}T${hora}`; // YYYY-MM-DDTHH:mm para comparação

  const aulasDisponiveis = aulas
    .filter(a => {
      const aula = `${a.data}T${a.horario}`;
      return a.status === 'aberta' && a.vagasDisponiveis > 0 && aula > agora;
    })
    .sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);
      return dateA.getTime() - dateB.getTime();
    });

  // Inscrições em aulas futuras
  const minhasInscricoesAtuais = minhasInscricoes
    .filter(inscricao => {
      const aula = aulas.find(a => a.id === inscricao.aula_id);
      if (!aula) return false;
      return `${aula.data}T${aula.horario}` > agora;
    });

  // Inscrições pendentes em aulas já passadas (para desabilitar pagamento)
  const inscricoesPendentesAulasPassadas = minhasInscricoes
    .filter(inscricao => {
      const aula = aulas.find(a => a.id === inscricao.aula_id);
      if (!aula) return false;
      return inscricao.status === 'pendente' && `${aula.data}T${aula.horario}` <= agora;
    });

  const historicoAulas = minhasInscricoes
    .filter(inscricao => {
      const aula = aulas.find(a => a.id === inscricao.aula_id);
      if (!aula) return false;
      return aula.data < hoje;
    })
    .map(inscricao => aulas.find(a => a.id === inscricao.aula_id))
    .filter(a => a !== undefined)
    .sort((a, b) => {
      const dateA = new Date(a!.data);
      const dateB = new Date(b!.data);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/images/logo leo.jpg" 
                alt="Leo Campos Futevôlei" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate" style={{ color: '#0D5A6E' }}>Leo Campos</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Olá, {alunoNome}!</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" onClick={() => setMostrarModalPerfil(true)} className="h-10 px-3 text-xs sm:text-sm">
                <User className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </Button>
              <Button variant="ghost" onClick={onLogout} className="h-10 px-3 text-xs sm:text-sm">
                <LogOut className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="disponiveis" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="disponiveis" className="text-xs sm:text-sm py-2 px-1 sm:px-4">
              <span className="hidden sm:inline">Aulas Disponíveis</span>
              <span className="sm:hidden">Disponíveis</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs sm:text-sm py-2 px-1 sm:px-4">
              <span className="hidden sm:inline">Histórico</span>
              <span className="sm:hidden">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Aulas Disponíveis */}
          <TabsContent value="disponiveis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aulas Disponíveis</CardTitle>
                <CardDescription>
                  Confira as aulas abertas e reserve sua vaga
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {aulasDisponiveis.length === 0 ? (
                    <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
                      <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                      <p className="text-sm sm:text-base">Nenhuma aula disponível no momento</p>
                    </div>
                  ) : (
                    aulasDisponiveis.map((aula) => {
                      const inscricoesAula = getInscricoesAula(aula.id);
                      const inscrito = jaInscrito(aula.id);
                      const minhaInsc = getMinhaInscricao(aula.id);

                      return (
                        <Card key={aula.id} className="border-2 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{aula.titulo}</h3>
                                  <p className="text-sm text-gray-500">{formatDate(aula.data)}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">{aula.horario}</span>
                                  </div>
                                </div>
                                <Badge className={
                                  minhaInsc && minhaInsc.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  minhaInsc && minhaInsc.status === 'confirmada' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  getStatusColor(aula.status)
                                }>
                                  {minhaInsc && minhaInsc.status === 'pendente' ? 'Aguardando pagamento' :
                                   minhaInsc && minhaInsc.status === 'confirmada' ? 'Inscrito' :
                                   getStatusLabel(aula.status)}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">{aula.local}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">{aula.vagasDisponiveis} de {aula.vagas} vagas</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-green-600">
                                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span>{formatCurrency(aula.preco)}</span>
                                </div>
                              </div>

                              <div className="pt-2 sm:pt-3 space-y-2">
                                {!isAdmin && (
                                  <>
                                    {minhaInsc ? (
                                      minhaInsc.status === 'pendente' ? (
                                        <Button
                                          className="w-full h-10 sm:h-12 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                                          onClick={() => handleInscrever(aula.id)}
                                          disabled={inscrevendoAulaId === aula.id}
                                        >
                                          {inscrevendoAulaId === aula.id ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                              Carregando...
                                            </>
                                          ) : (
                                            <>
                                              <DollarSign className="w-4 h-4 mr-2" />
                                              Realizar pagamento
                                            </>
                                          )}
                                        </Button>
                                      ) : (
                                        <div className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-green-50 rounded-lg text-xs sm:text-sm">
                                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                                          <span className="font-medium text-green-700">Inscrito</span>
                                        </div>
                                      )
                                    ) : (
                                      <Button
                                        className="w-full h-10 sm:h-12 text-xs sm:text-sm"
                                        onClick={() => handleInscrever(aula.id)}
                                        disabled={inscrevendoAulaId === aula.id}
                                      >
                                        {inscrevendoAulaId === aula.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Processando...
                                          </>
                                        ) : (
                                          'Inscrever-se'
                                        )}
                                      </Button>
                                    )}
                                  </>
                                )}
                                {!isAdmin && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" className="w-full">
                                        <Users className="w-4 h-4 mr-2" />
                                        Ver Participantes ({inscricoesAula.length})
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Participantes - {aula.titulo}</DialogTitle>
                                        <DialogDescription>
                                          {formatDate(aula.data)} às {aula.horario}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {inscricoesAula.length === 0 ? (
                                          <p className="text-center text-gray-500 py-8">
                                            Nenhum participante ainda. Seja o primeiro!
                                          </p>
                                        ) : (
                                          inscricoesAula.map((inscricao) => (
                                            <div
                                              key={inscricao.id}
                                              className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                              <span className="font-medium">
                                                {inscricao.alunoNome || inscricao.aluno?.nome || inscricao.nomeManual || 'Participante'}
                                              </span>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico de Aulas */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Aulas</CardTitle>
                <CardDescription>
                  Aulas que você realizou
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historicoAulas.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Você ainda não tem aulas realizadas</p>
                    </div>
                  ) : (
                    historicoAulas.map((aula) => {
                      if (!aula) return null;
                      const inscricao = minhasInscricoes.find(i => i.aula_id === aula.id);
                      
                      return (
                        <Card key={aula.id} className="border-2">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold">{aula.titulo}</h3>
                                <p className="text-sm text-gray-500 mb-2">
                                  {formatDate(aula.data)} às {aula.horario}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {aula.local}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {aula.duracao} minutos
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-gray-500">
                                Realizada
                              </Badge>
                            </div>

                            {inscricao?.status === 'confirmada' && (
                              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                  Você completou esta aula
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Perfil */}
      <Dialog open={mostrarModalPerfil} onOpenChange={setMostrarModalPerfil}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
            <DialogDescription>Gerencie seus dados pessoais</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 pb-6 border-b">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: '#0D5A6E' }}>
                {alunoNome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{alunoNome}</h3>
                <p className="text-sm text-gray-500">Aluno</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Nome</Label>
                <p className="font-medium">{alunoNome}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">ID</Label>
                <p className="font-medium text-xs text-gray-500">{alunoId}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMostrarModalPerfil(false)}
              >
                Fechar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setMostrarEditarPerfil(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pagamento via Mercado Pago */}
      {inscricaoParaPagar && (
        <Dialog open={!!inscricaoParaPagar} onOpenChange={() => {
          setInscricaoParaPagar(null);
          setMercadoPagoData(null);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pagamento via Mercado Pago</DialogTitle>
              <DialogDescription>
                Escaneie o QR Code ou clique no botão para pagar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* QR Code do Mercado Pago */}
              {qrCodeImage ? (
                <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg gap-2">
                  <img 
                    src={qrCodeImage}
                    alt="QR Code para pagamento" 
                    className="border-2 border-white rounded-lg w-40 h-40"
                  />
                  <p className="text-xs text-gray-600 text-center font-medium">
                    {mercadoPagoData?.isPix ? 'QR Code PIX - Escaneie com seu banco' : 'Escaneie com seu celular para pagar'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="text-xs text-gray-600 mt-3">Gerando QR Code...</p>
                </div>
              )}

              {/* Código PIX Copia e Cola */}
              {mercadoPagoData?.qrData && mercadoPagoData?.isPix && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">PIX Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={mercadoPagoData.qrData} 
                      readOnly 
                      className="flex-1 text-xs p-2 bg-white border rounded truncate"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(mercadoPagoData.qrData);
                        toast.success('Código PIX copiado!');
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              )}

              {/* Informações de Pagamento */}
              <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Valor:</span>
                  <span className="font-bold text-lg text-green-600">
                    {aulas.find(a => a.id === inscricaoParaPagar.aula_id) ? 
                      formatCurrency(aulas.find(a => a.id === inscricaoParaPagar.aula_id)!.preco) : 
                      'R$ 0,00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Aula:</span>
                  <span className="font-medium text-sm">{aulas.find(a => a.id === inscricaoParaPagar.aula_id)?.titulo}</span>
                </div>
                {mercadoPagoData?.isPix && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Método:</span>
                    <span className="font-medium text-sm text-green-600">PIX</span>
                  </div>
                )}
              </div>

              {/* Pagamento via Cartão (link alternativo) */}
              {mercadoPagoData?.init_point && (
                <a 
                  href={mercadoPagoData.init_point}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-2" variant="outline">
                    <ExternalLink className="w-4 h-4" />
                    Pagamento via Cartão
                  </Button>
                </a>
              )}

              {/* Instruções */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800 leading-relaxed font-semibold mb-2">Como pagar:</p>
                <ul className="text-xs text-green-800 space-y-1">
                  {mercadoPagoData?.isPix ? (
                    <>
                      <li>✓ Escaneie o QR Code com o app do seu banco</li>
                      <li>✓ Ou copie o código PIX e cole no seu banco</li>
                      <li>✓ Ou clique em "Pagamento via Cartão" para outras opções</li>
                      <li>✓ O pagamento é confirmado automaticamente!</li>
                    </>
                  ) : (
                    <>
                      <li>✓ Escaneie o QR Code com seu celular</li>
                      <li>✓ Ou clique em "Pagamento via Cartão" para pagar no navegador</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Botão Cancelar */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setInscricaoParaPagar(null);
                  setMercadoPagoData(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Edição de Perfil */}
      <EditProfileDialog 
        isOpen={mostrarEditarPerfil}
        onOpenChange={setMostrarEditarPerfil}
        userName={alunoNome}
      />
    </div>
  );
}