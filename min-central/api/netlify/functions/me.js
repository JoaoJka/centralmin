const { jsonResponse, errorResponse, handleOptions, getCurrentUser, fbGet } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return errorResponse('Method not allowed', 405);

  try {
    const payload = await getCurrentUser(event);
    if (!payload) {
      return errorResponse('Não autenticado', 401);
    }

    const usuario = await fbGet(`usuarios/${payload.uid}.json`);
    if (!usuario) {
      return errorResponse('Usuário não encontrado', 404);
    }

    return jsonResponse({
      nick: usuario.nick,
      cargo: usuario.cargo,
      status: usuario.status,
      aprovadoPor: usuario.aprovadoPor,
      aprovadoEm: usuario.aprovadoEm
    });

  } catch (err) {
    return errorResponse(err.message, 500);
  }
};