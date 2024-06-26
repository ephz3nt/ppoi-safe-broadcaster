#!/bin/bash

read -sp "Enter password: " password
echo
read -sp "Enter password again: " password2
echo
if [ "$password" != "$password2" ]; then
    echo "Passwords do not match"
    exit 1
fi

read -sp "Enter mnemonic: " mnemonic
echo
read -sp "Enter mnemonic again: " mnemonic2
echo
if [ "$mnemonic" != "$mnemonic2" ]; then
    echo "Mnemonics do not match"
    exit 1
fi

if ! [ -x "$(command -v jq)" ]; then
    echo "jq is not installed. Installing jq..."
    sudo apt-get install jq -y
else
    echo "jq is already installed"
fi

# check if were in main directory
if [ ! -f docker/build.sh ]; then
    echo "Please run this script from the main directory"
    exit 1
fi

if [ -f src/MY-CONFIG.ts ]; then
    echo "MY-CONFIG.ts file exists"
else
    echo "MY-CONFIG.ts file does not exist, creating it"
    cp src/MY-CONFIG.ts.example src/MY-CONFIG.ts
fi

cd docker
read -p "Do you want to use docker? (y/n) " answer
case ${answer:0:1} in
    y|Y )
        if ! [ -x "$(command -v docker)" ]; then
            echo "Docker is not installed. Installing docker..."
              sudo apt-get update
              sudo apt-get install ca-certificates curl gnupg
              sudo install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              sudo chmod a+r /etc/apt/keyrings/docker.gpg
              echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
                $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
                sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
              sudo apt-get update
              sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
        else
            echo "Docker is already installed"
        fi
        if [ -f .env ]; then
            read -p "Do you want to rebuild the .env file? (y/n) " answer
            case ${answer:0:1} in
                y|Y )
                    echo "Rebuilding .env file"
                    rm .env
                ;;
                * )
                    echo "Using old .env file"
                ;;
            esac
        fi

        if [ -f .env ]; then
            echo ".env file exists"
        else
            echo ".env file does not exist, creating it"
            sudo docker swarm init
            echo "creating docker secrets"
            echo "$password" -n | sha256sum | awk '{print $1}' | docker secret create DB_ENCRYPTION_KEY -
            nodekey=0x"$(openssl rand -hex 32)"
            nodekey2=0x"$(openssl rand -hex 32)"
            echo "$nodekey" | docker secret create NODEKEY_1 -
            echo "$nodekey" | docker secret create NODEKEY_2 -
            echo "$mnemonic" | docker secret create MNEMONIC -
            echo NODEKEY_1="$nodekey" >> .env
            echo NODEKEY_2="$nodekey2" >> .env
            echo EXTIP=$(wget -qO- https://api4.ipify.org) >> .env
            read -p "Do you want to use a custom domain? (y/n) " answer
            case ${answer:0:1} in
                y|Y )
                    read -p "Enter subdomain: " subdomain
                    read -p "Enter domain: " domain
                    echo SUBDOMAIN="$subdomain" >> .env
                    echo BASEDOMAIN="$domain" >> .env
                    read -p "Enter email address for SSL certs: " email
                    echo EMAIL="$email" >> .env
                    read -p "Enter timezone for SSL certs [EST/ET/PST/PT...]: " timezone
                    echo TZ="$timezone" >> .env
                    ./build.sh
                    ./run.sh
                ;;
                * )
                    ./build.sh --no-swag
                    ./runswagless.sh
                ;;
            esac
        fi
    ;;
    * )
        echo "Not using docker"
    ;;
esac
echo "Installation complete!"
echo "Customize Broadcaster setup in src/MY-CONFIG.ts"
echo "First you must stop the current instance of the docker containers by running the following command:"
echo "docker/stop.sh"
echo "Then run the following command to rebuild the images with your changes. This will take a while please be patient."
echo "docker/build.sh"
echo "Then run the following command to start the containers with your new changes."
if [ -f docker-stack-swagless.yml ]; then
    echo "docker/runswagless.sh"
else
    echo "docker/run.sh"
fi
