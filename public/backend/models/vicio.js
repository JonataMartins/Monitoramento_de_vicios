const mongoose = require('mongoose');

const vicioSchema = new mongoose.Schema({
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
  sequencia_atual: {
    type: Number,
    default: 0
  },
  melhor_sequencia: {
    type: Number,
    default: 0
  },
  total_dias: {
    type: Number,
    default: 0
  },
  data_criacao: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vicio', vicioSchema);