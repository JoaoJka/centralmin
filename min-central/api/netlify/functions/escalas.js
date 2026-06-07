const { corsResponse, corsError, listItems, createItem, updateItem, deleteItem, validateEscala, getCurrentUser } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200);
  }

  const usuario = await getCurrentUser(event);
  if (!usuario) {
    return corsError('Não autenticado', 401);
  }

  const url = new URL(event.rawUrl || `https://localhost${event.path}`);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  try {
    switch (event.httpMethod) {
      case 'GET': {
        const escalas = await listItems('escalas');
        return corsResponse(escalas);
      }

      case 'POST': {
        const data = JSON.parse(event.body);
        const errors = validateEscala(data);
        if (errors) return corsError(errors.join(', '), 400);

        const newId = data.id || String(Date.now());
        const created = await createItem('escalas', { ...data, id: newId });
        return corsResponse(created, 201);
      }

      case 'PUT': {
        const data = JSON.parse(event.body);
        const updated = await updateItem('escalas', id, data);
        if (!updated) return corsError('Record not found', 404);
        return corsResponse(updated);
      }

      case 'DELETE': {
        const deleted = await deleteItem('escalas', id);
        if (!deleted) return corsError('Record not found', 404);
        return corsResponse('', 204);
      }

      default:
        return corsError('Method not allowed', 405);
    }
  } catch (err) {
    return corsError(err.message, 500);
  }
};