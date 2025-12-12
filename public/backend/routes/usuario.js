const express = require('express');
const Usuario = require('../models/usuario');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Função para criptografar a senha
function hashSenha(senha) {
  const hash = crypto.createHash('sha256');
  hash.update(senha);
  return hash.digest('hex');
}

const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.userId);

    if (!usuario) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    if (usuario.ultimo_token !== token) {
      return res.status(401).json({ message: 'Sessão expirada. Faça login novamente.' });
    }

    req.usuario = usuario;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
};

router.post('/create', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  try {
    const usuarioExistente = await Usuario.findOne({ nome_usuario });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Usuário já existe!' });
    }

    const senhaCriptografada = hashSenha(senha);
    const novoUsuario = new Usuario({ nome_usuario, senha: senhaCriptografada });
    await novoUsuario.save();

    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ message: 'Erro ao criar usuário!' });
  }
});

router.post('/login', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const senhaCriptografada = hashSenha(senha);

    if (usuario.senha !== senhaCriptografada) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    // 1. Geração do JWT
    const token = jwt.sign(
      { userId: usuario._id, nome_usuario: usuario.nome_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 2. Salvar o Token no banco de dados
    usuario.ultimo_token = token;
    usuario.data_ultimo_login = new Date();
    await usuario.save();

    // 3. Responder com o Token
    res.status(200).json({
      message: 'Login bem-sucedido',
      token,
      usuario: {
        id: usuario._id,
        nome_usuario: usuario.nome_usuario
      }
    });
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ message: 'Erro ao fazer login!' });
  }
});

// --- NOVAS ROTAS PROTEGIDAS (Usando verificarToken e req.usuario) ---

router.get('/verificar', verificarToken, (req, res) => {
  res.status(200).json({
    message: 'Token válido',
    usuario: {
      id: req.usuario._id,
      nome_usuario: req.usuario.nome_usuario
    }
  });
});

// NOVO: Rota para logout (invalida o token no servidor)
router.post('/logout', verificarToken, async (req, res) => {
  const usuario = req.usuario;

  try {
    // Limpa o último token salvo para invalidar a sessão atual
    usuario.ultimo_token = null;
    await usuario.save();

    res.status(200).json({ message: 'Logout bem-sucedido. Token invalidado no servidor.' });
  } catch (err) {
    console.error("Erro ao fazer logout:", err);
    res.status(500).json({ message: 'Erro ao processar logout no servidor.' });
  }
});

router.put('/trocarSenha', verificarToken, async (req, res) => {
  const { senha_antiga, senha_nova } = req.body;
  const usuario = req.usuario;

  try {
    const senhaAntigaCriptografada = hashSenha(senha_antiga);

    if (usuario.senha !== senhaAntigaCriptografada) {
      return res.status(400).json({ message: 'Senha antiga incorreta' });
    }

    const senhaNovaCriptografada = hashSenha(senha_nova);
    usuario.senha = senhaNovaCriptografada;

    // Gera um novo token, invalidando o antigo (força o cliente a usar o novo)
    const novoToken = jwt.sign(
      { userId: usuario._id, nome_usuario: usuario.nome_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    usuario.ultimo_token = novoToken;
    await usuario.save();

    res.status(200).json({
      message: 'Senha alterada com sucesso! Você pode usar o novo token.',
      token: novoToken
    });
  } catch (err) {
    console.error("Erro ao mudar a senha:", err);
    res.status(500).json({ message: 'Erro ao mudar a senha!' });
  }
});

router.delete('/delete', verificarToken, async (req, res) => {
  // MUDANÇA: Usuário obtido via token
  const usuario = req.usuario;

  try {
    // Deleta o usuário baseado no ID obtido no token
    await Usuario.deleteOne({ _id: usuario._id });

    res.status(200).json({ message: 'Usuário excluído com sucesso!' });
  } catch (err) {
    console.error("Erro ao excluir o usuário:", err);
    res.status(500).json({ message: 'Erro ao excluir o usuário!' });
  }
});

router.put('/trocarNome', verificarToken, async (req, res) => {
  const { nome_usuario_novo } = req.body;
  const usuario = req.usuario;
  try {
    // Verifica se o novo nome já existe
    const usuarioExistente = await Usuario.findOne({ nome_usuario: nome_usuario_novo });
    if (usuarioExistente && usuarioExistente._id.toString() !== usuario._id.toString()) {
      return res.status(400).json({ message: 'Nome de usuário já está em uso.' });
    }
    // Atualiza o nome
    usuario.nome_usuario = nome_usuario_novo;
    await usuario.save();
    // Gera um novo token com o nome atualizado
    const novoToken = jwt.sign(
      { userId: usuario._id, nome_usuario: usuario.nome_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    usuario.ultimo_token = novoToken;
    await usuario.save();
    res.status(200).json({
      message: 'Nome de usuário alterado com sucesso!',
      token: novoToken 
    });
  } catch (err) {
    console.error("Erro ao trocar nome de usuário:", err);
    res.status(500).json({ message: 'Erro ao trocar nome de usuário!' });
  }
});

module.exports = router;

// **Rota para Criar Usuário**
/**
 * @swagger
 * /usuario/create:
 *   post:
 *     summary: Cria um novo usuário
 *     description: Cria um novo usuário com nome de usuário e senha criptografada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_usuario:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: "joao123"
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "senha123"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

// **Rota de Login**
/**
 * @swagger
 * /usuario/login:
 *   post:
 *     summary: Realiza o login de um usuário
 *     description: Verifica se o usuário existe e valida a senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_usuario:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: "joao123"
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       400:
 *         description: Senha incorreta
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

// **Rota para Mudar a Senha**
/**
 * @swagger
 * /usuario/trocarSenha:
 *   put:
 *     summary: Muda a senha de um usuário
 *     description: Atualiza a senha do usuário após validação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_usuario:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: "joao123"
 *               senha_antiga:
 *                 type: string
 *                 description: Senha antiga do usuário
 *                 example: "senha123"
 *               senha_nova:
 *                 type: string
 *                 description: Nova senha para o usuário
 *                 example: "novaSenha123"
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Senha antiga incorreta
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */


// **Rota para Excluir Usuário**
/**
 * @swagger
 * /usuario/delete:
 *   delete:
 *     summary: Exclui um usuário
 *     description: Exclui um usuário do sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_usuario:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: "joao123"
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

// **Rota de Logout**
/**
 * @swagger
 * /usuario/logout:
 *   post:
 *     summary: Realiza o logout do usuário
 *     description: Invalida o token atual do usuário no servidor, encerrando a sessão.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout bem-sucedido. O token foi invalidado no servidor.
 *       401:
 *         description: Token inválido, expirado ou não autorizado.
 *       500:
 *         description: Erro interno do servidor
 */

// **Rota para Verificar Token**
/**
 * @swagger
 * /usuario/verificar:
 *   get:
 *     summary: Verifica se o token é válido
 *     description: Retorna os dados do usuário caso o token fornecido seja válido.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido ou expirado
 *       500:
 *         description: Erro interno do servidor
 */

// **Rota para Trocar Nome de Usuário**
/**
 * @swagger
 * /usuario/trocarNome:
 *   put:
 *     summary: Altera o nome de usuário
 *     description: Permite alterar o nome de usuário, validando e atualizando o token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               novo_nome_usuario:
 *                 type: string
 *                 description: Novo nome de usuário
 *                 example: "joao_renomeado"
 *     responses:
 *       200:
 *         description: Nome alterado com sucesso
 *       400:
 *         description: Nome já está em uso
 *       401:
 *         description: Token inválido ou expirado
 *       500:
 *         description: Erro interno do servidor
 */
