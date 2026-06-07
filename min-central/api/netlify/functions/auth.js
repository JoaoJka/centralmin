// netlify/functions/auth.js
const FIREBASE_URL = process.env.FIREBASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'central-ministerial-secret-key-2026';

const CORS = {
  'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

// ---------- FIREBASE ----------
async function fbGet(path) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`);
  return res.json();
}

async function fbPost(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// ---------- USER LOOKUP ----------
async function findUserByNick(nick) {
  const users = await fbGet('usuarios');
  if (!users) return null;
  const found = Object.entries(users).find(([, u]) => u.nick?.toLowerCase() === nick.toLowerCase());
  return found ? { fbKey: found[0], ...found[1] } : null;
}

async function findUserByEmail(email) {
  const users = await fbGet('usuarios');
  if (!users) return null;
  const found = Object.entries(users).find(([, u]) => u.email?.toLowerCase() === email.toLowerCase());
  return found ? { fbKey: found[0], ...found[1] } : null;
}

// ---------- PASSWORD ----------
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = btoa(String.fromCharCode(...salt));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));
  return `$pbkdf2$100000$${saltB64}$${hashB64}`;
}

async function verifyPassword(password, hash) {
  const [, , iterations, saltB64, hashB64] = hash.split('$');
  const encoder = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: parseInt(iterations), hash: 'SHA-256' }, key, 256);
  return btoa(String.fromCharCode(...new Uint8Array(derived))) === hashB64;
}

// ---------- JWT ----------
async function signJWT(payload) {
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadB64 = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return `${data}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

async function verifyJWT(token) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const encoder = new TextEncoder();
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey('raw', encoder.encode(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
    if (!valid) return null;
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- HANDLER ----------
exports.handler = async (event, context) => {
  // PREFLIGHT CORS - SEMPRE PRIMEIRO
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  }

  const path = event.path || '';

  // LOGIN
  if (path.includes('/login') && event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { nick, password } = body;

      if (!nick || !password) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Nick e senha obrigatórios' }) };
      }

      const user = await findUserByNick(nick);
      if (!user) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Usuário não encontrado' }) };
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Senha incorreta' }) };
      }

      const token = await signJWT({ nick: user.nick, cargo: user.cargo, ministry: user.ministry, fbKey: user.fbKey });

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          token,
          user: {
            nick: user.nick,
            cargo: user.cargo,
            ministry: user.ministry,
            avatar: user.avatar,
            modLevel: user.modLevel,
            disponivel: user.disponivel,
          },
        }),
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
    }
  }

  // REGISTER
  if (path.includes('/register') && event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { nick, email, password, cargo, ministry } = body;

      if (!nick || !email || !password || !cargo) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Nick, email, senha e cargo são obrigatórios' }) };
      }

      const existingNick = await findUserByNick(nick);
      if (existingNick) {
        return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Nick já cadastrado' }) };
      }

      const existingEmail = await findUserByEmail(email);
      if (existingEmail) {
        return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Email já cadastrado' }) };
      }

      const passwordHash = await hashPassword(password);
      const newUser = {
        nick,
        email: email.toLowerCase(),
        passwordHash,
        cargo,
        ministry: ministry || null,
        avatar: `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${encodeURIComponent(nick)}&size=l&direction=3&head_direction=3&action=std&gesture=sml`,
        modLevel: cargo === 'lider' ? 3 : cargo === 'vice' ? 2 : cargo === 'ministro' ? 1 : 0,
        disponivel: true,
        createdAt: Date.now(),
        verificado: false,
      };

      const result = await fbPost('usuarios', newUser);
      const token = await signJWT({ nick, cargo, ministry, fbKey: result.name });

      return {
        statusCode: 201,
        headers: CORS,
        body: JSON.stringify({
          token,
          user: {
            nick: newUser.nick,
            cargo: newUser.cargo,
            ministry: newUser.ministry,
            avatar: newUser.avatar,
            modLevel: newUser.modLevel,
            disponivel: true,
            verificado: false,
          },
        }),
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
    }
  }

  // ME (validar token)
  if (path.includes('/me') && event.httpMethod === 'GET') {
    try {
      const auth = event.headers?.Authorization || event.headers?.authorization;
      if (!auth?.startsWith('Bearer ')) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Token não fornecido' }) };
      }

      const payload = await verifyJWT(auth.slice(7));
      if (!payload) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Token inválido ou expirado' }) };
      }

      const user = await findUserByNick(payload.nick);
      if (!user) {
        return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Usuário não encontrado' }) };
      }

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          user: {
            nick: user.nick,
            cargo: user.cargo,
            ministry: user.ministry,
            avatar: user.avatar,
            modLevel: user.modLevel,
            disponivel: user.disponivel,
            verificado: user.verificado,
          },
        }),
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Rota não encontrada' }) };
};