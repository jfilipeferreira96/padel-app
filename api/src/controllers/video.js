const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");

class VideoController {
 
  /* static async teste(req, res, next) {
    try {
      const { user } = req.body;
      console.log(req.body)
      if (!user) {
        return res.status(200).json({ status: false, error: "Pedido Inválido", message: "Faltam campos" });
      }

      const secret = process.env.JWT_SECRET;
      let requestUser = {};
      jwt.verify(user, secret, (err, user) => {
        if (err) {
          return res.json({ status: false, error: "Pedido Inválido", message: "Token inválido" })
        }

        if (user) {
          requestUser = user;
        }
      });
      console.log(requestUser)
      return res.status(200).json({ status: true });
    } catch (ex) {
      Logger.error("Ocorreu um erro.", ex);
      res.status(500).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  } */

   static async teste(req, res, next) {
    try {
      const { user } = req.body;
      
      if (!user) {
        return res.json({
          status: false,
          error: "Pedido Inválido",
          message: "Faltam campos"
        });
      }

      const secret = process.env.JWT_SECRET;

      // Função para verificar o token
      const verifyToken = (token, secret) => {
        return new Promise((resolve, reject) => {
          jwt.verify(token, secret, (err, decoded) => {
            if (err) {
              reject(err);
            } else {
              resolve(decoded);
            }
          });
        });
      };

      try {
        const requestUser = await verifyToken(user, secret);
        console.log(requestUser); 

        return res.status(200).json({
          status: true,
          message: "Token válido"
        });
      } catch (err) {
        return res.json({
          status: false,
          error: "Pedido Inválido",
          message: "Token inválido"
        });
      }

    } catch (ex) {
      Logger.error("Ocorreu um erro.", ex);
      res.status(500).json({
        status: false,
        error: "Erro Interno do Servidor",
        message: ex.message
      });
    }
  }
}

module.exports = VideoController;
