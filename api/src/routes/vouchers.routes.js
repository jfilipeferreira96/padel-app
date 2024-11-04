const express = require("express");
const VouchersController = require("../controllers/vouchers");
const { authenticateToken } = require("../middleware/auth.middleware");

const vouchersRoutes = express.Router();

// Rotas para Vouchers

// Rota responsável por adicionar um voucher
vouchersRoutes.post("/voucher", authenticateToken, VouchersController.addVoucher);

// Rota responsável por retornar todos os vouchers COM PAGINAÇÃO
vouchersRoutes.post("/vouchers", authenticateToken, VouchersController.getVouchersHistory);

// Rota responsável por retornar todos os vouchers COM PAGINAÇÃO
vouchersRoutes.get("/vouchers", authenticateToken, VouchersController.getAllVouchers);

// Rota responsável por obter um único voucher
vouchersRoutes.get("/voucher/:id", authenticateToken, VouchersController.getVoucher);

// Rota responsável por atualizar um voucher existente
vouchersRoutes.put("/voucher/:id", authenticateToken, VouchersController.updateVoucher);

vouchersRoutes.post("/voucher/updateCreditBalance", authenticateToken, VouchersController.updateCreditBalance);

// Rota responsável por excluir um voucher
vouchersRoutes.delete("/voucher/:id", authenticateToken, VouchersController.deleteVoucher);

// Rota responsável por associar um voucher a um utilizador
vouchersRoutes.post("/voucher/assign", authenticateToken, VouchersController.assignVoucher);

// Rota responsável por ativar um voucher associado a um utilizador
vouchersRoutes.post("/activate", authenticateToken, VouchersController.activateVoucher);

// Rota responsável por obter todos os vouchers de um utilizador
vouchersRoutes.get("/user/:userId", authenticateToken, VouchersController.getUserVouchers);

module.exports = vouchersRoutes;
