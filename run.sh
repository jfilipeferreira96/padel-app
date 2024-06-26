#!/bin/bash

# Atualizar o repositório Git
git pull origin main

# Recriar as imagens Docker
cd ./api
docker build -t padel-api .

cd ../client
docker build -t padel-client .

# Parar e remover os containers antigos
docker stop $(docker ps -q --filter ancestor=padel-api)
docker rm $(docker ps -a -q --filter ancestor=padel-api)

docker stop $(docker ps -q --filter ancestor=padel-client)
docker rm $(docker ps -a -q --filter ancestor=padel-client)

# Executar os containers atualizados
docker run -d -p 5005:5005 padel-api
docker run -d -p 3005:3005 padel-client
