// ============================================
// AUTENTICAÇÃO - Valida chave do Firebase + sessão
// ============================================

const FIREBASE_URL = import.meta.env.VITE_FIREBASE_URL || '';

interface AuthResult {
  autenticado: boolean;
  nick?: string;
  cargo?: string;
}

export async function validarChave(chave: string): Promise<AuthResult> {
  if (!FIREBASE_URL) {
    console.error('VITE_FIREBASE_URL não configurado');
    return { autenticado: false };
  }

  try {
    // Busca a sessão
    const sessaoRes = await fetch(`${FIREBASE_URL}/sessoes/${chave}.json`);
    const sessao = await sessaoRes.json();

    if (!sessao) {
      return { autenticado: false };
    }

    // Busca os dados do usuário
    const nick = sessao.nick;
    const userRes = await fetch(`${FIREBASE_URL}/chaves_api/${encodeURIComponent(nick)}.json`);
    const userData = await userRes.json();

    if (!userData || !userData.ativo || userData.chave !== chave) {
      return { autenticado: false };
    }

    return {
      autenticado: true,
      nick: nick,
      cargo: userData.cargo
    };
  } catch (e) {
    return { autenticado: false };
  }
}

export async function authenticate(): Promise<AuthResult> {
  const params = new URLSearchParams(window.location.search);
  const chave = params.get('key');

  if (chave) {
    const resultado = await validarChave(chave);

    if (resultado.autenticado) {
      // Guarda no sessionStorage
      sessionStorage.setItem('api_key', chave);
      sessionStorage.setItem('auth_nick', resultado.nick!);
      sessionStorage.setItem('auth_cargo', resultado.cargo || '');
      sessionStorage.setItem('auth_time', Date.now().toString());

      // Limpa URL
      const url = new URL(window.location.href);
      url.searchParams.delete('key');
      window.history.replaceState({}, '', url.toString());

      return resultado;
    }
  }

  // Tenta recuperar do sessionStorage
  const savedKey = sessionStorage.getItem('api_key');
  if (savedKey) {
    const resultado = await validarChave(savedKey);
    if (resultado.autenticado) {
      return resultado;
    }
    // Chave inválida/expirada, limpa
    logout();
  }

  return { autenticado: false };
}

export function logout(): void {
  const chave = sessionStorage.getItem('api_key');
  if (chave && FIREBASE_URL) {
    // Remove sessão do Firebase
    fetch(`${FIREBASE_URL}/sessoes/${chave}.json`, { method: 'DELETE' }).catch(() => {});
  }
  sessionStorage.removeItem('api_key');
  sessionStorage.removeItem('auth_nick');
  sessionStorage.removeItem('auth_cargo');
  sessionStorage.removeItem('auth_time');
  window.location.href = '/';
}

export function getCurrentNick(): string | null {
  return sessionStorage.getItem('auth_nick');
}

export function getCurrentCargo(): string | null {
  return sessionStorage.getItem('auth_cargo');
}

export function getApiKey(): string | null {
  return sessionStorage.getItem('api_key');
}

export function isAuthenticated(): boolean {
  return !!sessionStorage.getItem('api_key');
}