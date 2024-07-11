const express = require("express");
const ArticleController = require("../controllers/article");
const { authenticateToken } = require("../middleware/auth.middleware");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const articlesRoutes = express.Router();

// Rotas para os artigos
articlesRoutes.post("/add", authenticateToken, upload.array("files"), ArticleController.addArticle);

// Rota responsável por retornar todos os cartões offpeak COM PAGINAÇÃO
articlesRoutes.post("/all", authenticateToken, ArticleController.getAllArticles);

// Rota responsável por obter um único artigo
articlesRoutes.get("/article/:id", authenticateToken, ArticleController.getArticle);

// Rota responsável por atualizar um artigo
articlesRoutes.put("/article/:id", authenticateToken, ArticleController.updateArticle);

// Rota responsável por excluir um artigo
articlesRoutes.delete("/article/:id", authenticateToken, ArticleController.deleteArticle);

module.exports = articlesRoutes;
