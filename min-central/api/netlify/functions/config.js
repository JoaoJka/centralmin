import { validarChave, fbGet, fbPatch, jsonResponse, errorResponse, handleOptions, podeAcessarAdminBackend } from './utils.js';

export default async (req, context) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const chave = req.headers.get('x-api-key') || new URL(req.url).searchParams.get('key');
  const usuario = chave ? await validarChave(chave) : null;

  if (!usuario) {
    return errorResponse('Unauthorized', 403);
  }

  const isAdmin = podeAcessarAdminBackend(usuario.cargo);

  try {
    if (req.method === 'GET') {
      const data = await fbGet('config/main');
      return jsonResponse(data || {});
    }

    if (req.method === 'PUT') {
      if (!isAdmin) {
        return errorResponse('Acesso negado. Apenas Líder e Vice-Líder podem alterar configurações.', 403);
      }
      const data = await req.json();
      await fbPatch('config/main', data);
      const updated = await fbGet('config/main');
      return jsonResponse(updated || {});
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const config = {
  path: ['/api/config']
};