const { jsonResponse, errorResponse, handleOptions, getCurrentUser, fbGet, fbPut, fbDelete, listItems } = require('./utils');

exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const currentUser = await getCurrentUser(event);
    if (!currentUser) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Não autenticado' })
      };
    }

    // Verifica se é Líder ou Vice
    if (!['lider', 'vice'].includes(currentUser.cargo)) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Apenas Líder e Vice-Líder podem aprovar cadastros' })
      };
    }

    // GET = listar pendentes
    if (event.httpMethod === 'GET') {
      const pendentes = await listItems('pendentes');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pendentes })
      };
    }

    // POST = aprovar/rejeitar
    const { uid, acao, cargo } = JSON.parse(event.body);

    if (!uid || !acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'UID e ação (aprovar/rejeitar) são obrigatórios' })
      };
    }

    const pendente = await fbGet(`pendentes/${uid}.json`);
    if (!pendente) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Cadastro pendente não encontrado' })
      };
    }

    if (acao === 'rejeitar') {
      await fbDelete(`pendentes/${uid}`);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sucesso: true, mensagem: 'Cadastro rejeitado e removido' })
      };
    }

    // Aprovar
    const cargoAprovado = cargo || 'estagiario';
    if (!['lider', 'vice', 'ministro', 'estagiario'].includes(cargoAprovado)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Cargo inválido' })
      };
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

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sucesso: true,
        mensagem: `Cadastro de ${pendente.nick} aprovado como ${cargoAprovado}`,
        usuario: {
          uid,
          nick: pendente.nick,
          cargo: cargoAprovado
        }
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};