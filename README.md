# Monitoramento_de_vicios
Projeto para SD

iniciar servidor 
    cd /opt/lampp
    sudo ./lampp start
    cd /opt/lampp/htdocs/Monitoramento_de_vicios/server
    node index.js

ngrok configuração
    funcionamento 
        Inicialização: O cliente Ngrok se conecta aos servidores usando TLS
        Alocação: O servidor aloca um endereço público único
        Tunneling: Todo tráfego HTTP/HTTPS é encaminhado através do túnel
        Resposta: As respostas da aplicação local retornam pelo mesmo túnel

    limitações do plano gratuito
        1 domínio estático
        1 endpoint ativo
        1 GB de transferência mensal
        20.000 requisições HTTP/mês
        5.000 conexões TCP/TLS/mês
        Página de aviso antes de acessar o conteúdo

    instalação
        curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
        | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
        && echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
        | sudo tee /etc/apt/sources.list.d/ngrok.list \
        && sudo apt update \
        && sudo apt install ngrok
    
    add token
        ngrok config add-authtoken <token>

    Start an endpoint:
        ngrok http http://localhost:3000

    Start witch password
        ngrok http -auth="username:password" http://localhost:3000
