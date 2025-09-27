const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nome_usuario: {
    type: String,
    required: true,
    unique: true,
  },
  senha: {
    type: String,
    required: true,
  },
  ultimo_token: {
    type: String,
    default: null,
  },
  data_ultimo_login: {
    type: Date,
    default: null,
  }
});

module.exports = mongoose.model('Usuario', usuarioSchema);