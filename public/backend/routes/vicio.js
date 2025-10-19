const express = require('express');
const Vicio = require('../models/vicio');
const Usuario = require('../models/usuario');
const router = express.Router();

// Criar vício
router.post('/create', async (req, res) => {
  const { nome_usuario, nome_habito, descricao } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const novoVicio = new Vicio({ 
      usuario_id: usuario._id, 
      nome_habito, 
      descricao 
    });
    await novoVicio.save();

    res.status(201).json({ message: 'Vício criado com sucesso!', vicio: novoVicio });
  } catch (err) {
    console.error("Erro ao criar vício:", err);
    res.status(500).json({ message: 'Erro ao criar vício!' });
  }
});

// Listar vícios do usuário
router.post('/', async (req, res) => {
  const { nome_usuario } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const vicios = await Vicio.find({ usuario_id: usuario._id });
    res.json(vicios);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar vícios' });
  }
});

// Editar vício
router.put('/:id', async (req, res) => {
  const { nome_usuario, nome_habito, descricao } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const vicio = await Vicio.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!vicio) {
      return res.status(404).json({ message: 'Vício não encontrado' });
    }

    vicio.nome_habito = nome_habito || vicio.nome_habito;
    vicio.descricao = descricao || vicio.descricao;
    await vicio.save();

    res.json({ message: 'Vício atualizado com sucesso!', vicio });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar vício' });
  }
});

// Excluir vício
router.delete('/delete', async (req, res) => {
  const { nome_usuario, habito_id } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const vicio = await Vicio.findOne({ _id: habito_id, usuario_id: usuario._id });
    if (!vicio) {
      return res.status(404).json({ message: 'Vício não encontrado' });
    }

    await Vicio.findByIdAndDelete(habito_id);
    res.json({ message: 'Vício deletado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar vício' });
  }
});

// Marcar que cedeu ao vício hoje
router.post('/:id/ceder', async (req, res) => {
  const { nome_usuario } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const vicio = await Vicio.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!vicio) {
      return res.status(404).json({ message: 'Vício não encontrado' });
    }

    // Reinicia a sequência atual
    vicio.sequencia_atual = 0;
    vicio.total_dias += 1;
    await vicio.save();

    res.json({ 
      message: 'Registrado que cedeu ao vício hoje. Amanhã é um novo dia!', 
      vicio 
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar que cedeu ao vício' });
  }
});

// Marcar que controlou o vício hoje
router.post('/:id/controlado', async (req, res) => {
  const { nome_usuario } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const vicio = await Vicio.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!vicio) {
      return res.status(404).json({ message: 'Vício não encontrado' });
    }

    // Incrementa sequência
    vicio.sequencia_atual += 1;
    vicio.total_dias += 1;
    
    // Atualiza melhor sequência se necessário
    if (vicio.sequencia_atual > vicio.melhor_sequencia) {
      vicio.melhor_sequencia = vicio.sequencia_atual;
    }

    await vicio.save();

    res.json({ 
      message: 'Parabéns! Mais um dia sem ceder ao vício!', 
      vicio 
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar controle do vício' });
  }
});

module.exports = router;