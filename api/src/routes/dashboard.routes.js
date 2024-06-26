const express = require("express");
const DashboardController = require("../controllers/dashboard");

const dashboardRoutes = express.Router();

// Entradas
dashboardRoutes.post("/entries", DashboardController.GetAllEntries);

// Cartões
dashboardRoutes.post("/cards", DashboardController.GetAllEntryCards);

// Outros
dashboardRoutes.get("/configs", DashboardController.GetConfigs);
dashboardRoutes.post("/configs", DashboardController.EditConfigs);

module.exports = dashboardRoutes;
