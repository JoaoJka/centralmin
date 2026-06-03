import { useCallback, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { apiService } from '../services/apiService';
import { Funcao, Escala, Membro } from '../types';

interface UseApiOptions {
  showErrors?: boolean;
}

export const useApi = (options: UseApiOptions = {}) => {
  const { showErrors = true } = options;
  const { setFuncoes, setEscalas, setMembers, setConfig } = useData();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ============ FUNCOES ============
  const addFuncao = useCallback(async (funcao: Omit<Funcao, 'id'>) => {
    setIsLoading(true);
    try {
      const newFuncao = await apiService.createFuncao(funcao);
      const funcoes = await apiService.getFuncoes();
      setFuncoes(funcoes);
      setError(null);
      return newFuncao;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar função';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setFuncoes, showErrors]);

  const updateFuncao = useCallback(async (id: number, updates: Partial<Funcao>) => {
    setIsLoading(true);
    try {
      await apiService.updateFuncao(id, updates);
      const funcoes = await apiService.getFuncoes();
      setFuncoes(funcoes);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar função';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setFuncoes, showErrors]);

  const deleteFuncao = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      await apiService.deleteFuncao(id);
      const funcoes = await apiService.getFuncoes();
      setFuncoes(funcoes);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar função';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setFuncoes, showErrors]);

  // ============ ESCALAS ============
  const addEscala = useCallback(async (escala: Omit<Escala, 'id'>) => {
    setIsLoading(true);
    try {
      const newEscala = await apiService.createEscala(escala);
      const escalas = await apiService.getEscalas();
      setEscalas(escalas);
      setError(null);
      return newEscala;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar escala';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setEscalas, showErrors]);

  const updateEscala = useCallback(async (id: string, updates: Partial<Escala>) => {
    setIsLoading(true);
    try {
      await apiService.updateEscala(id, updates);
      const escalas = await apiService.getEscalas();
      setEscalas(escalas);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar escala';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setEscalas, showErrors]);

  const deleteEscala = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await apiService.deleteEscala(id);
      const escalas = await apiService.getEscalas();
      setEscalas(escalas);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar escala';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setEscalas, showErrors]);

  const updateMultipleEscalas = useCallback(async (updates: { id: string; status?: string; comprovacao?: string; justificativa?: string }[]) => {
    setIsLoading(true);
    try {
      await apiService.updateMultipleEscalas(updates);
      const escalas = await apiService.getEscalas();
      setEscalas(escalas);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar escalas';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setEscalas, showErrors]);

  // ============ MEMBROS ============
  const addMember = useCallback(async (member: Omit<Membro, 'id'>) => {
    setIsLoading(true);
    try {
      const newMember = await apiService.createMember(member);
      const members = await apiService.getMembers();
      setMembers(members);
      setError(null);
      return newMember;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar membro';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setMembers, showErrors]);

  const updateMember = useCallback(async (id: number, updates: Partial<Membro>) => {
    setIsLoading(true);
    try {
      await apiService.updateMember(id, updates);
      const members = await apiService.getMembers();
      setMembers(members);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar membro';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setMembers, showErrors]);

  const deleteMember = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      await apiService.deleteMember(id);
      const members = await apiService.getMembers();
      setMembers(members);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar membro';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setMembers, showErrors]);

  // ============ CONFIG ============
  const updateConfigApi = useCallback(async (updates: any) => {
    setIsLoading(true);
    try {
      const newConfig = await apiService.updateConfig(updates);
      setConfig(newConfig);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
      setError(message);
      if (showErrors) console.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setConfig, showErrors]);

  return {
    error,
    isLoading,
    addFuncao,
    updateFuncao,
    deleteFuncao,
    addEscala,
    updateEscala,
    deleteEscala,
    updateMultipleEscalas,
    addMember,
    updateMember,
    deleteMember,
    updateConfigApi,
  };
};
