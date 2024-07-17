const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");

class DashboardController {
  static async GetAllEntries(req, res) {
    try {
      const { page = 1, limit = 15, orderBy = "e.entry_time", order = "ASC" } = req.body.pagination || {};

      // Initial query without the WHERE conditions
      let query = `
      SELECT e.entry_id, e.user_id, e.location_id, lc.name as location_name, e.entry_time, e.validated_by, e.validated_at,  
            u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name, u.phone,
            a.email AS admin_email, a.first_name AS admin_first_name, a.last_name AS admin_last_name
      FROM entries e
      LEFT JOIN users u ON e.user_id = u.user_id
      LEFT JOIN users a ON e.validated_by = a.user_id
      LEFT JOIN locations lc ON lc.location_id = e.location_id
      WHERE 1 = 1
    `;

      let totalCountQuery = `
      SELECT COUNT(*) AS count
      FROM entries e
      LEFT JOIN users u ON e.user_id = u.user_id
      LEFT JOIN users a ON e.validated_by = a.user_id
      LEFT JOIN locations lc ON lc.location_id = e.location_id
      WHERE 1 = 1
    `;

      const params = [];

      // Adding conditions based on request body
      if (req.body.entry_id !== undefined) {
        query += ` AND e.entry_id = ?`;
        totalCountQuery += ` AND e.entry_id = ?`;
        params.push(req.body.entry_id);
      }

      if (req.body.location !== undefined) {
        query += ` AND e.location_id = ?`;
        totalCountQuery += ` AND e.location_id = ?`;
        params.push(req.body.location);
      }

      if (req.body.filters) {
        const { email, name, phone } = req.body.filters;
        const searchValue = email || name || phone;
        if (searchValue) {
          query += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
          totalCountQuery += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
          const searchPattern = `%${searchValue}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }
      }

      const offset = (page - 1) * limit;

      // Finalizing the query with ORDER BY, LIMIT, and OFFSET
      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // Executing the queries
      const result = await db.query(query, params);
      const totalCountResult = await db.query(totalCountQuery, params.slice(0, -2)); // Excluding limit and offset for count query
      const totalCount = parseInt(totalCountResult.rows[0].count);

      // Sending response
      return res.status(200).json({
        status: true,
        data: result.rows,
        pagination: { page, limit, orderBy, order, total: totalCount },
      });
    } catch (error) {
      Logger.error("Error fetching entries:", error);
      return res.status(200).json({ status: false, message: "Error fetching entries." });
    }
  }

  static async GetAllEntryCards(req, res) {
    try {
      let query = `
      SELECT ec.card_id, ec.user_id, ec.created_at, ec.is_active, ec.entry_count,
             u.email, u.first_name, u.last_name
      FROM entry_cards ec
      LEFT JOIN users u ON ec.user_id = u.user_id
      WHERE 1 = 1
    `;

      let totalCountQuery = `
      SELECT COUNT(*) AS count
      FROM entry_cards ec
      LEFT JOIN users u ON ec.user_id = u.user_id
      WHERE 1 = 1
    `;

      const params = [];

      // Add the is_active filter if provided
      if (req.body.is_active !== undefined) {
        query += ` AND ec.is_active = ?`;
        totalCountQuery += ` AND ec.is_active = ?`;
        params.push(req.body.is_active);
      }

      if (req.body.card_id !== undefined) {
        query += ` AND ec.card_id = ?`;
        totalCountQuery += ` AND ec.card_id = ?`;
        params.push(req.body.card_id);
      }

      if (req.body.pagination) {
        const { page = 1, limit = 15, orderBy = "ec.card_id", order = "ASC" } = req.body.pagination;
        const offset = (page - 1) * limit;

        query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        const totalCountResult = await db.query(totalCountQuery, params);
        const totalCount = parseInt(totalCountResult.rows[0].count);

        return res.status(200).json({
          status: true,
          data: result.rows,
          pagination: { page, limit, orderBy, order, total: totalCount },
        });
      } else {
        const result = await db.query(query, params);
        return res.status(200).json({
          status: true,
          data: result.rows,
        });
      }
    } catch (error) {
      Logger.error("Error fetching entry cards:", error);
      return res.status(200).json({ status: false, message: "Error fetching entry cards." });
    }
  }

  static async GetConfigs(req, res) {
    try {
      const queryConfigs = `SELECT * FROM configs WHERE name IN ('Torneios', 'Ligas')`;
      const { rows: rowsConfigs } = await db.query(queryConfigs);

      const response = {
        torneios: rowsConfigs.find((config) => config.name === "Torneios")?.href || "",
        ligas: rowsConfigs.find((config) => config.name === "Ligas")?.href || "",
      };

      return res.status(200).json({ status: true, data: response });
    } catch (error) {
      Logger.error("Error fetching configs:", error);
      return res.status(200).json({ status: false, message: "Error fetching configs." });
    }
  }

  static async EditConfigs(req, res) {
    try {
      const { torneios, ligas } = req.body;

      const updateConfigsQuery = `
        UPDATE configs SET href = CASE name
          WHEN 'Torneios' THEN ?
          WHEN 'Ligas' THEN ?
        END
        WHERE name IN ('Torneios', 'Ligas');
      `;
      await db.query(updateConfigsQuery, [torneios ?? NULL, ligas ?? NULL]);

      return res.status(200).json({ status: true, message: "Configurações atualizadas com sucesso." });
    } catch (error) {
      Logger.error("Error creating configs:", error);
      return res.status(200).json({ status: false, message: "Error creating configs." });
    }
  }
}

module.exports = DashboardController;
