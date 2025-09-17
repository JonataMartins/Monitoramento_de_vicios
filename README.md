# Monitoramento_de_vicios
Projeto para SD

Duckdns configuração
    nano ~/.duckdns.sh
        #!/bin/bash

        # === CONFIGURAÇÃO ===
        TOKEN="SEU_TOKEN_AQUI"
        DOMAIN="pixel-xadrez"

        # === ATUALIZAÇÃO ===
        echo url="https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=" | curl -k -o ~/.duckdns.log -K -

        # Log opcional
        echo "$(date) - DuckDNS atualizado" >> ~/.duckdns.log

    chmod +x ~/.duckdns.sh

    ~/.duckdns.sh
    cat ~/.duckdns.log

    crontab -e
        */5 * * * * ~/.duckdns.sh >/dev/null 2>&1

ngrok configuração
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
        ngrok http http://localhost:80