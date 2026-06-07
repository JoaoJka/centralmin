// ============================================
// UTILS - Helpers compartilhados (Firebase REST + Validação)
// ============================================

const FIREBASE_URL = Netlify.env.get('FIREBASE_URL');

// ---------- FIREBASE REST HELPERS ----------

export async function fbGet(path) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`);
  return res.json();
}

export async function fbPut(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fbPatch(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fbPost(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fbDelete(path) {
  await fetch(`${FIREBASE_URL}/${path}.json`, { method: 'DELETE' });
}

// ---------- LIST / CRUD ----------

export async function listItems(path) {
  const data = await fbGet(path);
  if (!data) return [];
  return Object.entries(data).map(([fbKey, item]) => ({ ...item, fbKey }));
}

export async function createItem(path, data) {
  const result = await fbPost(path, data);
  return { ...data, fbKey: result.name };
}

export async function updateItem(path, id, data) {
  const items = await listItems(path);
  const item = items.find(i => String(i.id) === String(id));
  if (!item) return null;
  await fbPatch(`${path}/${item.fbKey}`, data);
  return { ...item, ...data };
}

export async function deleteItem(path, id) {
  const items = await listItems(path);
  const item = items.find(i => String(i.id) === String(id));
  if (!item) return false;
  await fbDelete(`${path}/${item.fbKey}`);
  return true;
}

export async function nextNumericId(path) {
  const items = await listItems(path);
  const ids = items.map(i => Number(i.id)).filter(id => Number.isInteger(id) && id > 0);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

// ---------- AUTH ----------

export async function validarChave(chave) {
  const sessao = await fbGet(`sessoes/${chave}`);
  if (!sessao) return null;

  const userData = await fbGet(`chaves_api/${encodeURIComponent(sessao.nick)}`);
  if (!userData || !userData.ativo || userData.chave !== chave) return null;

  return { nick: sessao.nick, cargo: userData.cargo };
}

// ---------- CORS HEADERS ----------

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
  'Content-Type': 'application/json'
};

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}

export function handleOptions() {
  return new Response('', { status: 200, headers: corsHeaders });
}

// ---------- ZOD-LIKE VALIDATION (simples) ----------

export function validateFuncao(data) {
  const errors = [];
  if (!data.nome || typeof data.nome !== 'string') errors.push('nome é obrigatório');
  if (!data.ministry || typeof data.ministry !== 'string') errors.push('ministry é obrigatório');
  if (!['ministro', 'estagiario'].includes(data.nivel)) errors.push('nivel deve ser ministro ou estagiario');
  if (!['semanal', 'mensal'].includes(data.tipo)) errors.push('tipo deve ser semanal ou mensal');
  return errors.length ? errors : null;
}

export function validateMember(data) {
  const errors = [];
  if (!data.nick || typeof data.nick !== 'string') errors.push('nick é obrigatório');
  if (!['lider', 'vice', 'ministro', 'estagiario'].includes(data.cargo)) errors.push('cargo inválido');
  if (typeof data.disponivel !== 'boolean') errors.push('disponivel deve ser boolean');
  if (typeof data.modLevel !== 'number') errors.push('modLevel deve ser número');
  return errors.length ? errors : null;
}

export function validateEscala(data) {
  const errors = [];
  if (!data.data || typeof data.data !== 'string') errors.push('data é obrigatória');
  if (!data.responsavel || typeof data.responsavel !== 'string') errors.push('responsavel é obrigatório');
  if (!['pendente', 'concluido', 'justificado', 'faltou'].includes(data.status)) errors.push('status inválido');
  return errors.length ? errors : null;
}

export function validateConfig(data) {
  // Config é mais flexível, aceita qualquer campo
  return null;
}