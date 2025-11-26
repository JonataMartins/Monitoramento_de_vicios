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
















// **Rota para Criar Hábito/Vício**
router.post('/create', async (req, res) => {
  const { nome_usuario, nome_habito, descricao, tipo } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const novoHabito = new Habito({
      usuario_id: usuario._id,
      nome_habito,
      descricao,
      tipo,  // 0 para vícios, 1 para hábitos bons
    });
    await novoHabito.save();

    res.status(201).json({ message: 'Hábito/vício criado com sucesso!', habito: novoHabito });
  } catch (err) {
    console.error("Erro ao criar hábito/vício:", err);
    res.status(500).json({ message: 'Erro ao criar hábito/vício!' });
  }
});

// **Rota para Listar Hábitos Bons**
router.get('/bons', async (req, res) => {
  const { nome_usuario } = req.query;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habitosBons = await Habito.find({ usuario_id: usuario._id, tipo: true });
    res.json(habitosBons);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar hábitos bons' });
  }
});

// **Rota para Listar Vícios**
router.get('/vicios', async (req, res) => {
  const { nome_usuario } = req.query;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const vicios = await Habito.find({ usuario_id: usuario._id, tipo: false });
    res.json(vicios);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar vícios' });
  }
});

// **Rota para Editar Hábito/Vício**
router.put('/:id', async (req, res) => {
  const { nome_usuario, nome_habito, descricao } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habito = await Habito.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!habito) {
      return res.status(404).json({ message: 'Hábito/Vício não encontrado' });
    }

    habito.nome_habito = nome_habito || habito.nome_habito;
    habito.descricao = descricao || habito.descricao;
    await habito.save();

    res.json({ message: 'Hábito/Vício atualizado com sucesso!', habito });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar hábito/vício' });
  }
});

// **Rota para Excluir Hábito/Vício**
router.delete('/delete', async (req, res) => {
  const { nome_usuario, habito_id } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habito = await Habito.findOne({ _id: habito_id, usuario_id: usuario._id });
    if (!habito) {
      return res.status(404).json({ message: 'Hábito/Vício não encontrado' });
    }

    await Habito.findByIdAndDelete(habito_id);
    res.json({ message: 'Hábito/Vício deletado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar hábito/vício' });
  }
});

// **Rota para Marcar que Cedeu ao Vício (hábito ruim) ou Quebrou a Sequência do Hábito Bom**
router.post('/:id/ceder', async (req, res) => {
  const { nome_usuario } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const habito = await Habito.findOne({ _id: req.params.id, usuario_id: usuario._id });
    if (!habito) {
      return res.status(404).json({ message: 'Hábito/Vício não encontrado' });
    }

    // Se for um vício (tipo: false), marcar como "cedeu"
    if (habito.tipo === false) {
      habito.ultimo_marco = new Date();
      habito.sequencia_melhor = 0;  // Resetar sequência do vício
      habito.sequencia_media += 1;  // Incrementar a sequência de vício
    }

    // Se for um hábito bom (tipo: true), marcar como "não fez o hábito"
    else if (habito.tipo === true) {
      habito.ultimo_marco = new Date();
      habito.sequencia_melhor = Math.max(0, habito.sequencia_melhor - 1);  // Decrementar a sequência do hábito bom
      habito.sequencia_media = Math.max(0, habito.sequencia_media - 1);  // Decrementar a sequência média
    }

    await habito.save();

    const message = habito.tipo === false 
      ? 'Registrado que cedeu ao vício hoje. Amanhã será um novo dia!' 
      : 'Você não fez o hábito bom hoje. Vamos tentar amanhã!';

    res.json({
      message,
      habito
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar que cedeu ao vício ou quebrou a sequência do hábito' });
  }
});


module.exports = router;
