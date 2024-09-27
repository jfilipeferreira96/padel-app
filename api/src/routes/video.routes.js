const express = require("express");
const VideoController = require("../controllers/video");
const { authenticateToken } = require("../middleware/auth.middleware");

const videoRoutes = express.Router();

// Rota responsável por retornar o histórico de créditos dos utilizadores
videoRoutes.post("/credits-history", authenticateToken, VideoController.getCreditsHistory);

// Rota responsável por retornar os vídeos processados
videoRoutes.post("/processed", authenticateToken, VideoController.getVideosProcessed);
videoRoutes.post("/waiting", authenticateToken, VideoController.getVideosWaiting);

// Rota responsável por atualizar os créditos de um utilizador
videoRoutes.put("/credits", authenticateToken, VideoController.updateUserCredits);

videoRoutes.post("/processed/add", authenticateToken, VideoController.addVideoProcessed);
videoRoutes.post("/processed/edit", authenticateToken, VideoController.processVideo);

// Rota responsável por retornar um vídeo processado específico
videoRoutes.get("/processed/:id", authenticateToken, VideoController.getSingleVideoProcessed);

// Rota responsável por retornar os params da pagina
videoRoutes.get("/page-params", authenticateToken, VideoController.getCreditsPageParams);

module.exports = videoRoutes;
