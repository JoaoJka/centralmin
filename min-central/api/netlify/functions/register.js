const { jsonResponse, errorResponse, handleOptions, hashPassword, verifyHabboMotto, fbPut, findByField } = require('./utils');

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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { nick, codigo, senha } = JSON.parse(event.body);

    if (!nick || !codigo || !senha) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Nick, código e senha são obrigatórios' })
      };
    }

    if (senha.length < 6) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' })
      };
    }

    // Verifica se já existe usuário aprovado com esse nick
    const existente = await findByField('usuarios', 'nick', nick);
    if (existente) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Nick já cadastrado. Faça login.' })
      };
    }

    // Verifica se já existe pendente com esse nick
    const pendentes = await findByField('pendentes', 'nick', nick);
    if (pendentes) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Cadastro já enviado. Aguarde aprovação.' })
      };
    }

    // Verifica código na missão do Habbo
    const mottoValido = await verifyHabboMotto(nick, codigo);
    if (!mottoValido) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Código não encontrado na missão do Habbo. Verifique e tente novamente.' })
      };
    }

    // Cria hash da senha
    const senhaHash = await hashPassword(senha);

    // Gera UID
    const uid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Salva no nó pendentes
    await fbPut(`pendentes/${uid}`, {
      nick,
      senhaHash,
      codigoVerificacao: codigo,
      criadoEm: Date.now()
    });

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sucesso: true,
        mensagem: 'Cadastro enviado. Aguarde aprovação da liderança.',
        uid
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