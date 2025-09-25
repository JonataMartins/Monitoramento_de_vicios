const express = require('express');
const router = express.Router();
const Usuario = require('../../backend/models/usuario');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  const user = await Usuario.findOne({ nome_usuario });
  if (!user || user.senha !== senha) {
    return res.status(401).json({ message: 'Usuário ou senha inválidos' });
  }

  const token = jwt.sign(
    { userId: user._id, nome_usuario: user.nome_usuario },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ message: 'Login realizado com sucesso', token });
});

module.exports = router;