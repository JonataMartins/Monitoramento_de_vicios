const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const usuarioRoutes = require('./routes/usuario');
const habitoRoutes = require('./routes/habito');

// Conectar ao MongoDB
connectDB();

const app = express();

// Configuração do CORS
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos (css, js, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Swagger para gerar automaticamente a documentação
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Monitoramento de Vícios',
      version: '1.0.0',
      description: 'Documentação da API para monitoramento de vícios',
    },
  },
  apis: ['./routes/usuario.js', './routes/habito.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Usando a rota consolidada para o usuário
app.use('/usuario', usuarioRoutes);

// Usando a rota de criação de hábitos
app.use('/habito', habitoRoutes);

// Rota para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
