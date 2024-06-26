const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) return res.sendStatus(401); // Unauthorized

  const token = authHeader.split(" ")[1]; // Remover "Bearer " do token

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET is not defined in the environment." });
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    if (user) {
      req.user = user;
      next();
    } else {
      return res.sendStatus(403); // Forbidden
    }
  });
}


module.exports = { authenticateToken };
