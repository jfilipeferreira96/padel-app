const path = require("path");
const { Router } = require("express");
const { authenticateToken } = require("../middleware/auth.middleware");
const UserController = require("../controllers/user");
const authRoutes = require("./user.routes");
const acessosRoutes = require("./acessos.routes");
const dashboardRoutes = require("./dashboard.routes");
const ordersRoutes = require("./orders.routes");
const offpeakCardsRoutes = require("./offpeak.routes");

const routes = Router();

/***************** PUBLIC ROUTES *****************/
const staticHTML = (req, res) => {
  const rootPath = path.resolve(__dirname, "..", "views");
  res.sendFile("/index.html", { root: rootPath });
};
routes.get("/", staticHTML);
routes.get("/api", staticHTML);

// Rota responsável por Criar um novo 'User': (POST): localhost:5000/api/auth/register
authRoutes.post("/register", UserController.register);

// Rota responsável por realizar um novo login 'User': (POST): localhost:5000/api/auth/login
authRoutes.post("/login", UserController.login);

/***************** AUTH ROUTES *****************/
routes.use("/api/auth", authRoutes);

routes.use("/api/acessos", authenticateToken, acessosRoutes);
routes.use("/api/dashboard", authenticateToken, dashboardRoutes);
routes.use("/api/orders", authenticateToken, ordersRoutes);
routes.use("/api/offpeak", authenticateToken, offpeakCardsRoutes);

module.exports = routes;
