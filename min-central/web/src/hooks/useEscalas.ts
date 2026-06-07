import { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { Escala } from '../types';

export const useEscalas = () => {
  const { funcoes, members, config, setEscalas } = useData();
  const [escalaWeekOffset, setEscalaWeekOffset] = useState(0);
  const [escalaTab, setEscalaTab] = useState('todas');
  const [loading, setLoading] = useState(false);
  
  // CORREÇÃO: Usar ref para evitar loop de dependências
  const configRef = useRef(config);
  const funcoesRef = useRef(funcoes);
  const membersRef = useRef(members);
  
  // Atualizar refs sem causar re-render
  useEffect(() => {
    configRef.current = config;
    funcoesRef.current = funcoes;
    membersRef.current = members;
  });
  
  const [rodizioIndex, setRodizioIndex] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('escala_rodizio_index');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('escala_rodizio_index', JSON.stringify(rodizioIndex));
  }, [rodizioIndex]);

  const getResponsavelAutomatico = useCallback((ministry: string, nivel: string) => {
    const currentMembers = membersRef.current;
    
    let candidatos = currentMembers.filter(m => 
      m.ministry === ministry && 
      m.cargo === nivel && 
      m.disponivel === true
    );
    
    if (candidatos.length === 0) {
      const nivelOposto = nivel === 'ministro' ? 'estagiario' : 'ministro';
      candidatos = currentMembers.filter(m => 
        m.ministry === ministry && 
        m.cargo === nivelOposto && 
        m.disponivel === true
      );
      
      if (candidatos.length === 0) {
        return null;
      }
    }
    
    if (candidatos.length === 1) {
      return candidatos[0].nick;
    }
    
    const chaveRodizio = `${ministry}_${nivel}`;
    const ultimoIndice = rodizioIndex[chaveRodizio] || 0;
    const proximoIndice = (ultimoIndice + 1) % candidatos.length;
    
    setRodizioIndex(prev => ({ ...prev, [chaveRodizio]: proximoIndice }));
    
    return candidatos[proximoIndice].nick;
  }, [rodizioIndex]);

  const getWeekDates = useCallback((offset: number) => {
    const currentConfig = configRef.current;
    const mesConfig = currentConfig.mesReferencia !== undefined ? currentConfig.mesReferencia : new Date().getMonth();
    const anoConfig = currentConfig.anoReferencia !== undefined ? currentConfig.anoReferencia : new Date().getFullYear();
    
    const primeiroDiaMes = new Date(anoConfig, mesConfig, 1);
    let diasParaPrimeiroDomingo = (7 - primeiroDiaMes.getDay()) % 7;
    const primeiroDomingo = new Date(anoConfig, mesConfig, 1 + diasParaPrimeiroDomingo);
    
    const sunday = new Date(primeiroDomingo);
    sunday.setDate(primeiroDomingo.getDate() + (offset * 7));
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    
    return { sunday, saturday };
  }, []);

  const getMonthDates = useCallback(() => {
    const currentConfig = configRef.current;
    const mesConfig = currentConfig.mesReferencia !== undefined ? currentConfig.mesReferencia : new Date().getMonth();
    const anoConfig = currentConfig.anoReferencia !== undefined ? currentConfig.anoReferencia : new Date().getFullYear();
    const firstDay = new Date(anoConfig, mesConfig, 1);
    const lastDay = new Date(anoConfig, mesConfig + 1, 0);
    return { firstDay, lastDay, year: anoConfig, month: mesConfig };
  }, []);

  // CORREÇÃO: useCallback para evitar recriação da função
  const generateEscalas = useCallback(() => {
    const currentConfig = configRef.current;
    const currentFuncoes = funcoesRef.current;
    
    setLoading(true);
    
    const { sunday, saturday } = getWeekDates(escalaWeekOffset);
    const weekStart = new Date(sunday);
    const weekEnd = new Date(saturday);
    
    const semanasAtivas = currentConfig.semanasAtivas || [1, 2, 3, 4];
    const semanaAtualNumero = escalaWeekOffset + 1;
    
    const novasEscalas: Escala[] = [];
    
    currentFuncoes.forEach(f => {
      if (f.tipo === 'semanal' && f.semanas) {
        f.semanas.forEach(s => {
          const { sunday: weekSunday } = getWeekDates(s.semana);
          
          s.dias.forEach(dayIndex => {
            const date = new Date(weekSunday);
            date.setDate(weekSunday.getDate() + dayIndex);
            const dateStr = date.toISOString().split('T')[0];
            
            if (date >= weekStart && date <= weekEnd && semanasAtivas.includes(semanaAtualNumero)) {
              const responsavel = getResponsavelAutomatico(f.ministry, f.nivel);
              
              if (responsavel) {
                novasEscalas.push({
                  id: `${dateStr}-${f.id}-${Date.now()}`,
                  data: dateStr,
                  ministry: f.ministry,
                  responsavel: responsavel,
                  nivel: f.nivel,
                  funcaoId: f.id,
                  funcaoNome: f.nome,
                  status: 'pendente',
                  comprovacao: '',
                  justificativa: ''
                });
              }
            }
          });
        });
      } else if (f.tipo === 'mensal' && f.diasMes) {
        const { firstDay } = getMonthDates();
        
        f.diasMes.forEach(dayNum => {
          const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), dayNum);
          const dateStr = date.toISOString().split('T')[0];
          
          if (date >= weekStart && date <= weekEnd && semanasAtivas.includes(semanaAtualNumero)) {
            const responsavel = getResponsavelAutomatico(f.ministry, f.nivel);
            
            if (responsavel) {
              novasEscalas.push({
                id: `${dateStr}-${f.id}-${Date.now()}`,
                data: dateStr,
                ministry: f.ministry,
                responsavel: responsavel,
                nivel: f.nivel,
                funcaoId: f.id,
                funcaoNome: f.nome,
                status: 'pendente',
                comprovacao: '',
                justificativa: ''
              });
            }
          }
        });
      }
    });
    
    setEscalas(novasEscalas);
    setLoading(false);
  }, [escalaWeekOffset, getWeekDates, getMonthDates, getResponsavelAutomatico, setEscalas]);

  // CORREÇÃO: Dependências simplificadas - só escuta mudanças reais
  useEffect(() => {
    generateEscalas();
  }, [generateEscalas]);

  const changeWeek = (dir: number) => {
    const currentConfig = configRef.current;
    const semanasAtivas = currentConfig.semanasAtivas || [1, 2, 3, 4];
    const maxSemana = Math.max(...semanasAtivas);
    const minSemana = Math.min(...semanasAtivas);
    const novaSemana = escalaWeekOffset + dir;
    
    if (novaSemana + 1 > maxSemana && dir > 0) return;
    if (novaSemana + 1 < minSemana && dir < 0) return;
    
    setEscalaWeekOffset(novaSemana);
  };

  const goToToday = () => {
    const currentConfig = configRef.current;
    const semanasAtivas = currentConfig.semanasAtivas || [1, 2, 3, 4];
    const primeiraSemana = Math.min(...semanasAtivas);
    setEscalaWeekOffset(primeiraSemana - 1);
  };

  return {
    escalaWeekOffset,
    escalaTab,
    setEscalaTab,
    changeWeek,
    goToToday,
    getWeekDates,
    getMonthDates,
    loading,
    generateEscalas
  };
};