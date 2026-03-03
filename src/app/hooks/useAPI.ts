import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Aula } from '../types';

export function useAulas() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarAulas();
  }, []);

  const carregarAulas = async () => {
    try {
      setLoading(true);
      const response = await api.listarAulas();
      if (response.sucesso && response.dados) {
        setAulas(response.dados as Aula[]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { aulas, loading, error, recarregar: carregarAulas };
}

export function useInscricoes() {
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarInscricoes();
  }, []);

  const carregarInscricoes = async () => {
    try {
      setLoading(true);
      // Buscar TODAS as inscrições para poder mostrar participantes
      const response = await api.listarInscricoes();
      if (response.sucesso && response.dados) {
        // Mapear para incluir alunoNome (usando o que vem do backend ou fallback com nomeManual)
        const inscricoesFormatadas = (response.dados as any[]).map(insc => ({
          ...insc,
          alunoNome: insc.alunoNome || insc.aluno?.nome || insc.usuario?.nome || insc.nomeManual || 'Aluno',
        }));
        setInscricoes(inscricoesFormatadas);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar inscrições:', err);
    } finally {
      setLoading(false);
    }
  };

  return { inscricoes, loading, error, recarregar: carregarInscricoes };
}
