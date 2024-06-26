# Correr docker api:
cd ./api
docker build -t padel-api .
docker run -p 5000:5000 padel-api

# Correr docker client:
cd ./client
docker build -t padel-client .
docker run -p 3005:3005 padel-client

## Outros:
docker ps 

- Parar: docker stop xxx
- Eliminar: docker rm xxx
  
Apagar estes dockers apenas:
- docker stop $(docker ps -q --filter ancestor=padel-api) 
- docker rm $(docker ps -a -q --filter ancestor=padel-api)
- docker stop $(docker ps -q --filter ancestor=padel-client) 
- && docker rm $(docker ps -a -q --filter ancestor=padel-client)

Apagar tudo:
- docker rm $(docker ps -a -q)
- 
# Ou utilizar o script run.sh
- chmod +x run.sh
- ./run.sh
