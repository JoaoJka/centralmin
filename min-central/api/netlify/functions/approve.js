const { corsResponse, corsError, getCurrentUser, fbGet, fbPut, fbDelete, listItems } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200);
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return corsError('Method not allowed', 405);
  }

  try {
    const currentUser = await getCurrentUser(event);
    if (!currentUser) {
      return corsError('Não autenticado', 401);
    }

    if (!['lider', 'vice'].includes(currentUser.cargo)) {
      return corsError('Apenas Líder e Vice-Líder podem aprovar cadastros', 403);
    }

    if (event.httpMethod === 'GET') {
      const pendentes = await listItems('pendentes');
      return corsResponse({ pendentes });
    }

    const { uid, acao, cargo } = JSON.parse(event.body);

    if (!uid || !acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return corsError('UID e ação (aprovar/rejeitar) são obrigatórios', 400);
    }

    const pendente = await fbGet(`pendentes/${uid}.json`);
    if (!pendente) {
      return corsError('Cadastro pendente não encontrado', 404);
    }

    if (acao === 'rejeitar') {
      await fbDelete(`pendentes/${uid}`);
      return corsResponse({ sucesso: true, mensagem: 'Cadastro rejeitado e removido' });
    }

    const cargoAprovado = cargo || 'estagiario';
    if (!['lider', 'vice', 'ministro', 'estagiario'].includes(cargoAprovado)) {
      return corsError('Cargo inválido', 400);
    }

    await fbPut(`usuarios/${uid}`, {
      nick: pendente.nick,
      senhaHash: pendente.senhaHash,
      cargo: cargoAprovado,
      status: 'aprovado',
      codigoVerificacao: pendente.codigoVerificacao,
      criadoEm: pendente.criadoEm,
      aprovadoPor: currentUser.nick,
      aprovadoEm: Date.now()
    });

    await fbDelete(`pendentes/${uid}`);

    return corsResponse({
      sucesso: true,
      mensagem: `Cadastro de ${pendente.nick} aprovado como ${cargoAprovado}`,
      usuario: { uid, nick: pendente.nick, cargo: cargoAprovado }
    });

  } catch (err) {
    return corsError(err.message, 500);
  }
};