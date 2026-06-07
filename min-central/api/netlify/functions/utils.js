// ============================================
// AUTH - Login e Registro
// ============================================

const {
  fbGet, fbPost,
  jsonResponse, errorResponse, handleOptions,
  signJWT, hashPassword, verifyPassword, verifyHabboMotto
} = require('./utils.js');

// ---------- HELPERS ----------
async function findUserByNick(nick) {
  const users = await fbGet('usuarios');
  if (!users) return null;
  const entries = Object.entries(users);
  const found = entries.find(([, u]) => u.nick?.toLowerCase() === nick.toLowerCase());
  return found ? { fbKey: found[0], ...found[1] } : null;
}

async function findUserByEmail(email) {
  const users = await fbGet('usuarios');
  if (!users) return null;
  const entries = Object.entries(users);
  const found = entries.find(([, u]) => u.email?.toLowerCase() === email.toLowerCase());
  return found ? { fbKey: found[0], ...found[1] } : null;
}

function generateVerificationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ---------- HANDLER PRINCIPAL ----------
exports.handler = async (event, context) => {
  // 1. PREFLIGHT CORS - SEMPRE PRIMEIRO
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  const path = event.path || event.rawUrl || '';
  const body = event.body ? JSON.parse(event.body) : {};

  // ---------- LOGIN ----------
  if (event.httpMethod === 'POST' && path.includes('/login')) {
    try {
      const { nick, password } = body;

      if (!nick || !password) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Nick e senha são obrigatórios' }),
        };
      }

      const user = await findUserByNick(nick);
      if (!user) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Usuário não encontrado' }),
        };
      }

      const validPassword = await verifyPassword(password, user.passwordHash);
      if (!validPassword) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Senha incorreta' }),
        };
      }

      const token = await signJWT({
        nick: user.nick,
        cargo: user.cargo,
        ministry: user.ministry,
        fbKey: user.fbKey
      });

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          user: {
            nick: user.nick,
            cargo: user.cargo,
            ministry: user.ministry,
            avatar: user.avatar,
            modLevel: user.modLevel,
            disponivel: user.disponivel
          }
        }),
      };

    } catch (err) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ---------- REGISTRO ----------
  if (event.httpMethod === 'POST' && path.includes('/register')) {
    try {
      const { nick, email, password, cargo, ministry } = body;

      // Validação básica
      if (!nick || !email || !password || !cargo) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Nick, email, senha e cargo são obrigatórios' }),
        };
      }

      // Verificar se nick já existe
      const existingNick = await findUserByNick(nick);
      if (existingNick) {
        return {
          statusCode: 409,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Nick já cadastrado' }),
        };
      }

      // Verificar se email já existe
      const existingEmail = await findUserByEmail(email);
      if (existingEmail) {
        return {
          statusCode: 409,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Email já cadastrado' }),
        };
      }

      // Hash da senha
      const passwordHash = await hashPassword(password);

      // Criar usuário
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
        codigoVerificacao: generateVerificationCode()
      };

      const result = await fbPost('usuarios', newUser);

      const token = await signJWT({
        nick: newUser.nick,
        cargo: newUser.cargo,
        ministry: newUser.ministry,
        fbKey: result.name
      });

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          user: {
            nick: newUser.nick,
            cargo: newUser.cargo,
            ministry: newUser.ministry,
            avatar: newUser.avatar,
            modLevel: newUser.modLevel,
            disponivel: newUser.disponivel,
            verificado: newUser.verificado
          }
        }),
      };

    } catch (err) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ---------- VERIFICAR HABBO (opcional) ----------
  if (event.httpMethod === 'POST' && path.includes('/verify-habbo')) {
    try {
      const { nick, codigo } = body;
      const valid = await verifyHabboMotto(nick, codigo);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ valido: valid }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ---------- VALIDAR TOKEN ----------
  if (event.httpMethod === 'GET' && path.includes('/me')) {
    try {
      const auth = event.headers?.Authorization || event.headers?.authorization;
      if (!auth?.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Token não fornecido' }),
        };
      }

      const { verifyJWT } = require('./utils.js');
      const payload = await verifyJWT(auth.slice(7));
      if (!payload) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Token inválido ou expirado' }),
        };
      }

      const user = await findUserByNick(payload.nick);
      if (!user) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Usuário não encontrado' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            nick: user.nick,
            cargo: user.cargo,
            ministry: user.ministry,
            avatar: user.avatar,
            modLevel: user.modLevel,
            disponivel: user.disponivel,
            verificado: user.verificado
          }
        }),
      };

    } catch (err) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // Rota não encontrada
  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': 'https://centralmin.vercel.app',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ error: 'Rota não encontrada' }),
  };
};