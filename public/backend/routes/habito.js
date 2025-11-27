const express = require('express');
const Habito = require('../models/habito');
const Usuario = require('../models/usuario');
const router = express.Router();




//adicionando apenas para teste temporarrio

// **ROTAS ESPECÍFICAS PARA VÍCIOS**

// Rota para registrar recaída
router.put('/:id/recaida', async (req, res) => {
  const { nome_usuario } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habito = await Habito.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!habito) {
      return res.status(404).json({ message: 'Vício não encontrado' });
    }

    // Incrementa contador de recaídas
    habito.recaidas = (habito.recaidas || 0) + 1;
    
    // Reseta o período atual (podemos calcular isso depois)
    // habito.periodo_atual_sem_recaida = 0;
    
    await habito.save();

    res.json({ 
      message: 'Recaída registrada. Continue tentando!', 
      recaidas_total: habito.recaidas 
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar recaída' });
  }
});

// Rota para registrar resistência (um dia sem recair)
router.put('/:id/resistencia', async (req, res) => {
  const { nome_usuario } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habito = await Habito.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!habito) {
      return res.status(404).json({ message: 'Vício não encontrado' });
    }

    // Calcula dias desde o início (simulação - depois podemos melhorar)
    const inicio = new Date(habito.inicio);
    const hoje = new Date();
    const diasSemRecair = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
    
    // Atualiza maior período se necessário
    if (diasSemRecair > (habito.maior_periodo_sem_vicio || 0)) {
      habito.maior_periodo_sem_vicio = diasSemRecair;
    }

    await habito.save();

    res.json({ 
      message: 'Resistência registrada! Parabéns!', 
      dias_sem_recair: diasSemRecair,
      maior_periodo: habito.maior_periodo_sem_vicio
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar resistência' });
  }
});

// Rota para buscar métricas do vício
router.get('/:id/metricas', async (req, res) => {
  const { nome_usuario } = req.query; // Agora via query string

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habito = await Habito.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!habito) {
      return res.status(404).json({ message: 'Vício não encontrado' });
    }

    // Calcula métricas
    const inicio = new Date(habito.inicio);
    const hoje = new Date();
    const diasSemRecair = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
    
    const metricas = {
      nome_vicio: habito.nome_habito,
      dias_sem_recair: diasSemRecair,
      maior_periodo_sem_vicio: habito.maior_periodo_sem_vicio || 0,
      total_recaidas: habito.recaidas || 0,
      progresso_reducao: calcularProgresso(habito.recaidas, diasSemRecair),
      frequencia_media: calcularFrequenciaMedia(habito.recaidas, diasSemRecair)
    };

    res.json(metricas);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar métricas' });
  }
});

// Funções auxiliares para cálculos
function calcularProgresso(recaidas, diasSemRecair) {
  if (diasSemRecair === 0) return 0;
  // Progresso baseado em dias sem recair vs recaídas totais
  const progresso = Math.min((diasSemRecair / (diasSemRecair + (recaidas || 1))) * 100, 100);
  return Math.round(progresso);
}

function calcularFrequenciaMedia(recaidas, diasTotal) {
  if (!recaidas || recaidas === 0) return 'Nenhuma recaída registrada';
  
  const frequencia = diasTotal / recaidas;
  if (frequencia >= 30) return 'Mensal';
  if (frequencia >= 7) return 'Semanal';
  if (frequencia >= 1) return 'Diária';
  return 'Múltiplas vezes ao dia';
}
//aki acaba oque foi adicionado para testar manter o module





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

// **Rota para Editar Hábito - CORRIGIDA: remover verificarToken por enquanto**
router.put('/:id', async (req, res) => {
  const { nome_usuario, nome_habito, descricao } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habito = await Habito.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!habito) {
      return res.status(404).json({ message: 'Hábito não encontrado' });
    }

    habito.nome_habito = nome_habito || habito.nome_habito;
    habito.descricao = descricao || habito.descricao;
    await habito.save();

    res.json({ message: 'Hábito atualizado com sucesso!', habito });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar hábito' });
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
