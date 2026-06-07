// ============================================
// UTILS - Helpers compartilhados
// ============================================

const FIREBASE_URL = process.env.FIREBASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'central-ministerial-secret-key-2026';

// ---------- CORS HEADERS ----------
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

// ---------- FIREBASE REST ----------
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
  const entries = Object.entries(users);
  const found = entries.find(([, u]) => u.nick?.toLowerCase() === nick.toLowerCase());
  return found ? { fbKey: found[0], ...found[1] } : null;
}

async function findUserByEmail(email) {
  const users = await fbGet('usuarios');
  if (!users) return null;
  const entries = Object.entries(users);
  const found = entries.find(([, u]) => u.email?.toLowerCase() === email.toLowerCase());
  return found ? { fbKey: found[0], ...found[1] } : null;
}

// ---------- PASSWORD HASH ----------
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
  const newHashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));
  return newHashB64 === hashB64;
}

// ---------- JWT ----------
async function signJWT(payload) {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${data}.${sigB64}`;
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

// ---------- RESPONSE HELPERS ----------
function corsResponse(body, statusCode = 200) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

function corsError(message, statusCode = 400) {
  return corsResponse({ error: message }, statusCode);
}

module.exports = {
  CORS_HEADERS,
  fbGet, fbPost,
  findUserByNick, findUserByEmail,
  hashPassword, verifyPassword,
  signJWT, verifyJWT,
  corsResponse, corsError,
};