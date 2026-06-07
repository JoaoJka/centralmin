const { jsonResponse, errorResponse, handleOptions, getCurrentUser, fbGet, fbPut, fbDelete, listItems } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') return errorResponse('Method not allowed', 405);

  try {
    const currentUser = await getCurrentUser(event);
    if (!currentUser) {
      return errorResponse('Não autenticado', 401);
    }

    // Verifica se é Líder ou Vice
    if (!['lider', 'vice'].includes(currentUser.cargo)) {
      return errorResponse('Apenas Líder e Vice-Líder podem aprovar cadastros', 403);
    }

    // GET = listar pendentes
    if (event.httpMethod === 'GET') {
      const pendentes = await listItems('pendentes');
      return jsonResponse({ pendentes });
    }

    // POST = aprovar/rejeitar
    const { uid, acao, cargo } = JSON.parse(event.body);

    if (!uid || !acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return errorResponse('UID e ação (aprovar/rejeitar) são obrigatórios', 400);
    }

    const pendente = await fbGet(`pendentes/${uid}.json`);
    if (!pendente) {
      return errorResponse('Cadastro pendente não encontrado', 404);
    }

    if (acao === 'rejeitar') {
      await fbDelete(`pendentes/${uid}`);
      return jsonResponse({ sucesso: true, mensagem: 'Cadastro rejeitado e removido' });
    }

    // Aprovar
    const cargoAprovado = cargo || 'estagiario';
    if (!['lider', 'vice', 'ministro', 'estagiario'].includes(cargoAprovado)) {
      return errorResponse('Cargo inválido', 400);
    }

    // Move de pendentes para usuarios
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

    return jsonResponse({
      sucesso: true,
      mensagem: `Cadastro de ${pendente.nick} aprovado como ${cargoAprovado}`,
      usuario: {
        uid,
        nick: pendente.nick,
        cargo: cargoAprovado
      }
    });

  } catch (err) {
    return errorResponse(err.message, 500);
  }
};