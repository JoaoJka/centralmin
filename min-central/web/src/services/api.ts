// ============================================
// CLIENTE HTTP - Chama Netlify Functions
// ============================================

import { getApiKey } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const chave = getApiKey();

  const url = `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-API-Key': chave || '',
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401 || response.status === 403) {
    sessionStorage.clear();
    window.location.href = '/';
    throw new Error('Não autenticado');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || 'Erro na API');
  }

  return response.json();
}

// ============ FUNCOES ============
export const apiFuncoes = {
  list: () => fetchAPI('funcoes'),
  create: (data: any) => fetchAPI('funcoes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`funcoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`funcoes/${id}`, { method: 'DELETE' }),
};

// ============ ESCALAS ============
export const apiEscalas = {
  list: () => fetchAPI('escalas'),
  create: (data: any) => fetchAPI('escalas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`escalas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`escalas/${id}`, { method: 'DELETE' }),
};

// ============ MEMBERS ============
export const apiMembers = {
  list: () => fetchAPI('members'),
  create: (data: any) => fetchAPI('members', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`members/${id}`, { method: 'DELETE' }),
};

// ============ CONFIG ============
export const apiConfig = {
  get: () => fetchAPI('config'),
  update: (data: any) => fetchAPI('config', { method: 'PUT', body: JSON.stringify(data) }),
};

// ============ AUTH (validação no backend) ============
export const apiAuth = {
  validate: () => fetchAPI('auth'),
};