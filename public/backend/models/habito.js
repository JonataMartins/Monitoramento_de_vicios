const mongoose = require('mongoose');

const habitoSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nome_habito: {
    type: String,
    required: true
  },
  descricao: {
    type: String,
    default: ''
  },
  /*
  tipo:{ // 0 para habitos ruins(vícios) e 1 para habitos bons
    type: Boolean,
    required: true
  },
  ultimo_marco: {
    type: Date,
    default: Date.now
  },
  sequencia_melhor: {
    type: Number,
    default: 0
  },
  sequencia_media: {
    type: Number,
    default: 0
  },
  data_criacao: {
    type: Date,
    default: Date.now
  },*/
  //adicionando aki aaaaaaaaaaaaaaaaaaa
  recaidas: {
    type: Number,
    default: 0
  },
  maior_periodo_sem_vicio: {
    type: Number,
    default: 0
  },
  inicio: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Habito', habitoSchema);
