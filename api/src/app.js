const express = require("express");
const routes = require("./routes");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const db = require("./config/db");
const Logger = require("./utils/logger");

require("dotenv").config();

// Middleware para registrar os pedidos
app.use((req, res, next) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
  };

  Logger.request(JSON.stringify(logData));

  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:3005", "https://localhost:3005"],
  credentials: true,
};
app.use(cors(corsOptions));

// View engine setup
app.set("view engine", "ejs");

// Rotas devem ser usadas após o middleware de log
app.use(routes);

db.connect();

module.exports = app;
