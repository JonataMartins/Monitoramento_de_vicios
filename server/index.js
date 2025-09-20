const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');  // Importando o módulo 'crypto' do Node.js

// **Configuração do MongoDB Atlas**
const uri = "mongodb+srv://davimartins_db_user:OTkNrXDSntQiWsea@cluster-monitoramento-v.kfyepcc.mongodb.net/monitoramento_vicios?retryWrites=true&w=majority";

// **Conectar ao MongoDB com mongoose.connect()**
mongoose.connect(uri)
  .then(() => {
    console.log("Conectado ao MongoDB!");
  })
  .catch(err => {
    console.error("Erro ao conectar ao MongoDB:", err);
  });

// **Definindo o app**
const app = express();
app.use(express.json());  // Para fazer o parse do corpo das requisições JSON

// **Criação do Schema e Model para o Usuário usando Mongoose**
const usuarioSchema = new mongoose.Schema({
  nome_usuario: {
    type: String,
    required: true,
    unique: true,  // Garantir que o nome de usuário seja único
  },
  senha: {
    type: String,
    required: true,
  }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);  // Criação do modelo de Usuário

// **Criação do Schema e Model para os Hábitos**
const habitoSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,  // Referência ao id do usuário
    ref: 'Usuario',  // Relaciona o hábito a um usuário
    required: true,
  },
  nome_habito: {
    type: String,
    required: true,
  },
  descricao: {
    type: String,
    required: true,
  },
  data_inicio: {
    type: Date,
    default: Date.now,
  },
  ativo: {
    type: Boolean,
    default: true,
  }
});

const Habito = mongoose.model('Habito', habitoSchema);  // Criação do modelo de Hábito

// **Função para criptografar a senha**
function hashSenha(senha) {
  const hash = crypto.createHash('sha256'); // Algoritmo de hash (sha256 é um bom padrão)
  hash.update(senha);  // Adiciona a senha ao hash
  return hash.digest('hex');  // Retorna o hash em formato hexadecimal
}

// **Rota para criar um usuário**
app.post('/usuarios', async (req, res) => {
  const { nome_usuario, senha, confirmar_senha } = req.body;
  console.log('Dados recebidos:', { nome_usuario, senha, confirmar_senha });

  try {
    // Verificar se o nome de usuário já existe
    const usuarioExistente = await Usuario.findOne({ nome_usuario });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    // Verificar se as senhas coincidem
    if (senha !== confirmar_senha) {
      return res.status(400).json({ message: 'As senhas não coincidem' });
    }

    // Criptografar a senha antes de salvar no banco
    const senhaCriptografada = hashSenha(senha);

    // Criar um novo usuário com a senha criptografada
    const novoUsuario = new Usuario({
      nome_usuario,
      senha: senhaCriptografada,  // Armazenar a senha criptografada
    });

    // Inserir no MongoDB
    await novoUsuario.save();

    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: novoUsuario });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ message: 'Erro ao criar usuário!' });
  }
});

// **Rota de Login**
app.post('/login', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  try {
    // Verificar se o usuário existe
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se a senha criptografada corresponde ao hash armazenado
    const senhaCriptografada = hashSenha(senha);

    if (usuario.senha !== senhaCriptografada) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    res.status(200).json({ message: 'Login bem-sucedido', usuario });
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ message: 'Erro ao fazer login!' });
  }
});

// **Rota para criar um hábito**
app.post('/habitos', async (req, res) => {
  const { usuario_id, nome_habito, descricao } = req.body;

  try {
    // Verificar se o usuário existe
    const usuarioExistente = await Usuario.findById(usuario_id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Criar um novo hábito
    const novoHabito = new Habito({
      usuario_id,
      nome_habito,
      descricao,
    });

    // Inserir no MongoDB (usando o Mongoose)
    await novoHabito.save();

    res.status(201).json({ message: 'Hábito criado com sucesso!', habito: novoHabito });
  } catch (err) {
    console.error("Erro ao criar hábito:", err);
    res.status(500).json({ message: 'Erro ao criar hábito!' });
  }
});

// **Rota para buscar hábitos de um usuário**
app.get('/habitos/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    // Buscar todos os hábitos do usuário
    const habitos = await Habito.find({ usuario_id });

    res.status(200).json({ message: 'Hábitos encontrados!', habitos });
  } catch (err) {
    console.error("Erro ao buscar hábitos:", err);
    res.status(500).json({ message: 'Erro ao buscar hábitos!' });
  }
});

// **Rota para a página inicial (opcional)**
app.get('/', (req, res) => {
  res.send('Bem-vindo ao servidor de monitoramento de vícios!');
});

// **Iniciar o servidor Express**
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
