const express = require("express");
const DashboardController = require("../controllers/dashboard");

const dashboardRoutes = express.Router();

// Entradas
dashboardRoutes.post("/entries", DashboardController.GetAllEntries);

// Cartões
dashboardRoutes.post("/cards", DashboardController.GetAllEntryCards);

//criar manualmente
dashboardRoutes.get("/manually-card/:userId", DashboardController.CreateCarimbosManually);
dashboardRoutes.get("/ofertas/:date", DashboardController.getDailyOfertas);
dashboardRoutes.get("/user-ofertas/:userId", DashboardController.getUserActivity);

// Outros
dashboardRoutes.get("/configs", DashboardController.GetConfigs);
dashboardRoutes.post("/configs", DashboardController.EditConfigs);

module.exports = dashboardRoutes;
