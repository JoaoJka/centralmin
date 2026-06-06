import mockData from '../data/mockData.json';
import { Funcao, Escala, Membro, Config } from '../types';

const API_ROOT = import.meta.env.VITE_API_URL || '';

const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private data = JSON.parse(JSON.stringify(mockData));

  private async request(path: string, options: RequestInit = {}) {
    if (!API_ROOT) {
      throw new Error('NO_API');
    }
    const res = await fetch(`${API_ROOT}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(await res.text());
    if (res.status === 204) return null;
    return res.json();
  }

  // Try backend if configured, otherwise fallback to mock
  private async tryBackend<T>(fn: () => Promise<T>): Promise<T> {
    if (!API_ROOT) return fn();
    return fn();
  }

  // ============ FUNCOES ============
  async getFuncoes(): Promise<Funcao[]> {
    if (API_ROOT) return (await this.request('/funcoes')) as Funcao[];
    await simulateDelay();
    return this.data.funcoes;
  }

  async getFuncaoById(id: number): Promise<Funcao | undefined> {
    if (API_ROOT) {
      const all = (await this.request('/funcoes')) as Funcao[];
      return all.find(f => f.id === id || Number(f.id) === id);
    }
    await simulateDelay();
    return this.data.funcoes.find((f: Funcao) => f.id === id);
  }

  async createFuncao(funcao: Omit<Funcao, 'id'>): Promise<Funcao> {
    if (API_ROOT) return (await this.request('/funcoes', { method: 'POST', body: JSON.stringify(funcao) })) as Funcao;
    await simulateDelay();
    const newFuncao: Funcao = {
      ...funcao,
      id: Math.max(...this.data.funcoes.map((f: Funcao) => f.id), 0) + 1,
    };
    this.data.funcoes.push(newFuncao);
    return newFuncao;
  }

  async updateFuncao(id: number, updates: Partial<Funcao>): Promise<Funcao> {
    if (API_ROOT) return (await this.request(`/funcoes/${id}`, { method: 'PUT', body: JSON.stringify(updates) })) as Funcao;
    await simulateDelay();
    const funcao = this.data.funcoes.find((f: Funcao) => f.id === id);
    if (!funcao) throw new Error(`Função ${id} não encontrada`);
    Object.assign(funcao, updates);
    return funcao;
  }

  async deleteFuncao(id: number): Promise<void> {
    if (API_ROOT) return await this.request(`/funcoes/${id}`, { method: 'DELETE' }) as any;
    await simulateDelay();
    const index = this.data.funcoes.findIndex((f: Funcao) => f.id === id);
    if (index === -1) throw new Error(`Função ${id} não encontrada`);
    this.data.funcoes.splice(index, 1);
  }

  // ============ ESCALAS ============
  async getEscalas(): Promise<Escala[]> {
    if (API_ROOT) return (await this.request('/escalas')) as Escala[];
    await simulateDelay();
    return this.data.escalas;
  }

  async getEscalaById(id: string): Promise<Escala | undefined> {
    if (API_ROOT) {
      const all = (await this.request('/escalas')) as Escala[];
      return all.find(e => e.id === id);
    }
    await simulateDelay();
    return this.data.escalas.find((e: Escala) => e.id === id);
  }

  async createEscala(escala: Omit<Escala, 'id'>): Promise<Escala> {
    if (API_ROOT) return (await this.request('/escalas', { method: 'POST', body: JSON.stringify(escala) })) as Escala;
    await simulateDelay();
    const newEscala: Escala = {
      ...escala,
      id: `${Date.now()}`,
    };
    this.data.escalas.push(newEscala);
    return newEscala;
  }

  async updateEscala(id: string, updates: Partial<Escala>): Promise<Escala> {
    if (API_ROOT) return (await this.request(`/escalas/${id}`, { method: 'PUT', body: JSON.stringify(updates) })) as Escala;
    await simulateDelay();
    const escala = this.data.escalas.find((e: Escala) => e.id === id);
    if (!escala) throw new Error(`Escala ${id} não encontrada`);
    Object.assign(escala, updates);
    return escala;
  }

  async deleteEscala(id: string): Promise<void> {
    if (API_ROOT) return await this.request(`/escalas/${id}`, { method: 'DELETE' }) as any;
    await simulateDelay();
    const index = this.data.escalas.findIndex((e: Escala) => e.id === id);
    if (index === -1) throw new Error(`Escala ${id} não encontrada`);
    this.data.escalas.splice(index, 1);
  }

  async updateMultipleEscalas(updates: { id: string; status?: string; comprovacao?: string; justificativa?: string }[]): Promise<Escala[]> {
    // Backend doesn't yet implement batch update; fallback to multiple requests
    if (API_ROOT) {
      const promises = updates.map(u => this.updateEscala(u.id, u as any));
      return Promise.all(promises);
    }
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
    if (API_ROOT) return (await this.request('/members')) as Membro[];
    await simulateDelay();
    return this.data.members;
  }

  async getMemberById(id: number): Promise<Membro | undefined> {
    if (API_ROOT) {
      const all = (await this.request('/members')) as Membro[];
      return all.find(m => m.id === id || Number(m.id) === id);
    }
    await simulateDelay();
    return this.data.members.find((m: Membro) => m.id === id);
  }

  async createMember(member: Omit<Membro, 'id'>): Promise<Membro> {
    if (API_ROOT) return (await this.request('/members', { method: 'POST', body: JSON.stringify(member) })) as Membro;
    await simulateDelay();
    const newMember: Membro = {
      ...member,
      id: Math.max(...this.data.members.map((m: Membro) => m.id), 0) + 1,
    };
    this.data.members.push(newMember);
    return newMember;
  }

  async updateMember(id: number, updates: Partial<Membro>): Promise<Membro> {
    if (API_ROOT) return (await this.request(`/members/${id}`, { method: 'PUT', body: JSON.stringify(updates) })) as Membro;
    await simulateDelay();
    const member = this.data.members.find((m: Membro) => m.id === id);
    if (!member) throw new Error(`Membro ${id} não encontrado`);
    Object.assign(member, updates);
    return member;
  }

  async deleteMember(id: number): Promise<void> {
    if (API_ROOT) return await this.request(`/members/${id}`, { method: 'DELETE' }) as any;
    await simulateDelay();
    const index = this.data.members.findIndex((m: Membro) => m.id === id);
    if (index === -1) throw new Error(`Membro ${id} não encontrado`);
    this.data.members.splice(index, 1);
  }

  // ============ CONFIGURAÇÕES ============
  async getConfig(): Promise<Config> {
    if (API_ROOT) return (await this.request('/config')) as Config;
    await simulateDelay();
    return this.data.config;
  }

  async updateConfig(updates: Partial<Config>): Promise<Config> {
    if (API_ROOT) return (await this.request('/config', { method: 'PUT', body: JSON.stringify(updates) })) as Config;
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
