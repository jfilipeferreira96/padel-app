const express = require("express");
const OffpeakCardsController = require("../controllers/offpeaks");
const { authenticateToken } = require("../middleware/auth.middleware");

const offpeakCardsRoutes = express.Router();

// Rotas para Offpeak Cards

// Rota responsável por adicionar um cartão offpeak
offpeakCardsRoutes.post("/offpeak-card", authenticateToken, OffpeakCardsController.addOffpeakCard);

// Rota responsável por retornar todos os cartões offpeak COM PAGINAÇÃO
offpeakCardsRoutes.post("/offpeak-cards", authenticateToken, OffpeakCardsController.getAllOffpeakCards);

// Rota responsável por obter um único cartão offpeak
offpeakCardsRoutes.get("/offpeak-card/:id", authenticateToken, OffpeakCardsController.getOffpeakCard);

// Rota responsável por atualizar um cartão offpeak existente
offpeakCardsRoutes.put("/offpeak-card/:id", authenticateToken, OffpeakCardsController.updateOffpeakCard);

// Rota responsável por excluir um cartão offpeak
offpeakCardsRoutes.delete("/offpeak-card/:id", authenticateToken, OffpeakCardsController.deleteOffpeakCard);

// Rota responsável por associar um cartão offpeak a um usuário
offpeakCardsRoutes.post("/offpeak-card/assign", authenticateToken, OffpeakCardsController.assignOffpeakCard);

module.exports = offpeakCardsRoutes;
