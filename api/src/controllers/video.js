const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");

class VideoController {
  static async getCreditsHistory(req, res, next) {
    try {
      let query = `
          SELECT uch.*, 
                u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name, u.phone,
                a.email AS admin_email, a.first_name AS admin_first_name, a.last_name AS admin_last_name
          FROM users_credits_history uch
          LEFT JOIN users u ON uch.user_id = u.user_id
          LEFT JOIN users a ON uch.given_by = a.user_id
          WHERE 1 = 1
        `;

      let totalCountQuery = `
          SELECT COUNT(*) as count
          FROM users_credits_history uch
          LEFT JOIN users u ON uch.user_id = u.user_id
          LEFT JOIN users a ON uch.given_by = a.user_id
          WHERE 1 = 1
        `;

      const params = [];

      // Filtros
      if (req.body.filters) {
        const { email, name, phone, userId } = req.body.filters;

        const searchValue = email || name || phone;
        if (searchValue) {
          query += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
          totalCountQuery += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
          const searchPattern = `%${searchValue}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (userId) {
          query += ` AND uch.user_id = ?`;
          totalCountQuery += ` AND uch.user_id = ?`;
          params.push(userId);
        }
      }

      const { page = 1, limit = 15, orderBy = "uch.created_at", order = "DESC" } = req.body.pagination || {};
      const offset = (page - 1) * limit;

      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // Executar query principal
      const { rows } = await db.query(query, params);

      // Executar query de contagem total
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2));

      return res.status(200).json({
        status: true,
        data: rows,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o histórico de créditos.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getVideosProcessed(req, res, next) {
    try {
      const { name, email, phone } = req.body.filters || {};
      const userId = req.body.userId;
      const { page = 1, limit = 15, orderBy = "vp.created_at", order = "DESC" } = req.body.pagination || {};

      let query = `
        SELECT vp.*, u.email, u.first_name, u.last_name, u.phone
        FROM videos_processed vp
        LEFT JOIN users u ON vp.user_id = u.user_id
        WHERE 1 = 1
      `;

      let totalCountQuery = `
        SELECT COUNT(*) as count
        FROM videos_processed vp
        LEFT JOIN users u ON vp.user_id = u.user_id
        WHERE 1 = 1
      `;

      const params = [];

      if (userId) {
        query += ` AND vp.user_id = ?`;
        totalCountQuery += ` AND vp.user_id = ?`;
        params.push(userId);
      }

      if (name) {
        query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ?)`;
        totalCountQuery += ` AND (u.first_name LIKE ? OR u.last_name LIKE ?)`;
        const searchPattern = `%${name}%`;
        params.push(searchPattern, searchPattern);
      }

      if (email) {
        query += ` AND u.email LIKE ?`;
        totalCountQuery += ` AND u.email LIKE ?`;
        params.push(`%${email}%`);
      }

      if (phone) {
        query += ` AND u.phone LIKE ?`;
        totalCountQuery += ` AND u.phone LIKE ?`;
        params.push(`%${phone}%`);
      }

      const offset = (page - 1) * limit;

      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const { rows } = await db.query(query, params);
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2));

      return res.status(200).json({
        status: true,
        data: rows,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os vídeos processados.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async updateUserCredits(req, res, next) {
    try {
      const { userId, credits } = req.body;

      if (!userId || credits === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: false, message: "O ID do usuário e os créditos são obrigatórios." });
      }

      const userQuery = `SELECT video_credits FROM users WHERE user_id = ?`;
      const { rows: userRows } = await db.query(userQuery, [userId]);

      if (userRows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ status: false, message: "Usuário não encontrado." });
      }

      const creditsBefore = userRows[0].video_credits || 0;
      const creditsAfter = creditsBefore + credits;

      const updateQuery = `UPDATE users SET video_credits = ? WHERE user_id = ?`;
      await db.query(updateQuery, [credits, userId]);

      const historyQuery = `
        INSERT INTO users_credits_history (user_id, credits_before, credits_after, given_by)
        VALUES (?, ?, ?, ?)
      `;
      await db.query(historyQuery, [userId, creditsBefore, creditsAfter, req.user?.id || null]);

      return res.status(200).json({ status: true, message: "Créditos atualizados com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar os créditos do usuário.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async addVideoProcessed(req, res, next) {
    try {
      const { location } = req.body;
      const userId = req.user?.id;

      if (!location) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: false, message: "A localização é obrigatória." });
      }

      const userQuery = `SELECT video_credits FROM users WHERE user_id = ?`;
      const { rows: userRows } = await db.query(userQuery, [userId]);

      if (userRows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ status: false, message: "Usuário não encontrado." });
      }

      const userCredits = userRows[0].video_credits || 0;

      if (userCredits <= 0) {
        return res.status(StatusCodes.FORBIDDEN).json({ status: false, message: "Créditos insuficientes para processar o vídeo." });
      }

      const insertVideoQuery = `
        INSERT INTO videos_processed (user_id, location)
        VALUES (?, ?)
      `;
      await db.query(insertVideoQuery, [userId, location]);

      const updateCreditsQuery = `UPDATE users SET video_credits = video_credits - 1 WHERE user_id = ?`;
      await db.query(updateCreditsQuery, [userId]);

      const historyQuery = `
        INSERT INTO users_credits_history (user_id, credits_before, credits_after, given_by)
        VALUES (?, ?, ?, ?)
      `;
      await db.query(historyQuery, [userId, userCredits, userCredits - 1, req.user?.id || null]);

      return res.status(201).json({ status: true, message: "Vídeo processado e créditos atualizados com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao processar o vídeo.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getSingleVideoProcessed(req, res, next) {
    try {
      const videoId = req.params.id;

      const query = `
        SELECT vp.*, u.email, u.first_name, u.last_name, u.phone
        FROM videos_processed vp
        LEFT JOIN users u ON vp.user_id = u.user_id
        WHERE vp.id = ?
      `;

      const { rows } = await db.query(query, [videoId]);

      if (rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ status: false, message: "Vídeo não encontrado." });
      }

      return res.status(StatusCodes.OK).json({ status: true, data: rows[0] });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o vídeo.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getCreditsPageParams(req, res, next) {
    try {
      const creditQuery = `
        SELECT video_credits FROM users
        WHERE user_id = ?
      `;
      const { rows: creditRows } = await db.query(creditQuery, [req.user.id]);

      if (creditRows.length === 0) {
        return res.json({ status: false, message: "Créditos não encontrados." });
      }

      const credits = creditRows[0].video_credits;

      // Busca todos os campos disponíveis
      const camposQuery = `
        SELECT * FROM campos;
      `;
      const { rows: camposRows } = await db.query(camposQuery);

      const data = {
        credits,
        campos: camposRows.length === 0 ? [] : camposRows,
      };
      console.log(data);
      return res.status(StatusCodes.OK).json({ status: true, data });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os dados da página de créditos.", ex);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async teste(req, res, next) {
    try {
      const { user } = req.body;

      if (!user) {
        return res.json({
          status: false,
          error: "Pedido Inválido",
          message: "Faltam campos",
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
          message: "Token válido",
        });
      } catch (err) {
        return res.json({
          status: false,
          error: "Pedido Inválido",
          message: "Token inválido",
        });
      }
    } catch (ex) {
      Logger.error("Ocorreu um erro.", ex);
      res.status(500).json({
        status: false,
        error: "Erro Interno do Servidor",
        message: ex.message,
      });
    }
  }
}

module.exports = VideoController;
