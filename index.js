const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const crypto = require('crypto'); // Importando o módulo 'crypto' do Node.js

// Configuração do MongoDB Atlas
const uri = "mongodb+srv://davimartins_db_user:OTkNrXDSntQiWsea@cluster-monitoramento-v.kfyepcc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-monitoramento-vicios";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Conectar ao MongoDB e exportar a conexão para usar em outras partes
async function connectMongoDB() {
  try {
    await client.connect();
    console.log("Conectado ao MongoDB!");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
  }
}

// Criar a base de dados e coleções (caso não existam)
const dbName = 'monitoramento_vicios';
const db = client.db(dbName);
const usuariosCollection = db.collection('usuarios');
const habitosCollection = db.collection('habitos');

// Conectar ao MongoDB ao iniciar o servidor
connectMongoDB();

// Função para criptografar a senha
function hashSenha(senha) {
  const hash = crypto.createHash('sha256'); // Algoritmo de hash (sha256 é um bom padrão)
  hash.update(senha);  // Adiciona a senha ao hash
  return hash.digest('hex');  // Retorna o hash em formato hexadecimal
}

// **AQUI**: Defina o `app` **antes** das rotas
const app = express();
app.use(express.json()); // Para fazer o parse do corpo das requisições JSON

// Rota para criar um usuário
app.post('/usuarios', async (req, res) => {
  const { nome_usuario, senha } = req.body;
  console.log('Dados recebidos:', { nome_usuario, senha }); // Log para depuração
  
  try {
    // Verificar se o usuário já existe
    const usuarioExistente = await usuariosCollection.findOne({ nome_usuario });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    // Criptografar a senha antes de salvar no banco
    const senhaCriptografada = hashSenha(senha);

    // Criar um novo usuário com a senha criptografada
    const novoUsuario = {
      nome_usuario,
      senha: senhaCriptografada,  // Armazenar a senha criptografada
    };

    // Inserir no MongoDB
    await usuariosCollection.insertOne(novoUsuario);

    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: novoUsuario });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ message: 'Erro ao criar usuário!' });
  }
});

app.post('/login', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  try {
    // Verificar se o usuário existe
    const usuario = await usuariosCollection.findOne({ nome_usuario });
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


// Rota para a página inicial (opcional)
app.get('/', (req, res) => {
  res.send('Bem-vindo ao servidor de monitoramento de vícios!');
});

// Iniciar o servidor Express
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
