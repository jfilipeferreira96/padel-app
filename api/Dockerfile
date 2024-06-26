# Use a imagem oficial do Node.js como base
FROM node:18-alpine

WORKDIR /usr/app

# Copia o ficheiro package.json e o package-lock.json para a pasta
COPY package*.json ./

# Instale as dependências da aplicação
RUN npm install

# Copia o restante dos ficheiros da aplicação para a pasta
COPY . .

# Exponha a porta em que a aplicação está sendo executada
EXPOSE 5005

# Comando para iniciar a aplicação
CMD ["npm", "start"]