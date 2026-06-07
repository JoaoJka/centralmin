// ============================================
// API - Cliente HTTP para Netlify Functions
// ============================================

const API_BASE = import.meta.env.VITE_API_URL || 'https://mincentral-back.netlify.app/.netlify/functions';

// ---------- CLIENTE HTTP BASE ----------

async function fetchAPI(endpoint: string, options: RequestInit = {}, requireAuth: boolean = true) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (requireAuth) {
    const token = localStorage.getItem('auth_token'); // CORRIGIDO: localStorage
    if (!token) {
      throw new Error('Não autenticado. Faça login.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('auth_token'); // CORRIGIDO: localStorage
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

// ---------- AUTH ----------

export const apiAuth = {
  login: async (nick: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro no login' }));
      throw new Error(error.error || 'Erro no login');
    }
    
    return response.json();
  },

  register: async (nick: string, codigo: string, senha: string, cargo?: string, ministry?: string) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, codigo, senha, cargo, ministry })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro no cadastro' }));
      throw new Error(error.error || 'Erro no cadastro');
    }
    
    return response.json();
  },

  me: () => fetchAPI('auth/me', {}, true),
  validate: () => fetchAPI('auth/me', {}, true),
};

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

// ---------- APPROVE (CORRIGIDO) ----------

export const apiApprove = {
  list: () => fetchAPI('approve'),
  approve: (uid: string, cargo?: string) => fetchAPI('approve', { 
    method: 'POST', 
    body: JSON.stringify({ uid, acao: 'aprovar', cargo }) 
  }),
  reject: (uid: string) => fetchAPI('approve', { 
    method: 'POST', 
    body: JSON.stringify({ uid, acao: 'rejeitar' }) 
  }),
};

// ---------- RESET PASSWORD ----------

export const apiResetPassword = {
  reset: (nick: string, novaSenha: string) => fetchAPI('reset-password', {
    method: 'POST',
    body: JSON.stringify({ nick, novaSenha })
  }),
};

// ============================================
// apiService
// ============================================

export const apiService = {
  login: (nick: string, password: string) => apiAuth.login(nick, password),
  register: (nick: string, codigo: string, senha: string, cargo?: string, ministry?: string) => 
    apiAuth.register(nick, codigo, senha, cargo, ministry),
  getMe: () => apiAuth.me(),
  validateAuth: () => apiAuth.validate(),

  getFuncoes: () => apiFuncoes.list(),
  createFuncao: (data: any) => apiFuncoes.create(data),
  updateFuncao: (id: number, data: any) => apiFuncoes.update(id, data),
  deleteFuncao: (id: number) => apiFuncoes.delete(id),

  getEscalas: () => apiEscalas.list(),
  createEscala: (data: any) => apiEscalas.create(data),
  updateEscala: (id: string, data: any) => apiEscalas.update(id, data),
  deleteEscala: (id: string) => apiEscalas.delete(id),
  updateMultipleEscalas: async (updates: any[]) => {
    for (const u of updates) {
      await apiEscalas.update(u.id, u);
    }
  },

  getMembers: () => apiMembers.list(),
  createMember: (data: any) => apiMembers.create(data),
  updateMember: (id: number, data: any) => apiMembers.update(id, data),
  deleteMember: (id: number) => apiMembers.delete(id),

  getConfig: () => apiConfig.get(),
  updateConfig: (data: any) => apiConfig.update(data),

  getPendentes: () => apiApprove.list(),
  approveCadastro: (uid: string, cargo?: string) => apiApprove.approve(uid, cargo),
  rejectCadastro: (uid: string) => apiApprove.reject(uid),

  resetPassword: (nick: string, novaSenha: string) => apiResetPassword.reset(nick, novaSenha),
};

export default apiService;