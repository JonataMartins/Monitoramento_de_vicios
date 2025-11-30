const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./public/backend/config/database');
const usuarioRoutes = require('./public/backend/routes/usuario');
const habitoRoutes = require('./public/backend/routes/habito');

require('dotenv').config();

const app = express();

// Conectar ao MongoDB
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public/frontend')));

app.get('/api/config', (req, res) => {
  res.json({ apiUrl: process.env.API_URL });
});

// Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Monitoramento de Vícios',
      version: '1.0.0',
      description: 'Documentação da API para monitoramento de vícios',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./public/backend/routes/*.js'],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// Rotas
app.use('/usuario', usuarioRoutes);
app.use('/habito', habitoRoutes);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
