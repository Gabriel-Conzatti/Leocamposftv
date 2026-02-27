import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onProfileUpdated?: (newName: string) => void;
}

export function EditProfileDialog({
  isOpen,
  onOpenChange,
  userName,
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [nome, setNome] = useState(userName);
  const [telefone, setTelefone] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  // Carregar dados do perfil ao abrir
  useEffect(() => {
    if (isOpen) {
      setLoadingPerfil(true);
      api.obterPerfil()
        .then((response: any) => {
          const usuario = response.dados?.usuario;
          if (usuario) {
            setNome(usuario.nome || userName);
            setTelefone(usuario.telefone || '');
          }
        })
        .catch((error: any) => {
          console.error('Erro ao carregar perfil:', error);
        })
        .finally(() => {
          setLoadingPerfil(false);
        });
    }
  }, [isOpen, userName]);

  const handleSalvar = async () => {
    // Validações
    if (novaSenha && novaSenha !== confirmarNovaSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (novaSenha && !senhaAtual) {
      toast.error('Informe a senha atual para alterar a senha');
      return;
    }

    if (novaSenha && novaSenha.length < 6) {
      toast.error('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const dados: any = {};
      
      if (nome && nome !== userName) {
        dados.nome = nome;
      }
      
      if (telefone) {
        dados.telefone = telefone;
      }

      if (novaSenha && senhaAtual) {
        dados.senhaAtual = senhaAtual;
        dados.novaSenha = novaSenha;
      }

      if (Object.keys(dados).length === 0) {
        toast.info('Nenhuma alteração para salvar');
        return;
      }

      const response = await api.atualizarPerfil(dados);
      
      if (response.sucesso) {
        toast.success('Perfil atualizado com sucesso!');
        
        // Atualizar nome no localStorage e no componente pai
        if (dados.nome) {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          userData.nome = dados.nome;
          localStorage.setItem('user', JSON.stringify(userData));
          onProfileUpdated?.(dados.nome);
        }

        // Limpar campos de senha
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarNovaSenha('');
        
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Limpar campos ao fechar
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarNovaSenha('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>Atualize seus dados pessoais</DialogDescription>
        </DialogHeader>
        
        {loadingPerfil ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Alterar Senha (opcional)</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="senhaAtual">Senha Atual</Label>
                    <Input
                      id="senhaAtual"
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novaSenha">Nova Senha</Label>
                    <Input
                      id="novaSenha"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Digite a nova senha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarNovaSenha">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmarNovaSenha"
                      type="password"
                      value={confirmarNovaSenha}
                      onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSalvar} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
