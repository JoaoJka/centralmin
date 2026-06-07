const { jsonResponse, errorResponse, handleOptions, verifyPassword, signJWT, findByField } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { nick, senha } = JSON.parse(event.body);

    if (!nick || !senha) {
      return errorResponse('Nick e senha são obrigatórios', 400);
    }

    // Busca usuário aprovado
    const usuario = await findByField('usuarios', 'nick', nick);
    if (!usuario) {
      // Verifica se está pendente
      const pendente = await findByField('pendentes', 'nick', nick);
      if (pendente) {
        return errorResponse('Cadastro ainda não aprovado. Aguarde.', 403);
      }
      return errorResponse('Nick ou senha incorretos', 401);
    }

    // Verifica senha
    const senhaValida = await verifyPassword(senha, usuario.senhaHash);
    if (!senhaValida) {
      return errorResponse('Nick ou senha incorretos', 401);
    }

    // Gera JWT
    const token = await signJWT({
      uid: usuario.fbKey,
      nick: usuario.nick,
      cargo: usuario.cargo
    });

    return jsonResponse({
      sucesso: true,
      token,
      usuario: {
        nick: usuario.nick,
        cargo: usuario.cargo,
        status: usuario.status
      }
    });

  } catch (err) {
    return errorResponse(err.message, 500);
  }
};