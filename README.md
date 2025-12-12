# Documentação do Projeto - Monitoramento de Vícios

## Visão Geral

Este é um projeto desenvolvido com **Node.js**, utilizando **Express**, **MongoDB Atlas**, e documentação gerada com **Swagger**. O projeto oferece uma API para interação com o banco de dados MongoDB e está configurado para ser acessado por meio de um túnel gerado com **Ngrok** para facilitar o acesso durante o desenvolvimento local.

## Tecnologias Usadas

- **Node.js**: Plataforma para execução de JavaScript no backend.
- **Express**: Framework para Node.js, usado para construir a API.
- **MongoDB**: Banco de dados NoSQL, hospedado no MongoDB Atlas (500MB no plano gratuito).
- **Mongoose**: ODM para interagir com MongoDB de forma mais fácil.
- **Swagger**: Ferramenta para gerar e visualizar a documentação da API.
- **Ngrok**: Serviço para expor localmente servidores para a internet, útil para testes.
- **JWT (JSON Web Token)**: Sistema de autenticação baseado em tokens para garantir a segurança das rotas protegidas da API, validando a identidade do usuário e suas permissões.
- **Mocha**: Framework de testes para garantir a qualidade e funcionalidade da API, com suporte a testes unitários e de integração.
- **Dotenv**: Biblioteca para carregar variáveis de ambiente a partir de um arquivo .env, garantindo a segurança e flexibilidade no gerenciamento de credenciais e configurações.
- **CORS**: Middleware para permitir que a API seja acessada por diferentes origens (cross-origin), facilitando o uso da API por aplicativos frontend em diferentes domínios.

## Instalação do Projeto

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/JonataMartins/Monitoramento_de_vicios
   cd Monitoramento_de_vicios

2. **Instale as dependências do projeto**:
   No diretório do projeto, execute o seguinte comando:
   ```bash
   npm install

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` na raiz do projeto e adicione as variáveis de ambiente necessárias:
   ```bash
   MONGO_URI=mongodb+srv://<usuario>:<senha>@cluster.mongodb.net/<nome-do-banco>
   API_URL=http://localhost:3000 ou link ngrok caso o use
   PORT=3000
   JWT_SECRET=seu-segredo-jwt

4. **Inicie o servidor localmente**:
   Para iniciar o servidor, use o comando:
   ```bash
   node server.js

5. **Utilizando o Ngrok**:
   Para expor seu servidor local através de um URL público, você pode usar o Ngrok. Execute o comando:
   ```bash
   ngrok http http://localhost:3000

## Documentação da API

A documentação da API, feita com Swagger, pode ser acessada através da rota /api-doc, ou do link local:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Ngrok, mais informações

### Funcionamento do Ngrok

- **Inicialização**: O cliente **Ngrok** se conecta aos servidores usando **TLS**.
- **Alocação**: O servidor **Ngrok** aloca um **endereço público único** para o seu servidor local.
- **Tunneling**: Todo tráfego **HTTP/HTTPS** é encaminhado através do **túnel**.
- **Resposta**: As respostas da aplicação local retornam pelo mesmo túnel, permitindo que o cliente acesse a aplicação como se estivesse rodando na internet.

### Limitações do Plano Gratuito do Ngrok

O plano gratuito do **Ngrok** tem algumas limitações que você deve estar ciente:

- **1 domínio estático**: Você terá um único domínio público para o seu túnel.
- **1 endpoint ativo**: Apenas um túnel estará ativo por vez.
- **1 GB de transferência mensal**: O plano gratuito permite até 1 GB de tráfego mensal.
- **20.000 requisições HTTP/mês**: Limitação de requisições HTTP.
- **5.000 conexões TCP/TLS/mês**: Limitação de conexões TCP/TLS.
- **Página de aviso**: Ao acessar o seu túnel, será exibida uma página de aviso do Ngrok antes de acessar o conteúdo.

### Instalação do Ngrok

Para instalar o **Ngrok** no seu sistema, use os seguintes comandos para distribuições **baseadas no Debian (Ubuntu, etc.)**:

```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
| sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
&& echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
| sudo tee /etc/apt/sources.list.d/ngrok.list \
&& sudo apt update \
&& sudo apt install ngrok 
```

### Teste de unitade e integração
```bash
   npx mocha public/backend/routes/habito.test.js
   npx mocha public/backend/routes/usuario.test.js
   npx mocha public/backend/routes/integration.test.js 