const { corsResponse, corsError, findUserByNick, findUserByEmail, hashPassword, signJWT, fbPost } = require('./utils.js');

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
    const { nick, email, password, cargo, ministry } = body;

    if (!nick || !email || !password || !cargo) {
      return corsError('Nick, email, senha e cargo são obrigatórios', 400);
    }

    const existingNick = await findUserByNick(nick);
    if (existingNick) {
      return corsError('Nick já cadastrado', 409);
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return corsError('Email já cadastrado', 409);
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      nick,
      email: email.toLowerCase(),
      passwordHash,
      cargo,
      ministry: ministry || null,
      avatar: `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${encodeURIComponent(nick)}&size=l&direction=3&head_direction=3&action=std&gesture=sml`,
      modLevel: cargo === 'lider' ? 3 : cargo === 'vice' ? 2 : cargo === 'ministro' ? 1 : 0,
      disponivel: true,
      createdAt: Date.now(),
      verificado: false,
    };

    const result = await fbPost('usuarios', newUser);
    const token = await signJWT({
      nick: newUser.nick,
      cargo: newUser.cargo,
      ministry: newUser.ministry,
      fbKey: result.name,
    });

    return corsResponse({
      token,
      user: {
        nick: newUser.nick,
        cargo: newUser.cargo,
        ministry: newUser.ministry,
        avatar: newUser.avatar,
        modLevel: newUser.modLevel,
        disponivel: newUser.disponivel,
        verificado: newUser.verificado,
      },
    }, 201);

  } catch (err) {
    return corsError(err.message, 500);
  }
};