import { useState } from 'react';
import { MapPin, Users, DollarSign, Plus, LogOut, Trash2, Filter, RefreshCw, Pencil, User, Edit2, Calendar, Clock, Eye, Mail, Phone } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Aula, Inscricao } from '@/types';
import { EditProfileDialog } from './EditProfileDialog';
import { formatDate, formatCurrency, getStatusLabel } from '@/utils/helpers';

interface ProfessorDashboardProps {
  professorNome: string;
  onLogout: () => void;
  aulas: Aula[];
  inscricoes: Inscricao[];
  onCreateAula: (aula: Omit<Aula, 'id' | 'criadaEm' | 'atualizadaEm' | 'profesor_id' | 'professorId' | 'professor' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateAula: (aulaId: string, aula: Partial<Aula>) => Promise<void>;
  onDeleteAula: (aulaId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export function ProfessorDashboard({
  professorNome,
  onLogout,
  aulas,
  inscricoes,
  onCreateAula,
  onUpdateAula,
  onDeleteAula,
  onRefresh,
}: ProfessorDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<Aula | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
  const [isInscritosDialogOpen, setIsInscritosDialogOpen] = useState(false);
  const [inscritosAula, setInscritosAula] = useState<any[]>([]);
  const [loadingInscritos, setLoadingInscritos] = useState(false);
  const [selectedAulaTitulo, setSelectedAulaTitulo] = useState('');
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: '',
    horario: '',
    duracao: 60,
    local: '',
    preco: 50,
    vagas: 8,
  });

  const handleCreateAula = async () => {
    if (!formData.titulo || !formData.data || !formData.horario || !formData.local || !formData.duracao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await onCreateAula({
        titulo: formData.titulo,
        descricao: formData.descricao,
        data: formData.data,
        horario: formData.horario,
        duracao: formData.duracao,
        local: formData.local,
        preco: formData.preco,
        vagas: formData.vagas,
        vagasDisponiveis: formData.vagas,
        status: 'aberta',
      });

      setFormData({
        titulo: '',
        descricao: '',
        data: '',
        horario: '',
        duracao: 60,
        local: '',
        preco: 50,
        vagas: 8,
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar aula:', error);
    }
  };

  const handleEditAula = (aula: Aula) => {
    setEditingAula(aula);
    setFormData({
      titulo: aula.titulo,
      descricao: aula.descricao || '',
      data: aula.data,
      horario: aula.horario,
      duracao: aula.duracao,
      local: aula.local,
      preco: aula.preco,
      vagas: aula.vagas,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAula = async () => {
    if (!editingAula) return;
    
    if (!formData.titulo || !formData.data || !formData.horario || !formData.local || !formData.duracao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Calcular novas vagas disponíveis se o total de vagas mudar
      const inscricoesCount = getInscricoesAula(editingAula.id).length;
      const novasVagasDisponiveis = Math.max(0, formData.vagas - inscricoesCount);

      await onUpdateAula(editingAula.id, {
        titulo: formData.titulo,
        descricao: formData.descricao,
        data: formData.data,
        horario: formData.horario,
        duracao: formData.duracao,
        local: formData.local,
        preco: formData.preco,
        vagas: formData.vagas,
        vagasDisponiveis: novasVagasDisponiveis,
      });

      setFormData({
        titulo: '',
        descricao: '',
        data: '',
        horario: '',
        duracao: 60,
        local: '',
        preco: 50,
        vagas: 8,
      });
      setEditingAula(null);
      setIsEditDialogOpen(false);
      toast.success('Aula atualizada com sucesso!');
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      toast.error('Erro ao atualizar aula');
    }
  };

  const getInscricoesAula = (aulaId: string) => {
    return inscricoes.filter(i => i.aula_id === aulaId);
  };

  const handleVerInscritos = async (aulaId: string, aulaTitulo: string) => {
    setSelectedAulaTitulo(aulaTitulo);
    setLoadingInscritos(true);
    setIsInscritosDialogOpen(true);
    try {
      const response = await api.listarInscritosAula(aulaId);
      setInscritosAula((response as any).inscricoes || []);
    } catch (error) {
      console.error('Erro ao carregar inscritos:', error);
      toast.error('Erro ao carregar lista de inscritos');
      setInscritosAula([]);
    } finally {
      setLoadingInscritos(false);
    }
  };

  const getStatusPagamentoStats = (aulaId: string) => {
    const inscricoesAula = getInscricoesAula(aulaId);
    const pagos = inscricoesAula.filter(i => i.status === 'confirmada').length;
    const pendentes = inscricoesAula.filter(i => i.status === 'pendente').length;
    return { pagos, pendentes, total: inscricoesAula.length };
  };

  // Ordenar aulas por data e hora
  const aulasOrdenadas = [...aulas].sort((a, b) => {
    const dateA = new Date(`${a.data}T${a.horario}`);
    const dateB = new Date(`${b.data}T${b.horario}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Filtrar aulas por mês e ano
  const filteredAulas = aulasOrdenadas.filter(aula => {
    const date = new Date(`${aula.data}T${aula.horario}`);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return (selectedYear === 'all' || year === selectedYear) && (selectedMonth === 'all' || month === selectedMonth);
  });

  // Calcular estatísticas baseadas nas aulas filtradas
  const filteredInscricoes = inscricoes.filter(insc => {
    const aula = filteredAulas.find(a => a.id === insc.aula_id);
    return !!aula;
  });

  const totalReceitaFiltrada = filteredInscricoes.reduce((acc, insc) => {
    if (insc.status === 'confirmada') {
      const aula = aulas.find(a => a.id === insc.aula_id);
      return acc + (aula?.preco || 0);
    }
    return acc;
  }, 0);

  const totalReceitaTotal = inscricoes.reduce((acc, insc) => {
    if (insc.status === 'confirmada') {
      const aula = aulas.find(a => a.id === insc.aula_id);
      return acc + (aula?.preco || 0);
    }
    return acc;
  }, 0);

  const totalPagamentosFiltered = filteredInscricoes.filter(i => i.status === 'confirmada').length;
  const totalPagamentosTotal = inscricoes.filter(i => i.status === 'confirmada').length;

  const handleClearFilters = () => {
    setSelectedMonth('all');
    setSelectedYear(new Date().getFullYear().toString());
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success('Dados atualizados!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img 
                src="/images/logo leo.jpg" 
                alt="Leo Campos Futevôlei" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate" style={{ color: '#0D5A6E' }}>Leo Campos Futevôlei</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Prof. - {professorNome}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Atualizar dados"
                className="h-10 px-2 sm:px-3"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-10 px-2 sm:px-4 text-xs sm:text-sm" style={{ backgroundColor: '#0D5A6E' }}>
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Nova Aula</span>
                    <span className="sm:hidden">Aula</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Aula</DialogTitle>
                    <DialogDescription>
                      Preencha os dados da aula que será disponibilizada para os alunos
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        placeholder="Ex: Futevôlei Iniciante"
                        value={formData.titulo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, titulo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        placeholder="Descrição da aula (opcional)"
                        value={formData.descricao}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, descricao: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="data">Data *</Label>
                        <Input
                          id="data"
                          type="date"
                          value={formData.data}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, data: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="horario">Horário *</Label>
                        <Input
                          id="horario"
                          type="time"
                          value={formData.horario}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, horario: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="local">Local *</Label>
                      <Input
                        id="local"
                        placeholder="Ex: Praia do Leblon - Quadra 1"
                        value={formData.local}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, local: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="duracao">Duração (min) *</Label>
                        <Input
                          id="duracao"
                          type="number"
                          min="30"
                          max="180"
                          value={formData.duracao}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duracao: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vagas">Vagas *</Label>
                        <Input
                          id="vagas"
                          type="number"
                          min="1"
                          max="20"
                          value={formData.vagas}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, vagas: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="preco">Preço (R$) *</Label>
                        <Input
                          id="preco"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.preco}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1"
                        style={{ backgroundColor: '#0D5A6E' }}
                        onClick={handleCreateAula}
                      >
                        Criar Aula
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setMostrarModalPerfil(true)}
              >
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
              <Button 
                variant="ghost" 
                onClick={onLogout}
                className="text-red-500 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {aulas.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500 mb-4 text-sm sm:text-base">Nenhuma aula criada ainda</p>
              <Button style={{ backgroundColor: '#0D5A6E' }} onClick={() => setIsCreateDialogOpen(true)} className="h-10 sm:h-12">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Aula
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Filter Section */}
            <Card className="bg-white">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#0D5A6E' }} />
                    <span className="font-medium whitespace-nowrap">Filtrar:</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="month-select" className="text-xs text-gray-600 mb-1 block">Mês</Label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger id="month-select" className="h-10 text-xs sm:text-sm">
                          <SelectValue placeholder="Todos os meses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os meses</SelectItem>
                          <SelectItem value="01">Janeiro</SelectItem>
                          <SelectItem value="02">Fevereiro</SelectItem>
                          <SelectItem value="03">Março</SelectItem>
                          <SelectItem value="04">Abril</SelectItem>
                          <SelectItem value="05">Maio</SelectItem>
                          <SelectItem value="06">Junho</SelectItem>
                          <SelectItem value="07">Julho</SelectItem>
                          <SelectItem value="08">Agosto</SelectItem>
                          <SelectItem value="09">Setembro</SelectItem>
                          <SelectItem value="10">Outubro</SelectItem>
                          <SelectItem value="11">Novembro</SelectItem>
                          <SelectItem value="12">Dezembro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-48">
                      <Label htmlFor="year-select" className="text-xs text-gray-600 mb-2 block">Ano</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger id="year-select">
                          <SelectValue placeholder={new Date().getFullYear().toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os anos</SelectItem>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2025">2025</SelectItem>
                          <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    Limpar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {/* Aulas */}
              <Card className="bg-white">
                <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-gray-600">Aulas</p>
                    <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#0D5A6E' }}>
                      {filteredAulas.length}
                    </p>
                    <p className="text-xs text-gray-500">de {aulas.length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Inscrições */}
              <Card className="bg-white">
                <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-gray-600">Inscrições</p>
                    <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#0D5A6E' }}>
                      {filteredInscricoes.length}
                    </p>
                    <p className="text-xs text-gray-500">de {inscricoes.length} inscrições totais</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pagamentos */}
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Pagamentos (filtrados)</p>
                    <p className="text-3xl font-bold" style={{ color: '#0D5A6E' }}>
                      {totalPagamentosFiltered}
                    </p>
                    <p className="text-xs text-gray-500">de {totalPagamentosTotal} pagamentos totais</p>
                  </div>
                </CardContent>
              </Card>

              {/* Receita */}
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Receita (filtrada)</p>
                    <p className="text-3xl font-bold" style={{ color: '#0D5A6E' }}>
                      {formatCurrency(totalReceitaFiltrada)}
                    </p>
                    <p className="text-xs text-gray-500">de {formatCurrency(totalReceitaTotal)} total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Aulas List */}
            <div>
              <div className="mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#0D5A6E' }}>Minhas Aulas</h2>
                <p className="text-xs sm:text-sm text-gray-600">Gerencie suas aulas</p>
              </div>

              <Tabs defaultValue="proximas" className="space-y-3 sm:space-y-4">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                  <TabsTrigger value="proximas" className="text-xs sm:text-sm py-2 px-1 sm:px-4">
                    <span className="hidden sm:inline">Próximas Aulas</span>
                    <span className="sm:hidden">Próximas</span>
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="text-xs sm:text-sm py-2 px-1 sm:px-4">
                    <span className="hidden sm:inline">Histórico</span>
                    <span className="sm:hidden">Histórico</span>
                  </TabsTrigger>
                  <TabsTrigger value="perfil" className="text-xs sm:text-sm py-2 px-1 sm:px-4">
                    <span className="hidden sm:inline">Meu Perfil</span>
                    <span className="sm:hidden">Perfil</span>
                  </TabsTrigger>
                </TabsList>

                {/* Abas de Aulas Próximas */}
                <TabsContent value="proximas" className="space-y-2 sm:space-y-3">
                  {(() => {
                    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
                    const hora = new Date().toLocaleTimeString('en-CA', { timeZone: 'America/Sao_Paulo', hour12: false, hour: '2-digit', minute: '2-digit' });
                    const agora = `${hoje}T${hora}`;
                    return filteredAulas.filter(a => `${a.data}T${a.horario}` > agora).length === 0 ? (
                      <Card className="bg-white">
                        <CardContent className="pt-6 text-center">
                          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500">Nenhuma aula próxima encontrada</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredAulas
                        .filter(a => `${a.data}T${a.horario}` > agora)
                        .map((aula) => {
                          const { pagos, pendentes } = getStatusPagamentoStats(aula.id);
                          return (
                          <Card key={aula.id} className="bg-white hover:shadow-md transition-shadow">
                            <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                      {formatDate(aula.data)} - {aula.horario}
                                    </span>
                                    <Badge 
                                      style={{ 
                                        backgroundColor: aula.status === 'aberta' ? '#10b981' : '#f59e0b'
                                      }}
                                      className="text-white text-xs"
                                    >
                                      {getStatusLabel(aula.status)}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                      <span className="truncate">{aula.local}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                      <span className="whitespace-nowrap">{aula.vagasDisponiveis}/{aula.vagas} vagas</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                      <span>{formatCurrency(aula.preco)}</span>
                                    </div>
                                    <div className="text-xs sm:text-sm">
                                      <span className="text-green-600 font-medium">{pagos} pagos</span>
                                      {pendentes > 0 && (
                                        <>
                                          <span className="text-gray-400 mx-1">•</span>
                                          <span className="text-yellow-600 font-medium">{pendentes} pendentes</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditAula(aula)}
                                    title="Editar aula"
                                    className="h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
                                  >
                                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                                    <span className="hidden sm:inline">Editar</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
                                    onClick={() => handleVerInscritos(aula.id, aula.titulo)}
                                    title="Ver inscritos"
                                  >
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                                    <span className="hidden sm:inline">Inscritos</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-red-500 h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
                                    onClick={() => {
                                      if (confirm('Tem certeza que deseja deletar esta aula?')) {
                                        onDeleteAula(aula.id);
                                      }
                                    }}
                                    title="Deletar aula"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    );
                  })()}
                </TabsContent>

                {/* Abas de Histórico */}
                <TabsContent value="historico" className="space-y-3">
                  {(() => {
                    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
                    const hora = new Date().toLocaleTimeString('en-CA', { timeZone: 'America/Sao_Paulo', hour12: false, hour: '2-digit', minute: '2-digit' });
                    const agora = `${hoje}T${hora}`;
                    const historicoAulas = filteredAulas.filter(a => `${a.data}T${a.horario}` <= agora);
                    return historicoAulas.length === 0 ? (
                      <Card className="bg-white">
                        <CardContent className="pt-6 text-center">
                          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500">Nenhuma aula realizada ainda</p>
                        </CardContent>
                      </Card>
                    ) : (
                      [...historicoAulas]
                      .sort((a, b) => {
                        const dateA = new Date(`${a.data}T${a.horario}`);
                        const dateB = new Date(`${b.data}T${b.horario}`);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map((aula) => {
                        const inscricoesDaAula = inscricoes.filter(i => i.aula_id === aula.id && i.status === 'confirmada');
                        return (
                          <Card key={aula.id} className="bg-white hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {formatDate(aula.data)} - {aula.horario}
                                    </span>
                                    <Badge className="bg-gray-500 text-white">Realizada</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      <span className="truncate">{aula.local}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span>{inscricoesDaAula.length} participantes</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{aula.duracao} minutos</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    );
                  })()}
                </TabsContent>

                {/* Abas de Perfil */}
                <TabsContent value="perfil" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meu Perfil</CardTitle>
                      <CardDescription>
                        Gerencie seus dados pessoais
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4 pb-6 border-b">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: '#0D5A6E' }}>
                          {professorNome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{professorNome}</h3>
                          <p className="text-sm text-gray-500">Professor</p>
                        </div>
                        <Button 
                          className="ml-auto"
                          onClick={() => setMostrarModalPerfil(true)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar Perfil
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-600">Nome</Label>
                          <p className="font-medium">{professorNome}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </main>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
            <DialogDescription>
              Altere os dados da aula
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-titulo">Título *</Label>
              <Input
                id="edit-titulo"
                placeholder="Ex: Futevôlei Iniciante"
                value={formData.titulo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Input
                id="edit-descricao"
                placeholder="Descrição da aula (opcional)"
                value={formData.descricao}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-data">Data *</Label>
                <Input
                  id="edit-data"
                  type="date"
                  value={formData.data}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-horario">Horário *</Label>
                <Input
                  id="edit-horario"
                  type="time"
                  value={formData.horario}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, horario: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-duracao">Duração (min) *</Label>
                <Input
                  id="edit-duracao"
                  type="number"
                  min="30"
                  step="15"
                  value={formData.duracao}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duracao: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-vagas">Vagas *</Label>
                <Input
                  id="edit-vagas"
                  type="number"
                  min="1"
                  value={formData.vagas}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, vagas: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-local">Local *</Label>
              <Input
                id="edit-local"
                placeholder="Ex: Praia de Copacabana"
                value={formData.local}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, local: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-preco">Preço (R$) *</Label>
              <Input
                id="edit-preco"
                type="number"
                min="0"
                step="0.01"
                value={formData.preco}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateAula} style={{ backgroundColor: '#0D5A6E' }}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Perfil */}
      <EditProfileDialog 
        isOpen={mostrarModalPerfil}
        onOpenChange={setMostrarModalPerfil}
        userName={professorNome}
      />

      {/* Modal de Inscritos na Aula */}
      <Dialog open={isInscritosDialogOpen} onOpenChange={setIsInscritosDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alunos Inscritos</DialogTitle>
            <DialogDescription>{selectedAulaTitulo}</DialogDescription>
          </DialogHeader>
          {loadingInscritos ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : inscritosAula.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum aluno inscrito nesta aula</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inscritosAula.map((inscricao: any) => (
                <Card key={inscricao.id} className="bg-gray-50">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{inscricao.aluno?.nome || 'Nome não disponível'}</p>
                        <div className="flex flex-col gap-1 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{inscricao.aluno?.email || '-'}</span>
                          </div>
                          {inscricao.aluno?.telefone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{inscricao.aluno?.telefone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={
                            inscricao.pagamento?.status === 'aprovado' 
                              ? 'bg-green-500 text-white' 
                              : inscricao.pagamento?.status === 'pendente'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-500 text-white'
                          }
                        >
                          {inscricao.pagamento?.status === 'aprovado' ? 'Pago' : 
                           inscricao.pagamento?.status === 'pendente' ? 'Pendente' : 
                           inscricao.status === 'confirmada' ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="pt-2 border-t text-sm text-gray-500 text-center">
                Total: {inscritosAula.length} {inscritosAula.length === 1 ? 'aluno' : 'alunos'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
