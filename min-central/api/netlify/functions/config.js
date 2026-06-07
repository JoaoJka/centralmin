const { corsResponse, corsError, fbGet, fbPatch, getCurrentUser } = require('./auth/utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200);
  }

  const usuario = await getCurrentUser(event);
  if (!usuario) {
    return corsError('Não autenticado', 401);
  }

  try {
    if (event.httpMethod === 'GET') {
      const data = await fbGet('config/main');
      return corsResponse(data || {});
    }

    if (event.httpMethod === 'PUT') {
      const data = JSON.parse(event.body);
      await fbPatch('config/main', data);
      const updated = await fbGet('config/main');
      return corsResponse(updated || {});
    }

    return corsError('Method not allowed', 405);

  } catch (err) {
    return corsError(err.message, 500);
  }
};