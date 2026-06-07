// ============================================
// UTILS - Helpers compartilhados (Firebase REST + Auth + CORS)
// ============================================

const FIREBASE_URL = process.env.FIREBASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'central-ministerial-secret-key-2026';

// ---------- CORS HEADERS ----------
const CORS_ORIGIN = 'https://centralmin.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}

function handleOptions() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// ---------- LEGACY CORS (para funções que usam { statusCode, headers, body }) ----------
function corsResponse(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json'
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

function corsError(message, statusCode = 400) {
  return corsResponse({ error: message }, statusCode);
}

// ---------- FIREBASE REST HELPERS ----------
async function fbGet(path) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`);
  return res.json();
}

async function fbPut(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.json();
}

async function fbPatch(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return res.json();
}

async function fbPost(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}

async function fbDelete(path) {
  await fetch(`${FIREBASE_URL}/${path}.json`, { method: 'DELETE' });
}

// ---------- LIST / CRUD ----------
async function listItems(path) {
  const data = await fbGet(path);
  if (!data) return [];
  return Object.entries(data).map(([fbKey, item]) => ({ ...item, fbKey }));
}

async function createItem(path, data) {
  const result = await fbPost(path, data);
  return { ...data, fbKey: result.name };
}

async function updateItem(path, id, data) {
  const items = await listItems(path);
  const item = items.find(i => String(i.id) === String(id) || i.fbKey === id);
  if (!item) return null;
  await fbPatch(`${path}/${item.fbKey}`, data);
  return { ...item, ...data };
}

async function deleteItem(path, id) {
  const items = await listItems(path);
  const item = items.find(i => String(i.id) === String(id) || i.fbKey === id);
  if (!item) return false;
  await fbDelete(`${path}/${item.fbKey}`);
  return true;
}

async function findByField(path, field, value) {
  const items = await listItems(path);
  return items.find(i => i[field] === value) || null;
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

function getAuthToken(event) {
  const auth = event.headers?.Authorization || event.headers?.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

async function getCurrentUser(event) {
  const token = getAuthToken(event);
  if (!token) return null;
  return verifyJWT(token);
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

// ---------- HABBO API ----------
async function verifyHabboMotto(nick, codigo) {
  try {
    const res = await fetch(`https://www.habbo.com.br/api/public/users?name=${encodeURIComponent(nick)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.motto === codigo;
  } catch {
    return false;
  }
}

// ---------- VALIDATION ----------
function validateFuncao(data) {
  const errors = [];
  if (!data.nome || typeof data.nome !== 'string') errors.push('nome é obrigatório');
  if (!data.ministry || typeof data.ministry !== 'string') errors.push('ministry é obrigatório');
  if (!['ministro', 'estagiario'].includes(data.nivel)) errors.push('nivel deve ser ministro ou estagiario');
  if (!['semanal', 'mensal'].includes(data.tipo)) errors.push('tipo deve ser semanal ou mensal');
  return errors.length ? errors : null;
}

function validateMember(data) {
  const errors = [];
  if (!data.nick || typeof data.nick !== 'string') errors.push('nick é obrigatório');
  if (!['lider', 'vice', 'ministro', 'estagiario'].includes(data.cargo)) errors.push('cargo inválido');
  if (typeof data.disponivel !== 'boolean') errors.push('disponivel deve ser boolean');
  if (typeof data.modLevel !== 'number') errors.push('modLevel deve ser número');
  return errors.length ? errors : null;
}

function validateEscala(data) {
  const errors = [];
  if (!data.data || typeof data.data !== 'string') errors.push('data é obrigatória');
  if (!data.responsavel || typeof data.responsavel !== 'string') errors.push('responsavel é obrigatório');
  if (!['pendente', 'concluido', 'justificado', 'faltou'].includes(data.status)) errors.push('status inválido');
  return errors.length ? errors : null;
}

module.exports = {
  fbGet, fbPut, fbPatch, fbPost, fbDelete,
  listItems, createItem, updateItem, deleteItem, findByField,
  corsHeaders, jsonResponse, errorResponse, handleOptions,
  corsResponse, corsError,
  signJWT, verifyJWT, getAuthToken, getCurrentUser,
  hashPassword, verifyPassword, verifyHabboMotto,
  validateFuncao, validateMember, validateEscala
};