const express = require("express");
const AcessoController = require("../controllers/acessos");

const acessosRoutes = express.Router();

// Regista a entrada
acessosRoutes.post("/entry", AcessoController.RegisterEntry);

// Confirma a entrada
acessosRoutes.post("/validate", AcessoController.ValidateEntries);

// Apaga a entrada
acessosRoutes.delete("/entry/:entryId", AcessoController.RemoveEntry);

module.exports = acessosRoutes;
