// config/database.js
const mongoose = require('mongoose');

// Conectar ao MongoDB Atlas
const uri = "mongodb+srv://davimartins_db_user:OTkNrXDSntQiWsea@cluster-monitoramento-v.kfyepcc.mongodb.net/monitoramento_vicios?retryWrites=true&w=majority";

const connectDB = async () => {
  // **Conectar ao MongoDB com mongoose.connect()**
  mongoose.connect(uri)
    .then(() => {
      console.log("Conectado ao MongoDB!");
    })
    .catch(err => {
      console.error("Erro ao conectar ao MongoDB:", err);
    });
};

module.exports = connectDB;
