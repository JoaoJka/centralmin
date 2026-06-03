import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Funcao, Escala, Membro, Config } from '../types';
import { apiService } from '../services/apiService';

interface DataContextType {
  funcoes: Funcao[];
  escalas: Escala[];
  members: Membro[];
  config: Config;
  setFuncoes: React.Dispatch<React.SetStateAction<Funcao[]>>;
  setEscalas: React.Dispatch<React.SetStateAction<Escala[]>>;
  setMembers: React.Dispatch<React.SetStateAction<Membro[]>>;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [members, setMembers] = useState<Membro[]>([]);
  const [config, setConfig] = useState<Config>({
    conclusaoSemComp: false,
    notificarFaltas: true,
    manualMinistro: false,
    themeColor: '#3b82f6',
    mesReferencia: new Date().getMonth(),
    anoReferencia: new Date().getFullYear(),
    semanasAtivas: [1, 2, 3, 4]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [funcoesData, escalasData, membersData, configData] = await Promise.all([
          apiService.getFuncoes(),
          apiService.getEscalas(),
          apiService.getMembers(),
          apiService.getConfig()
        ]);
        
        setFuncoes(funcoesData);
        setEscalas(escalasData);
        setMembers(membersData);
        setConfig(configData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ funcoes, escalas, members, config, setFuncoes, setEscalas, setMembers, setConfig, isLoading }}>
      {children}
    </DataContext.Provider>
  );
};