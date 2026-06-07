
const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// Verifica se as variáveis estão configuradas
if (!JWT_SECRET) {
  console.error('ERRO: JWT_SECRET não configurado no Netlify Environment Variables');
}
if (!FIREBASE_URL) {
  console.error('ERRO: FIREBASE_URL não configurado no Netlify Environment Variables');
}
if (!FIREBASE_API_KEY) {
  console.error('ERRO: FIREBASE_API_KEY não configurado no Netlify Environment Variables');
}

// ============================================
// CORS
// ============================================
const ALLOWED_ORIGINS = [
  'https://centralmin.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

function getOrigin(event) {
  return event.headers?.origin || event.headers?.Origin || ALLOWED_ORIGINS[0];
}

function getCorsHeaders(event) {
  const origin = getOrigin(event);
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };
}

function corsResponse(data, statusCode = 200, event) {
  return {
    statusCode,
    headers: {
      ...getCorsHeaders(event || { headers: {} }),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}

function corsError(message, statusCode = 400, event) {
  return corsResponse({ error: message }, statusCode, event);
}

// ============================================
// FIREBASE
// ============================================
async function fbGet(path) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  return res.json();
}

async function fbPut(path, data) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function fbPatch(path, data) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function fbPost(path, data) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function fbDelete(path) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  await fetch(url, { method: 'DELETE' });
}

// ============================================
// CRUD HELPERS
// ============================================
async function listItems(collection) {
  const data = await fbGet(collection);
  if (!data) return [];
  return Object.entries(data).map(([fbKey, item]) => ({ ...item, fbKey }));
}

async function createItem(collection, data) {
  const result = await fbPost(collection, data);
  return { ...data, fbKey: result.name };
}

async function updateItem(collection, id, data) {
  const items = await fbGet(collection);
  if (!items) return null;
  
  const entry = Object.entries(items).find(([_, item]) => item.id === id);
  if (!entry) return null;
  
  const [fbKey] = entry;
  await fbPatch(`${collection}/${fbKey}`, data);
  return { ...items[fbKey], ...data, fbKey };
}

async function deleteItem(collection, id) {
  const items = await fbGet(collection);
  if (!items) return null;
  
  const entry = Object.entries(items).find(([_, item]) => item.id === id);
  if (!entry) return null;
  
  const [fbKey] = entry;
  await fbDelete(`${collection}/${fbKey}`);
  return true;
}

async function nextNumericId(collection) {
  const items = await listItems(collection);
  if (items.length === 0) return 1;
  const maxId = Math.max(...items.map(i => parseInt(i.id) || 0));
  return maxId + 1;
}

async function findByField(collection, field, value) {
  const items = await listItems(collection);
  return items.find(item => item[field] === value) || null;
}

// ============================================
// AUTH / JWT - USA A CHAVE SECRETA DO NETLIFY
// ============================================
async function signJWT(payload) {
  const encoder = new TextEncoder();
  const secret = encoder.encode(JWT_SECRET);
  
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ 
    ...payload, 
    iat: Math.floor(Date.now() / 1000), 
    exp: Math.floor(Date.now() / 1000) + 86400 
  }));
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    encoder.encode(`${header}.${body}`)
  );
  
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${header}.${body}.${sig}`;
}

async function verifyJWT(token) {
  try {
    const [header, body, signature] = token.split('.');
    const payload = JSON.parse(atob(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}

async function getCurrentUser(event) {
  const auth = event.headers?.Authorization || event.headers?.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  
  const payload = await verifyJWT(auth.slice(7));
  if (!payload) return null;
  
  const user = await findByField('usuarios', 'nick', payload.nick);
  if (!user) return null;
  
  return { ...user, uid: user.fbKey };
}

async function findUserByNick(nick) {
  return await findByField('usuarios', 'nick', nick);
}

async function findUserByEmail(email) {
  return await findByField('usuarios', 'email', email);
}

// ============================================
// VALIDATORS
// ============================================
function validateMember(data) {
  const errors = [];
  if (!data.nick) errors.push('Nick é obrigatório');
  if (!data.cargo) errors.push('Cargo é obrigatório');
  return errors.length ? errors : null;
}

function validateEscala(data) {
  const errors = [];
  if (!data.nome) errors.push('Nome é obrigatório');
  if (!data.periodo) errors.push('Período é obrigatório');
  return errors.length ? errors : null;
}

function validateFuncao(data) {
  const errors = [];
  if (!data.nome) errors.push('Nome é obrigatório');
  if (!data.tipo) errors.push('Tipo é obrigatório');
  return errors.length ? errors : null;
}

// ============================================
// LEGACY CORS (para auth.js que usa CORS_HEADERS)
// ============================================
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  getCorsHeaders,
  corsResponse,
  corsError,
  CORS_HEADERS,
  fbGet,
  fbPut,
  fbPatch,
  fbPost,
  fbDelete,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  nextNumericId,
  findByField,
  signJWT,
  verifyJWT,
  hashPassword,
  verifyPassword,
  getCurrentUser,
  findUserByNick,
  findUserByEmail,
  validateMember,
  validateEscala,
  validateFuncao
};