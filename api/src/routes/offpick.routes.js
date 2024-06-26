const express = require("express");
const OffpickCardsController = require("../controllers/offpicks");
const { authenticateToken } = require("../middleware/auth.middleware");

const offpickCardsRoutes = express.Router();

// Rotas para Offpick Cards

// Rota responsável por adicionar um cartão offpick
offpickCardsRoutes.post("/offpick-card", authenticateToken, OffpickCardsController.addOffpickCard);

// Rota responsável por retornar todos os cartões offpick COM PAGINAÇÃO
offpickCardsRoutes.post("/offpick-cards", authenticateToken, OffpickCardsController.getAllOffpickCards);

// Rota responsável por obter um único cartão offpick
offpickCardsRoutes.get("/offpick-card/:id", authenticateToken, OffpickCardsController.getOffpickCard);

// Rota responsável por atualizar um cartão offpick existente
offpickCardsRoutes.put("/offpick-card/:id", authenticateToken, OffpickCardsController.updateOffpickCard);

// Rota responsável por excluir um cartão offpick
offpickCardsRoutes.delete("/offpick-card/:id", authenticateToken, OffpickCardsController.deleteOffpickCard);

// Rota responsável por associar um cartão offpick a um usuário
offpickCardsRoutes.post("/offpick-card/assign", authenticateToken, OffpickCardsController.assignOffpickCard);

module.exports = offpickCardsRoutes;
