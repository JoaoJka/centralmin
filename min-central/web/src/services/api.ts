// ============================================
// API - Cliente HTTP para Netlify Functions (React/TS)
// ============================================

const API_BASE = import.meta.env.VITE_API_URL || '';

// ---------- CLIENTE HTTP BASE ----------

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Não autenticado. Faça login.');
  }

  const url = `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem('auth_token');
    window.location.href = '/';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

// ---------- FUNCOES ----------

export const apiFuncoes = {
  list: () => fetchAPI('funcoes'),
  create: (data: any) => fetchAPI('funcoes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`funcoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`funcoes/${id}`, { method: 'DELETE' }),
};

// ---------- ESCALAS ----------

export const apiEscalas = {
  list: () => fetchAPI('escalas'),
  create: (data: any) => fetchAPI('escalas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`escalas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`escalas/${id}`, { method: 'DELETE' }),
};

// ---------- MEMBERS ----------

export const apiMembers = {
  list: () => fetchAPI('members'),
  create: (data: any) => fetchAPI('members', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`members/${id}`, { method: 'DELETE' }),
};

// ---------- CONFIG ----------

export const apiConfig = {
  get: () => fetchAPI('config'),
  update: (data: any) => fetchAPI('config', { method: 'PUT', body: JSON.stringify(data) }),
};

// ---------- AUTH ----------

export const apiAuth = {
  validate: () => fetchAPI('auth/me'),
};

// ============================================
// apiService - Compatibilidade com DataContext.tsx
// ============================================

export const apiService = {
  // Funções
  getFuncoes: () => apiFuncoes.list(),
  createFuncao: (data: any) => apiFuncoes.create(data),
  updateFuncao: (id: number, data: any) => apiFuncoes.update(id, data),
  deleteFuncao: (id: number) => apiFuncoes.delete(id),

  // Escalas
  getEscalas: () => apiEscalas.list(),
  createEscala: (data: any) => apiEscalas.create(data),
  updateEscala: (id: string, data: any) => apiEscalas.update(id, data),
  deleteEscala: (id: string) => apiEscalas.delete(id),
  updateMultipleEscalas: async (updates: any[]) => {
    for (const u of updates) {
      await apiEscalas.update(u.id, u);
    }
  },

  // Members
  getMembers: () => apiMembers.list(),
  createMember: (data: any) => apiMembers.create(data),
  updateMember: (id: number, data: any) => apiMembers.update(id, data),
  deleteMember: (id: number) => apiMembers.delete(id),

  // Config
  getConfig: () => apiConfig.get(),
  updateConfig: (data: any) => apiConfig.update(data),
};

export default apiService;