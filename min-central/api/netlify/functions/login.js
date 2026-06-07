const { corsResponse, corsError, verifyPassword, signJWT, findByField } = require('./utils');

exports.handler = async (event, context) => {
  // CORS preflight - retorna imediatamente
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200);
  }

  if (event.httpMethod !== 'POST') {
    return corsError('Method not allowed', 405);
  }

  try {
    const { nick, senha } = JSON.parse(event.body);

    if (!nick || !senha) {
      return corsError('Nick e senha são obrigatórios', 400);
    }

    // Busca usuário aprovado
    const usuario = await findByField('usuarios', 'nick', nick);
    if (!usuario) {
      // Verifica se está pendente
      const pendente = await findByField('pendentes', 'nick', nick);
      if (pendente) {
        return corsError('Cadastro ainda não aprovado. Aguarde.', 403);
      }
      return corsError('Nick ou senha incorretos', 401);
    }

    // Verifica senha
    const senhaValida = await verifyPassword(senha, usuario.senhaHash);
    if (!senhaValida) {
      return corsError('Nick ou senha incorretos', 401);
    }

    // Gera JWT
    const token = await signJWT({
      uid: usuario.fbKey,
      nick: usuario.nick,
      cargo: usuario.cargo
    });

    return corsResponse({
      sucesso: true,
      token,
      usuario: {
        nick: usuario.nick,
        cargo: usuario.cargo,
        status: usuario.status
      }
    });

  } catch (err) {
    return corsError(err.message, 500);
  }
};