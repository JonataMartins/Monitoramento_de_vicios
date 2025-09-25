const express = require('express');
const router = express.Router();
const Habito = require('../models/habito');
const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken');

// Criação de hábito
router.post('/create', async (req, res) => {
  const { usuario_id, nome_habito, descricao } = req.body;

  try {
    const usuarioExistente = await Usuario.findById(usuario_id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const novoHabito = new Habito({ usuario_id, nome_habito, descricao });
    await novoHabito.save();

    res.status(201).json({ message: 'Hábito criado com sucesso!', habito: novoHabito });
  } catch (err) {
    console.error("Erro ao criar hábito:", err);
    res.status(500).json({ message: 'Erro ao criar hábito!' });
  }
});

// Listagem de hábitos do usuário logado
router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const habitos = await Habito.find({ usuario_id: payload.userId });
    res.json(habitos);
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

module.exports = router;