const { corsResponse, corsError, hashPassword, verifyHabboMotto, fbPut, findByField } = require('./utils');

exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS' || event.httpMethod === 'options') {
    return corsResponse('', 200);
  }

  if (event.httpMethod !== 'POST') {
    return corsError('Method not allowed', 405);
  }

  try {
    const { nick, codigo, senha } = JSON.parse(event.body);

    if (!nick || !codigo || !senha) {
      return corsError('Nick, código e senha são obrigatórios', 400);
    }

    if (senha.length < 6) {
      return corsError('Senha deve ter no mínimo 6 caracteres', 400);
    }

    // Verifica se já existe usuário aprovado com esse nick
    const existente = await findByField('usuarios', 'nick', nick);
    if (existente) {
      return corsError('Nick já cadastrado. Faça login.', 409);
    }

    // Verifica se já existe pendente com esse nick
    const pendentes = await findByField('pendentes', 'nick', nick);
    if (pendentes) {
      return corsError('Cadastro já enviado. Aguarde aprovação.', 409);
    }

    // Verifica código na missão do Habbo
    const mottoValido = await verifyHabboMotto(nick, codigo);
    if (!mottoValido) {
      return corsError('Código não encontrado na missão do Habbo. Verifique e tente novamente.', 400);
    }

    // Cria hash da senha
    const senhaHash = await hashPassword(senha);

    // Gera UID
    const uid = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Salva no nó pendentes
    await fbPut(`pendentes/${uid}`, {
      nick,
      senhaHash,
      codigoVerificacao: codigo,
      criadoEm: Date.now()
    });

    return corsResponse({
      sucesso: true,
      mensagem: 'Cadastro enviado. Aguarde aprovação da liderança.',
      uid
    }, 201);

  } catch (err) {
    return corsError(err.message, 500);
  }
};