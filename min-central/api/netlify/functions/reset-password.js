const { jsonResponse, errorResponse, handleOptions, getCurrentUser, hashPassword, findByField, fbPatch } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const currentUser = await getCurrentUser(event);
    if (!currentUser) {
      return errorResponse('Não autenticado', 401);
    }

    // Verifica se é Líder ou Vice
    if (!['lider', 'vice'].includes(currentUser.cargo)) {
      return errorResponse('Apenas Líder e Vice-Líder podem alterar senhas', 403);
    }

    const { nick, novaSenha } = JSON.parse(event.body);

    if (!nick || !novaSenha) {
      return errorResponse('Nick e nova senha são obrigatórios', 400);
    }

    if (novaSenha.length < 6) {
      return errorResponse('Senha deve ter no mínimo 6 caracteres', 400);
    }

    const usuario = await findByField('usuarios', 'nick', nick);
    if (!usuario) {
      return errorResponse('Usuário não encontrado', 404);
    }

    const senhaHash = await hashPassword(novaSenha);
    await fbPatch(`usuarios/${usuario.fbKey}`, { senhaHash });

    return jsonResponse({
      sucesso: true,
      mensagem: `Senha de ${nick} alterada com sucesso`
    });

  } catch (err) {
    return errorResponse(err.message, 500);
  }
};