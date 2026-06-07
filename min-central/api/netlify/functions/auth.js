import { validarChave, corsHeaders, jsonResponse, errorResponse, handleOptions } from './utils.js';

export default async (req, context) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const chave = req.headers.get('x-api-key') || new URL(req.url).searchParams.get('key');

  if (!chave) {
    return errorResponse('API Key required', 401);
  }

  try {
    const usuario = await validarChave(chave);

    if (!usuario) {
      return errorResponse('Invalid or expired key', 403);
    }

    return jsonResponse({
      valido: true,
      nick: usuario.nick,
      cargo: usuario.cargo
    });

  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const config = {
  path: '/api/auth'
};