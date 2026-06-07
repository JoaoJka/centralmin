// ============================================
// AUTENTICAÇÃO - Valida chave do Firebase + sessão
// Anti-burla: proteção contra modificação do sessionStorage
// ============================================

const FIREBASE_URL = import.meta.env.VITE_FIREBASE_URL || '';

interface AuthResult {
  autenticado: boolean;
  nick?: string;
  cargo?: string;
}

// ---------- ANTI-BURLA: Protege sessionStorage ----------
(function antiBurla() {
  const KEYS_PROTEGIDOS = ['api_key', 'auth_nick', 'auth_cargo', 'auth_time'];

  // Intercepta setItem
  const originalSetItem = sessionStorage.setItem.bind(sessionStorage);
  sessionStorage.setItem = function(key: string, value: string) {
    if (KEYS_PROTEGIDOS.includes(key)) {
      const stack = new Error().stack || '';
      const permitido = stack.includes('authenticate') || stack.includes('logout') || stack.includes('validarChave');
      if (!permitido) {
        console.warn('[ANTI-BURLA] Tentativa de modificação da sessão bloqueada');
        return;
      }
    }
    return originalSetItem(key, value);
  };

  // Intercepta removeItem
  const originalRemoveItem = sessionStorage.removeItem.bind(sessionStorage);
  sessionStorage.removeItem = function(key: string) {
    if (KEYS_PROTEGIDOS.includes(key)) {
      const stack = new Error().stack || '';
      const permitido = stack.includes('logout') || stack.includes('authenticate');
      if (!permitido) {
        console.warn('[ANTI-BURLA] Tentativa de remoção da sessão bloqueada');
        return;
      }
    }
    return originalRemoveItem(key);
  };

  // Intercepta clear
  const originalClear = sessionStorage.clear.bind(sessionStorage);
  sessionStorage.clear = function() {
    const stack = new Error().stack || '';
    const permitido = stack.includes('logout');
    if (!permitido) {
      console.warn('[ANTI-BURLA] Tentativa de clear bloqueada — sessão preservada');
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && !KEYS_PROTEGIDOS.includes(k)) {
          originalRemoveItem(k);
        }
      }
      return;
    }
    return originalClear();
  };

  // Intercepta Reflect.set para bloquear reassinatura
  try {
    const originalReflectSet = Reflect.set;
    Reflect.set = function(target: any, property: PropertyKey, value: any, receiver?: any): boolean {
      if (target === sessionStorage && (
        property === 'setItem' || 
        property === 'removeItem' || 
        property === 'clear' ||
        property === 'getItem' ||
        property === 'key' ||
        property === 'length'
      )) {
        console.warn('[ANTI-BURLA] Tentativa de injeção no sessionStorage bloqueada');
        return true;
      }
      return originalReflectSet.call(Reflect, target, property, value, receiver);
    };
  } catch (e) {
    // Reflect.set pode não ser modificável em alguns ambientes — ignora silenciosamente
  }
})();

// ---------- PERMISSÕES ----------

export function podeAcessarConfig(cargo: string | null): boolean {
  if (!cargo) return false;
  const c = cargo.toLowerCase().trim();
  return c === 'lider' || c === 'vice';
}

export function podeGerenciarMembros(cargo: string | null): boolean {
  if (!cargo) return false;
  const c = cargo.toLowerCase().trim();
  return c === 'lider' || c === 'vice';
}

export function podeEditarManuais(cargo: string | null, configManualMinistro: boolean): boolean {
  if (!cargo) return false;
  const c = cargo.toLowerCase().trim();
  if (c === 'lider' || c === 'vice') return true;
  if (c === 'ministro' && configManualMinistro) return true;
  return false;
}

// ---------- AUTH CORE ----------

export async function validarChave(chave: string): Promise<AuthResult> {
  if (!FIREBASE_URL) {
    console.error('VITE_FIREBASE_URL não configurado');
    return { autenticado: false };
  }

  try {
    const sessaoRes = await fetch(`${FIREBASE_URL}/sessoes/${chave}.json`);
    const sessao = await sessaoRes.json();

    if (!sessao) {
      return { autenticado: false };
    }

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

  if (chave === 'convidado') {
    sessionStorage.setItem('api_key', 'convidado');
    sessionStorage.setItem('auth_nick', 'Convidado');
    sessionStorage.setItem('auth_cargo', 'convidado');
    sessionStorage.setItem('auth_time', Date.now().toString());

    const url = new URL(window.location.href);
    url.searchParams.delete('key');
    window.history.replaceState({}, '', url.toString());

    return { autenticado: true, nick: 'Convidado', cargo: 'convidado' };
  }

  if (chave && chave !== 'convidado') {
    const resultado = await validarChave(chave);

    if (resultado.autenticado) {
      sessionStorage.setItem('api_key', chave);
      sessionStorage.setItem('auth_nick', resultado.nick!);
      sessionStorage.setItem('auth_cargo', resultado.cargo || '');
      sessionStorage.setItem('auth_time', Date.now().toString());

      const url = new URL(window.location.href);
      url.searchParams.delete('key');
      window.history.replaceState({}, '', url.toString());

      return resultado;
    }
  }

  const savedKey = sessionStorage.getItem('api_key');
  if (savedKey && savedKey !== 'convidado') {
    const authTime = parseInt(sessionStorage.getItem('auth_time') || '0');
    const agora = Date.now();
    if (agora - authTime > 24 * 60 * 60 * 1000) {
      logout();
      return { autenticado: false };
    }

    const resultado = await validarChave(savedKey);
    if (resultado.autenticado) {
      sessionStorage.setItem('auth_time', Date.now().toString());
      return resultado;
    }
    logout();
  }

  if (savedKey === 'convidado') {
    return { autenticado: true, nick: 'Convidado', cargo: 'convidado' };
  }

  return { autenticado: false };
}

export function logout(): void {
  const chave = sessionStorage.getItem('api_key');
  if (chave && chave !== 'convidado' && FIREBASE_URL) {
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

export function isConvidado(): boolean {
  return sessionStorage.getItem('api_key') === 'convidado';
}