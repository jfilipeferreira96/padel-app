# Instruções de Execução

## Como correr

1. Execute os seguintes comandos no terminal:

    ```bash
    yarn install
    yarn dev
    ```
   
   Se preferir usar o npm, substitua `yarn` por `npm` no ficheiro `package.json`.

2. Certifique-se de copiar o conteúdo do arquivo `db.sql` e cole-o no pgAdmin ou outro software semelhante para ter os dados necessários.

## Variáveis Locais

Certifique-se de configurar um arquivo `.env` com as seguintes variáveis:

 ```
  SECRET_KEY=""
  JWT_SECRET=""
  JWT_REFRESH_SECRET=""
  DB_HOST="127.0.0.1"
  DB_PORT="3360"
  DB_USERNAME="root"
  DB_PASSWORD=""
  DB_DBNAME=""
  ```