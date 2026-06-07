const { corsResponse, corsError, findUserByNick, verifyPassword, signJWT } = require('./utils.js');

exports.handler = async (event, context) => {
  // PREFLIGHT CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return corsError('Method not allowed', 405);
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { nick, password } = body;

    if (!nick || !password) {
      return corsError('Nick e senha são obrigatórios', 400);
    }

    const user = await findUserByNick(nick);
    if (!user) {
      return corsError('Usuário não encontrado', 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return corsError('Senha incorreta', 401);
    }

    const token = await signJWT({
      nick: user.nick,
      cargo: user.cargo,
      ministry: user.ministry,
      fbKey: user.fbKey,
    });

    return corsResponse({
      token,
      user: {
        nick: user.nick,
        cargo: user.cargo,
        ministry: user.ministry,
        avatar: user.avatar,
        modLevel: user.modLevel,
        disponivel: user.disponivel,
      },
    });

  } catch (err) {
    return corsError(err.message, 500);
  }
};