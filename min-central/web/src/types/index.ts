export interface Funcao {
  id: number;
  fbKey?: string;
  nome: string;
  ministry: string;
  nivel: 'ministro' | 'estagiario';
  tipo: 'semanal' | 'mensal';
  semanas?: { semana: number; dias: number[] }[];
  diasMes?: number[];
}

export interface Escala {
  id: string;
  fbKey?: string;
  data: string;
  ministry: string;
  responsavel: string;
  nivel: string;
  funcaoId: number;
  funcaoNome: string;
  status: 'pendente' | 'concluido' | 'justificado' | 'faltou';
  comprovacao: string;
  justificativa: string;
}

export interface Membro {
  id: number;
  fbKey?: string;
  nick: string;
  cargo: 'lider' | 'vice' | 'ministro' | 'estagiario';
  ministry: string;
  disponivel: boolean;
  modLevel: number;
}

export interface Config {
  conclusaoSemComp: boolean;
  notificarFaltas: boolean;
  manualMinistro: boolean;
  themeColor: string;
  mesReferencia: number;
  anoReferencia: number;
  semanasAtivas: number[];
  ultimoIndiceRodizio?: Record<string, number>;
}

export interface Manual {
  titulo: string;
  conteudo: string;
  atualizado: string;
}

export interface WeekDate {
  sunday: Date;
  saturday: Date;
  weekNumber: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}