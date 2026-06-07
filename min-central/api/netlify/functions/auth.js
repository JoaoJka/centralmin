const { CORS_HEADERS, findUserByNick, verifyPassword, hashPassword, signJWT, verifyJWT, fbPost } = require('./utils.js');

function parseBody(event) {
  if (!event.body) return {};
  if (typeof event.body === 'object') return event.body;
  let bodyStr = event.body;
  if (event.isBase64Encoded) {
    bodyStr = Buffer.from(bodyStr, 'base64').toString('utf8');
  }
  try {
    return JSON.parse(bodyStr);
  } catch {
    return {};
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    const origin = event.headers?.origin || event.headers?.Origin || 'https://centralmin.vercel.app';
    const headers = { ...CORS_HEADERS, 'Access-Control-Allow-Origin': origin };
    return { statusCode: 204, headers, body: '' };
  }

  const path = event.path || '';

  if (path.includes('/login') && event.httpMethod === 'POST') {
    try {
      const body = parseBody(event);
      const { nick, password, senha } = body;
      const passwordToCheck = password || senha;

      if (!nick || !passwordToCheck) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Nick e senha obrigatórios' }) };
      }

      const user = await findUserByNick(nick);
      if (!user) {
        return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Usuário não encontrado' }) };
      }

      if (user.aprovado === false) {
        return { statusCode: 403, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Cadastro aguardando aprovação da liderança' }) };
      }

      const valid = await verifyPassword(passwordToCheck, user.passwordHash);
      if (!valid) {
        return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Senha incorreta' }) };
      }

      const token = await signJWT({ nick: user.nick, cargo: user.cargo, ministry: user.ministry, fbKey: user.fbKey });

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          token,
          user: {
            nick: user.nick,
            cargo: user.cargo,
            ministry: user.ministry,
            avatar: user.avatar,
            modLevel: user.modLevel,
            disponivel: user.disponivel,
            verificado: user.verificado,
            aprovado: user.aprovado,
          },
        }),
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (path.includes('/register') && event.httpMethod === 'POST') {
    try {
      const body = parseBody(event);
      const { nick, codigo, senha, cargo, ministry } = body;

      if (!nick || !codigo || !senha) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Nick, código de verificação e senha são obrigatórios', received: body }) };
      }

      if (senha.length < 6) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }) };
      }

      const existingNick = await findUserByNick(nick);
      if (existingNick) {
        return { statusCode: 409, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Nick já cadastrado' }) };
      }

      const passwordHash = await hashPassword(senha);
      const newUser = {
        nick,
        email: null,
        codigo,
        passwordHash,
        cargo: cargo || 'estagiario',
        ministry: ministry || null,
        avatar: `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${encodeURIComponent(nick)}&size=l&direction=3&head_direction=3&action=std&gesture=sml`,
        modLevel: cargo === 'lider' ? 3 : cargo === 'vice' ? 2 : cargo === 'ministro' ? 1 : 0,
        disponivel: true,
        createdAt: Date.now(),
        verificado: false,
        aprovado: false,
      };

      const result = await fbPost('usuarios', newUser);
      const token = await signJWT({ nick, cargo: newUser.cargo, ministry: newUser.ministry, fbKey: result.name });

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          mensagem: 'Cadastro enviado! Aguardando aprovação da liderança.',
          token,
          user: {
            nick: newUser.nick,
            cargo: newUser.cargo,
            ministry: newUser.ministry,
            avatar: newUser.avatar,
            modLevel: newUser.modLevel,
            disponivel: true,
            verificado: false,
            aprovado: false,
          },
        }),
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (path.includes('/me') && event.httpMethod === 'GET') {
    try {
      const auth = event.headers?.Authorization || event.headers?.authorization;
      if (!auth?.startsWith('Bearer ')) {
        return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Token não fornecido' }) };
      }

      const payload = await verifyJWT(auth.slice(7));
      if (!payload) {
        return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Token inválido' }) };
      }

      const user = await findUserByNick(payload.nick);
      if (!user) {
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Usuário não encontrado' }) };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          user: {
            nick: user.nick,
            cargo: user.cargo,
            ministry: user.ministry,
            avatar: user.avatar,
            modLevel: user.modLevel,
            disponivel: user.disponivel,
            verificado: user.verificado,
            aprovado: user.aprovado,
          },
        }),
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Rota não encontrada' }) };
};