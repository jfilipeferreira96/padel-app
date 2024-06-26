const express = require("express");
const UserController = require("../controllers/user");
const { authenticateToken } = require("../middleware/auth.middleware");

const authRoutes = express.Router();

// Rota responsável por retornar um unico user
authRoutes.get("/users/:id", authenticateToken, UserController.getSingleUser);

// Rota responsável por retornar todos os users COM PAGINAÇAO
authRoutes.post("/users", authenticateToken, UserController.getAllUsers);

// Rota responsável por apagar um user
authRoutes.delete("/users/:id", authenticateToken, UserController.deleteUser);

// Rota responsável por editar um user
authRoutes.put("/users/:id", authenticateToken, UserController.updateUser);

// Rota responsável por editar um user
authRoutes.put("/account/:id", authenticateToken, UserController.updateOwnUser);

// Rota responsável por retornar o cartao atual de um user
authRoutes.get("/users/cards/:id", authenticateToken, UserController.getUserEntryCards);

module.exports = authRoutes;
