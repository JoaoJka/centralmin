const { jsonResponse, errorResponse, handleOptions, hashPassword, verifyHabboMotto, fbPut, findByField } = require('./utils');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { nick, codigo, senha } = JSON.parse(event.body);

    if (!nick || !codigo || !senha) {
      return errorResponse('Nick, código e senha são obrigatórios', 400);
    }

    if (senha.length < 6) {
      return errorResponse('Senha deve ter no mínimo 6 caracteres', 400);
    }

    // Verifica se já existe usuário aprovado com esse nick
    const existente = await findByField('usuarios', 'nick', nick);
    if (existente) {
      return errorResponse('Nick já cadastrado. Faça login.', 409);
    }

    // Verifica se já existe pendente com esse nick
    const pendentes = await findByField('pendentes', 'nick', nick);
    if (pendentes) {
      return errorResponse('Cadastro já enviado. Aguarde aprovação.', 409);
    }

    // Verifica código na missão do Habbo
    const mottoValido = await verifyHabboMotto(nick, codigo);
    if (!mottoValido) {
      return errorResponse('Código não encontrado na missão do Habbo. Verifique e tente novamente.', 400);
    }

    // Cria hash da senha
    const senhaHash = await hashPassword(senha);

    // Gera UID
    const uid = crypto.randomUUID();

    // Salva no nó pendentes
    await fbPut(`pendentes/${uid}`, {
      nick,
      senhaHash,
      codigoVerificacao: codigo,
      criadoEm: Date.now()
    });

    return jsonResponse({
      sucesso: true,
      mensagem: 'Cadastro enviado. Aguarde aprovação da liderança.',
      uid
    }, 201);

  } catch (err) {
    return errorResponse(err.message, 500);
  }
};