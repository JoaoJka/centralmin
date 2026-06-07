const { jsonResponse, errorResponse, handleOptions, verifyPassword, signJWT, findByField } = require('./utils');

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

  if (event.httpMethod !== 'POST') {
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
    const { nick, senha } = JSON.parse(event.body);

    if (!nick || !senha) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Nick e senha são obrigatórios' })
      };
    }

    // Busca usuário aprovado
    const usuario = await findByField('usuarios', 'nick', nick);
    if (!usuario) {
      // Verifica se está pendente
      const pendente = await findByField('pendentes', 'nick', nick);
      if (pendente) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Cadastro ainda não aprovado. Aguarde.' })
        };
      }
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Nick ou senha incorretos' })
      };
    }

    // Verifica senha
    const senhaValida = await verifyPassword(senha, usuario.senhaHash);
    if (!senhaValida) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Nick ou senha incorretos' })
      };
    }

    // Gera JWT
    const token = await signJWT({
      uid: usuario.fbKey,
      nick: usuario.nick,
      cargo: usuario.cargo
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sucesso: true,
        token,
        usuario: {
          nick: usuario.nick,
          cargo: usuario.cargo,
          status: usuario.status
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