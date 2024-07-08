const express = require("express");
const ArticleController = require("../controllers/article");
const { authenticateToken } = require("../middleware/auth.middleware");

const articlesRoutes = express.Router();

// Rotas para os artigos

module.exports = articlesRoutes;
