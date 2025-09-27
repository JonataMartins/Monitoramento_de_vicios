const express = require('express');
const Habito = require('../models/habito');
const Usuario = require('../models/usuario');
const router = express.Router();

// **Rota para Criar Hábito**
router.post('/create', async (req, res) => {
  const { nome_usuario, nome_habito, descricao } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const novoHabito = new Habito({ 
      usuario_id: usuario._id, 
      nome_habito, 
      descricao 
    });
    await novoHabito.save();

    res.status(201).json({ message: 'Hábito criado com sucesso!', habito: novoHabito });
  } catch (err) {
    console.error("Erro ao criar hábito:", err);
    res.status(500).json({ message: 'Erro ao criar hábito!' });
  }
});

// **Rota para Listar Hábitos do Usuário**
router.post('/', async (req, res) => {
  const { nome_usuario } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habitos = await Habito.find({ usuario_id: usuario._id });
    res.json(habitos);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar hábitos' });
  }
});

// **Rota para Excluir Hábito**
router.delete('/delete', async (req, res) => {
  const { nome_usuario, habito_id } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habito = await Habito.findOne({ _id: habito_id, usuario_id: usuario._id });
    if (!habito) {
      return res.status(404).json({ message: 'Hábito não encontrado' });
    }

    await Habito.findByIdAndDelete(habito_id);
    res.json({ message: 'Hábito deletado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar hábito' });
  }
});

module.exports = router;