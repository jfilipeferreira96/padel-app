const express = require("express");
const OrderController = require("../controllers/orders");
const { authenticateToken } = require("../middleware/auth.middleware");

const ordersRoutes = express.Router();

// Rotas para Produtos

// Rota responsável por adicionar um produto
ordersRoutes.post("/product", OrderController.addProduct);

// Rota responsável por retornar todos os produtos COM PAGINAÇÃO
ordersRoutes.post("/products", OrderController.getAllProducts);

// Rota responsável por obter um único produto
ordersRoutes.get("/product/:id", OrderController.getProduct);

// Rota responsável por atualizar um produto existente
ordersRoutes.put("/product/:id", OrderController.updateProduct);

// Rota responsável por excluir um produto
ordersRoutes.delete("/product/:id", OrderController.deleteProduct);

// Rotas para Pedidos

// Rota responsável por adicionar um pedido
ordersRoutes.post("/order", OrderController.addOrder);

// Rota responsável por retornar todos os pedidos COM PAGINAÇÃO
ordersRoutes.post("/orders", OrderController.getAllOrders);

module.exports = ordersRoutes;
