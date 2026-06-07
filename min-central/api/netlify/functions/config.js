const { corsResponse, corsError, fbGet, fbPatch, getCurrentUser } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200, event);
  }

  const usuario = await getCurrentUser(event);
  if (!usuario) {
    return corsError('Não autenticado', 401, event);
  }

  try {
    if (event.httpMethod === 'GET') {
      const data = await fbGet('config/main');
      return corsResponse(data || {}, 200, event);
    }

    if (event.httpMethod === 'PUT') {
      const data = JSON.parse(event.body);
      await fbPatch('config/main', data);
      const updated = await fbGet('config/main');
      return corsResponse(updated || {}, 200, event);
    }

    return corsError('Method not allowed', 405, event);

  } catch (err) {
    return corsError(err.message, 500, event);
  }
};