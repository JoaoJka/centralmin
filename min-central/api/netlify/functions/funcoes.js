import {
  validarChave, listItems, createItem, updateItem, deleteItem, nextNumericId,
  jsonResponse, errorResponse, handleOptions, validateFuncao, podeAcessarAdminBackend
} from './utils.js';

export default async (req, context) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const chave = req.headers.get('x-api-key') || new URL(req.url).searchParams.get('key');
  const usuario = chave ? await validarChave(chave) : null;

  if (!usuario) {
    return errorResponse('Unauthorized', 403);
  }

  // GET permite todos autenticados, mas POST/PUT/DELETE exige admin
  const isAdmin = podeAcessarAdminBackend(usuario.cargo);

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  try {
    switch (req.method) {
      case 'GET': {
        const funcoes = await listItems('funcoes');
        return jsonResponse(funcoes);
      }

      case 'POST': {
        if (!isAdmin) {
          return errorResponse('Acesso negado. Apenas Líder e Vice-Líder podem criar funções.', 403);
        }
        const data = await req.json();
        const errors = validateFuncao(data);
        if (errors) return errorResponse(errors.join(', '), 400);

        const newId = data.id || await nextNumericId('funcoes');
        const created = await createItem('funcoes', { ...data, id: newId });
        return jsonResponse(created, 201);
      }

      case 'PUT': {
        if (!isAdmin) {
          return errorResponse('Acesso negado. Apenas Líder e Vice-Líder podem editar funções.', 403);
        }
        const data = await req.json();
        const updated = await updateItem('funcoes', id, data);
        if (!updated) return errorResponse('Record not found', 404);
        return jsonResponse(updated);
      }

      case 'DELETE': {
        if (!isAdmin) {
          return errorResponse('Acesso negado. Apenas Líder e Vice-Líder podem excluir funções.', 403);
        }
        const deleted = await deleteItem('funcoes', id);
        if (!deleted) return errorResponse('Record not found', 404);
        return new Response('', { status: 204, headers: corsHeaders });
      }

      default:
        return errorResponse('Method not allowed', 405);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};

export const config = {
  path: ['/api/funcoes', '/api/funcoes/*']
};