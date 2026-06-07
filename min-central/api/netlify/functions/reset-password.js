const { corsResponse, corsError, getCurrentUser, hashPassword, findByField, fbPatch } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200, event);
  }

  if (event.httpMethod !== 'POST') {
    return corsError('Method not allowed', 405, event);
  }

  try {
    const currentUser = await getCurrentUser(event);
    if (!currentUser) {
      return corsError('Não autenticado', 401, event);
    }

    if (!['lider', 'vice'].includes(currentUser.cargo)) {
      return corsError('Apenas Líder e Vice-Líder podem alterar senhas', 403, event);
    }

    const { nick, novaSenha } = JSON.parse(event.body);

    if (!nick || !novaSenha) {
      return corsError('Nick e nova senha são obrigatórios', 400, event);
    }

    if (novaSenha.length < 6) {
      return corsError('Senha deve ter no mínimo 6 caracteres', 400, event);
    }

    const usuario = await findByField('usuarios', 'nick', nick);
    if (!usuario) {
      return corsError('Usuário não encontrado', 404, event);
    }

    const senhaHash = await hashPassword(novaSenha);
    await fbPatch(`usuarios/${usuario.fbKey}`, { senhaHash });

    return corsResponse({
      sucesso: true,
      mensagem: `Senha de ${nick} alterada com sucesso`
    }, 200, event);

  } catch (err) {
    return corsError(err.message, 500, event);
  }
};