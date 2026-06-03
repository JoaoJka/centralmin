import mockData from '../data/mockData.json';
import { Funcao, Escala, Membro, Config } from '../types';

const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private data = JSON.parse(JSON.stringify(mockData));

  // ============ FUNCOES ============
  async getFuncoes(): Promise<Funcao[]> {
    await simulateDelay();
    return this.data.funcoes;
  }

  async getFuncaoById(id: number): Promise<Funcao | undefined> {
    await simulateDelay();
    return this.data.funcoes.find((f: Funcao) => f.id === id);
  }

  async createFuncao(funcao: Omit<Funcao, 'id'>): Promise<Funcao> {
    await simulateDelay();
    const newFuncao: Funcao = {
      ...funcao,
      id: Math.max(...this.data.funcoes.map((f: Funcao) => f.id), 0) + 1,
    };
    this.data.funcoes.push(newFuncao);
    return newFuncao;
  }

  async updateFuncao(id: number, updates: Partial<Funcao>): Promise<Funcao> {
    await simulateDelay();
    const funcao = this.data.funcoes.find((f: Funcao) => f.id === id);
    if (!funcao) throw new Error(`Função ${id} não encontrada`);
    Object.assign(funcao, updates);
    return funcao;
  }

  async deleteFuncao(id: number): Promise<void> {
    await simulateDelay();
    const index = this.data.funcoes.findIndex((f: Funcao) => f.id === id);
    if (index === -1) throw new Error(`Função ${id} não encontrada`);
    this.data.funcoes.splice(index, 1);
  }

  // ============ ESCALAS ============
  async getEscalas(): Promise<Escala[]> {
    await simulateDelay();
    return this.data.escalas;
  }

  async getEscalaById(id: string): Promise<Escala | undefined> {
    await simulateDelay();
    return this.data.escalas.find((e: Escala) => e.id === id);
  }

  async createEscala(escala: Omit<Escala, 'id'>): Promise<Escala> {
    await simulateDelay();
    const newEscala: Escala = {
      ...escala,
      id: `${Date.now()}`,
    };
    this.data.escalas.push(newEscala);
    return newEscala;
  }

  async updateEscala(id: string, updates: Partial<Escala>): Promise<Escala> {
    await simulateDelay();
    const escala = this.data.escalas.find((e: Escala) => e.id === id);
    if (!escala) throw new Error(`Escala ${id} não encontrada`);
    Object.assign(escala, updates);
    return escala;
  }

  async deleteEscala(id: string): Promise<void> {
    await simulateDelay();
    const index = this.data.escalas.findIndex((e: Escala) => e.id === id);
    if (index === -1) throw new Error(`Escala ${id} não encontrada`);
    this.data.escalas.splice(index, 1);
  }

  async updateMultipleEscalas(updates: { id: string; status?: string; comprovacao?: string; justificativa?: string }[]): Promise<Escala[]> {
    await simulateDelay();
    return updates.map(update => {
      const escala = this.data.escalas.find((e: Escala) => e.id === update.id);
      if (!escala) throw new Error(`Escala ${update.id} não encontrada`);
      Object.assign(escala, update);
      return escala;
    });
  }

  // ============ MEMBROS ============
  async getMembers(): Promise<Membro[]> {
    await simulateDelay();
    return this.data.members;
  }

  async getMemberById(id: number): Promise<Membro | undefined> {
    await simulateDelay();
    return this.data.members.find((m: Membro) => m.id === id);
  }

  async createMember(member: Omit<Membro, 'id'>): Promise<Membro> {
    await simulateDelay();
    const newMember: Membro = {
      ...member,
      id: Math.max(...this.data.members.map((m: Membro) => m.id), 0) + 1,
    };
    this.data.members.push(newMember);
    return newMember;
  }

  async updateMember(id: number, updates: Partial<Membro>): Promise<Membro> {
    await simulateDelay();
    const member = this.data.members.find((m: Membro) => m.id === id);
    if (!member) throw new Error(`Membro ${id} não encontrado`);
    Object.assign(member, updates);
    return member;
  }

  async deleteMember(id: number): Promise<void> {
    await simulateDelay();
    const index = this.data.members.findIndex((m: Membro) => m.id === id);
    if (index === -1) throw new Error(`Membro ${id} não encontrado`);
    this.data.members.splice(index, 1);
  }

  // ============ CONFIGURAÇÕES ============
  async getConfig(): Promise<Config> {
    await simulateDelay();
    return this.data.config;
  }

  async updateConfig(updates: Partial<Config>): Promise<Config> {
    await simulateDelay();
    Object.assign(this.data.config, updates);
    return this.data.config;
  }

  // ============ MÉTODOS UTILITÁRIOS ============
  async getEscalasByMonth(mes: number, ano: number): Promise<Escala[]> {
    await simulateDelay();
    return this.data.escalas.filter((e: Escala) => {
      const date = new Date(e.data);
      return date.getMonth() === mes && date.getFullYear() === ano;
    });
  }

  async getEscalasByMember(memberId: number): Promise<Escala[]> {
    await simulateDelay();
    const member = this.data.members.find((m: Membro) => m.id === memberId);
    if (!member) return [];
    return this.data.escalas.filter((e: Escala) => e.responsavel === member.nick);
  }

  async getEscalasByMinistry(ministry: string): Promise<Escala[]> {
    await simulateDelay();
    return this.data.escalas.filter((e: Escala) => e.ministry === ministry);
  }

  async getMembersByMinistry(ministry: string): Promise<Membro[]> {
    await simulateDelay();
    return this.data.members.filter((m: Membro) => m.ministry === ministry);
  }
}

export const apiService = new ApiService();
