const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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

// **Configuração do CORS**
const corsOptions = {
  origin: '*',  // Permitir qualquer origem 
  //origem: 'https://cb92bc91c4ec.ngrok-free.app', // Permitir de origem especifica
  methods: ['GET', 'POST'],  // Permitir métodos GET e POST
  allowedHeaders: ['Content-Type'], // Permitir apenas cabeçalhos de conteúdo
};

app.use(cors(corsOptions));  
app.use(express.json());  
app.use(express.static(path.join(__dirname, '..', 'public')));

// **Swagger para gerar automaticamente a documentação**
const swaggerOptions = {
  definition: {
    openapi: '3.0.0', // Versão da especificação OpenAPI
    info: {
      title: 'API de Monitoramento de Vícios',
      version: '1.0.0',
      description: 'Documentação da API para monitoramento de vícios',
    },
  },
  apis: ['./index.js'], // Arquivo onde estão os endpoints da API
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// **Criação do Schema e Model para o Usuário usando Mongoose**
const usuarioSchema = new mongoose.Schema({
  nome_usuario: {
    type: String,
    required: true,
    unique: true,
  },
  senha: {
    type: String,
    required: true,
  }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// **Criação do Schema e Model para os Hábitos**
const habitoSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
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

const Habito = mongoose.model('Habito', habitoSchema);

// **Função para criptografar a senha**
function hashSenha(senha) {
  const hash = crypto.createHash('sha256');
  hash.update(senha);
  return hash.digest('hex'); 
}

// **Rota para criar um usuário**
/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cria um novo usuário
 *     description: Cria um novo usuário com nome e senha criptografada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_usuario:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: "joao123"
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "senha123"
 *               confirmar_senha:
 *                 type: string
 *                 description: Confirmação da senha
 *                 example: "senha123"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Erro ao criar usuário
 *       500:
 *         description: Erro interno do servidor
 */
app.post('/usuarios', async (req, res) => {
  const { nome_usuario, senha, confirmar_senha } = req.body;

  try {
    const usuarioExistente = await Usuario.findOne({ nome_usuario });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    if (senha !== confirmar_senha) {
      return res.status(400).json({ message: 'As senhas não coincidem' });
    }

    const senhaCriptografada = hashSenha(senha);

    const novoUsuario = new Usuario({
      nome_usuario,
      senha: senhaCriptografada,
    });

    await novoUsuario.save();
    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: novoUsuario });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ message: 'Erro ao criar usuário!' });
  }
});

// **Rota de Login**
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realiza o login de um usuário
 *     description: Verifica se o usuário existe e valida a senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_usuario:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: "joao123"
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       400:
 *         description: Senha incorreta
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
app.post('/login', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

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
/**
 * @swagger
 * /habitos:
 *   post:
 *     summary: Cria um novo hábito
 *     description: Associa um hábito a um usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id:
 *                 type: string
 *                 description: ID do usuário associado ao hábito
 *                 example: "64d034ac418e1f5b800d88c7"
 *               nome_habito:
 *                 type: string
 *                 description: Nome do hábito
 *                 example: "Beber água"
 *               descricao:
 *                 type: string
 *                 description: Descrição do hábito
 *                 example: "Beber 2 litros de água por dia"
 *     responses:
 *       201:
 *         description: Hábito criado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
app.post('/habitos', async (req, res) => {
  const { usuario_id, nome_habito, descricao } = req.body;

  try {
    const usuarioExistente = await Usuario.findById(usuario_id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const novoHabito = new Habito({
      usuario_id,
      nome_habito,
      descricao,
    });

    await novoHabito.save();

    res.status(201).json({ message: 'Hábito criado com sucesso!', habito: novoHabito });
  } catch (err) {
    console.error("Erro ao criar hábito:", err);
    res.status(500).json({ message: 'Erro ao criar hábito!' });
  }
});

// **Rota para buscar hábitos de um usuário**
/**
 * @swagger
 * /habitos/{usuario_id}:
 *   get:
 *     summary: Obtém os hábitos de um usuário
 *     description: Recupera todos os hábitos associados a um usuário específico
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *         example: "64d034ac418e1f5b800d88c7"
 *     responses:
 *       200:
 *         description: Hábitos encontrados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hábitos encontrados!"
 *                 habitos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nome_habito:
 *                         type: string
 *                         example: "Beber água"
 *                       descricao:
 *                         type: string
 *                         example: "Beber 2 litros de água por dia"
 *       500:
 *         description: Erro ao buscar hábitos
 */
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

// **Rota para a página inicial**
/**
 * @swagger
 * /:
 *   get:
 *     summary: Retorna a página inicial
 *     description: Serve o arquivo HTML da página inicial da aplicação
 *     responses:
 *       200:
 *         description: Página inicial carregada com sucesso
 *       500:
 *         description: Erro ao carregar a página inicial
 */
app.get('/', (req, res) => {
  console.log("Rota / acessada");
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// **Iniciar o servidor Express**
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
