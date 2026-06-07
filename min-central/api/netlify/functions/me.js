const { corsResponse, corsError, getCurrentUser, fbGet } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200);
  }

  if (event.httpMethod !== 'GET') {
    return corsError('Method not allowed', 405);
  }

  try {
    const payload = await getCurrentUser(event);
    if (!payload) {
      return corsError('Não autenticado', 401);
    }

    const usuario = await fbGet(`usuarios/${payload.uid}.json`);
    if (!usuario) {
      return corsError('Usuário não encontrado', 404);
    }

    return corsResponse({
      nick: usuario.nick,
      cargo: usuario.cargo,
      status: usuario.status,
      aprovadoPor: usuario.aprovadoPor,
      aprovadoEm: usuario.aprovadoEm
    });

  } catch (err) {
    return corsError(err.message, 500);
  }
};