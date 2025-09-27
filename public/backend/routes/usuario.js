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

// **Middleware para verificar token - ADICIONAR ESTA FUNÇÃO**
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

    res.status(200).json({ message: 'Login bem-sucedido', usuario });
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ message: 'Erro ao fazer login!' });
  }
});

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
router.put('/trocarSenha', async (req, res) => {
  const { nome_usuario, senha_antiga, senha_nova } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const senhaAntigaCriptografada = hashSenha(senha_antiga);

    if (usuario.senha !== senhaAntigaCriptografada) {
      return res.status(400).json({ message: 'Senha antiga incorreta' });
    }

    const senhaNovaCriptografada = hashSenha(senha_nova);
    usuario.senha = senhaNovaCriptografada;
    await usuario.save();

    res.status(200).json({ message: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error("Erro ao mudar a senha:", err);
    res.status(500).json({ message: 'Erro ao mudar a senha!' });
  }
});

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
router.delete('/delete', async (req, res) => {
  const { nome_usuario } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    await Usuario.deleteOne({ nome_usuario });

    res.status(200).json({ message: 'Usuário excluído com sucesso!' });
  } catch (err) {
    console.error("Erro ao excluir o usuário:", err);
    res.status(500).json({ message: 'Erro ao excluir o usuário!' });
  }
});

// **REMOVER AS ROTAS COM JWT POR ENQUANTO - vamos implementar gradualmente**
// Manter apenas as rotas básicas que já funcionam

module.exports = router;