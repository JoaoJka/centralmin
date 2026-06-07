const { corsResponse, corsError, listItems, createItem, updateItem, deleteItem, nextNumericId, validateFuncao, getCurrentUser } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200, event);
  }

  const usuario = await getCurrentUser(event);
  if (!usuario) {
    return corsError('Não autenticado', 401, event);
  }

  const url = new URL(event.rawUrl || `https://localhost${event.path}`);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  try {
    switch (event.httpMethod) {
      case 'GET': {
        const funcoes = await listItems('funcoes');
        return corsResponse(funcoes, 200, event);
      }

      case 'POST': {
        const data = JSON.parse(event.body);
        const errors = validateFuncao(data);
        if (errors) return corsError(errors.join(', '), 400, event);

        const newId = data.id || await nextNumericId('funcoes');
        const created = await createItem('funcoes', { ...data, id: newId });
        return corsResponse(created, 201, event);
      }

      case 'PUT': {
        const data = JSON.parse(event.body);
        const updated = await updateItem('funcoes', id, data);
        if (!updated) return corsError('Record not found', 404, event);
        return corsResponse(updated, 200, event);
      }

      case 'DELETE': {
        const deleted = await deleteItem('funcoes', id);
        if (!deleted) return corsError('Record not found', 404, event);
        return corsResponse('', 204, event);
      }

      default:
        return corsError('Method not allowed', 405, event);
    }
  } catch (err) {
    return corsError(err.message, 500, event);
  }
};