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
        const { email, name, phone, validated_by } = req.body.filters;
        const searchValue = email || name || phone;
        if (searchValue) {
          query += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
          totalCountQuery += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
          const searchPattern = `%${searchValue}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (validated_by !== undefined && validated_by === false) {
          query += ` AND e.validated_by IS NOT NULL`;
          totalCountQuery += ` AND e.validated_by IS NOT NULL`;
        }

        if (validated_by !== undefined && validated_by === true) {
          query += ` AND e.validated_by IS NULL`;
          totalCountQuery += ` AND e.validated_by IS NULL`;
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

  static async CreateCarimbosManually(req, res) {
    try {
      const { userId } = req.params;
      // Verificar se o userId foi fornecido
      if (!userId) {
        return res.status(200).json({ status: false, message: "ID do utilizador é obrigatório." });
      }

      // Verificar se existe um cartão ativo para o userId fornecido
      const checkActiveCardQuery = `
      SELECT COUNT(*) AS active_card_count
      FROM entry_cards
      WHERE user_id = ? AND is_active = 1
    `;

      const { rows: activeCardResult } = await db.query(checkActiveCardQuery, [userId]);
      const activeCardCount = activeCardResult[0].active_card_count;

      // Se existir um cartão ativo, retornar um erro
      if (activeCardCount > 0) {
        return res.status(200).json({ status: false, message: "O utilizador já possui um cartão ativo." });
      }

      // Inserir uma nova entrada com entry_count = 0
      const insertEntryQuery = `
      INSERT INTO entry_cards (user_id, entry_count)
      VALUES (?, 0)
    `;

      const { rows: newEntryResult } = await db.query(insertEntryQuery, [userId]);
      const insertedCardId = newEntryResult.insertId;
      // Buscar todas as informações do cartão recém-criado
      const getCardInfoQuery = `
      SELECT card_id, user_id, created_at, is_active, entry_count
      FROM entry_cards
      WHERE card_id = ?
    `;

      const { rows: cardInfo } = await db.query(getCardInfoQuery, [insertedCardId]);

      return res.status(201).json({
        status: true,
        message: "Cartão de entrada criado com sucesso.",
        card: cardInfo[0],
      });
    } catch (error) {
      Logger.error("Erro ao criar cartão de entrada:", error);
      return res.status(200).json({ status: false, message: "Erro ao criar cartão de entrada." });
    }
  }

  static async getDailyOfertas(req, res) {
    const date = req.params.date; // formato esperado: 'YYYY-MM-DD'

    try {
      // Verificar se o utilizador solicitado é o mesmo que está a fazer a requisição
      if (req.user?.user_type !== "admin") {
        return res.status(403).json({ status: false, error: "Proibido", message: "Acesso não permitido a este recurso." });
      }

      // 1. Cartões com 10 entradas na data
      const completedCardsQuery = `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        ec.card_id,
        ec.entry_count,
        MAX(e.entry_time) AS last_updated
      FROM entry_cards ec
      JOIN card_entries ce ON ec.card_id = ce.card_id
      JOIN entries e ON ce.entry_id = e.entry_id
      JOIN users u ON ec.user_id = u.user_id
      WHERE 
        ec.entry_count = 10
      GROUP BY ec.card_id
      HAVING DATE(MAX(e.entry_time)) = ?
    `;
      const { rows: cardsCompleted } = await db.query(completedCardsQuery, [date]);

      // 2. Desconto monetário de vouchers (voucher_type = 'credito')
      const creditVoucherTransactionsQuery = `
      SELECT
          u.user_id,
          u.first_name AS user_first_name,
          u.last_name AS user_last_name,
          u.email AS user_email,
          u.phone,
          admin.first_name AS admin_first_name, 
          admin.last_name AS admin_last_name,
          v.name as voucher_name,
          vt.credits_before,                  
          vt.credits_after,                  
          (vt.credits_before - vt.credits_after) AS discount_amount,
          vt.created_at AS transaction_time     
      FROM voucher_transactions vt
      JOIN user_vouchers uv ON vt.user_voucher_id = uv.user_voucher_id
      JOIN users u ON uv.assigned_to = u.user_id
      LEFT JOIN users admin ON vt.changed_by = admin.user_id 
      JOIN vouchers v ON uv.voucher_id = v.voucher_id
      WHERE v.voucher_type = 'credito'
        AND DATE(vt.created_at) = ?
        AND vt.credits_before > vt.credits_after 
    `;
      const { rows: creditVoucherTransactions } = await db.query(creditVoucherTransactionsQuery, [date]);

      // 3. Vouchers ativados na data
      const activatedVouchersQuery = `
      SELECT
          u.user_id,
          u.first_name AS user_first_name,
          u.last_name AS user_last_name,
          u.email AS user_email,
          u.phone,
          admin.first_name AS admin_first_name, 
          admin.last_name AS admin_last_name,
          v.name as voucher_name, 
          uv.activated_at  
      FROM user_vouchers uv
      JOIN users u ON uv.assigned_to = u.user_id
      LEFT JOIN users admin ON uv.activated_by = admin.user_id 
      JOIN vouchers v ON uv.voucher_id = v.voucher_id
      WHERE DATE(uv.activated_at) = ?
        AND uv.activated_by IS NOT NULL
    `;
      const { rows: activatedVouchers } = await db.query(activatedVouchersQuery, [date]);

      return res.status(200).json({
        status: true,
        date,
        cardsCompleted,
        creditVoucherTransactions,
        activatedVouchers,
      });
    } catch (err) {
      Logger.error("Error on getDailyActivityReport", err);
      return res.status(500).json({
        status: false,
        message: "Erro interno ao buscar dados",
        error: err.message,
      });
    }
  }

  static async getUserActivity(req, res) {
    const userId = req.params.userId;

    // Validar userId
    const targetUserId = parseInt(userId, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ status: false, message: "User ID inválido." });
    }

    try {
      // Verificar permissões
      if (!req.user || !req.user.id) {
        return res.status(401).json({ status: false, message: "Autenticação necessária." });
      }

      if (req.user.user_type !== "admin") {
        return res.status(403).json({ status: false, message: "Acesso não permitido a este recurso." });
      }

      // 1. Cartões com 10 entradas PARA ESTE USER
      const completedCardsQuery = `
        SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            ec.card_id,
            ec.entry_count,
            MAX(e.entry_time) AS last_updated
        FROM entry_cards ec
        JOIN card_entries ce ON ec.card_id = ce.card_id
        JOIN entries e ON ce.entry_id = e.entry_id
        JOIN users u ON ec.user_id = u.user_id
        WHERE
            ec.entry_count = 10
            AND u.user_id = ?   
        GROUP BY ec.card_id
      `;
      const { rows: cardsCompleted } = await db.query(completedCardsQuery, [targetUserId]);

      // 2. Desconto monetário de vouchers (credito) PARA ESTE USER
      const creditVoucherTransactionsQuery = `
        SELECT
            u.user_id,
            u.first_name AS user_first_name,
            u.last_name AS user_last_name,
            u.email AS user_email,
            u.phone,
            admin.first_name AS admin_first_name,
            admin.last_name AS admin_last_name,
            v.name as voucher_name,
            vt.credits_before,
            vt.credits_after,
            (vt.credits_before - vt.credits_after) AS discount_amount,
            vt.created_at AS transaction_time
        FROM voucher_transactions vt
        JOIN user_vouchers uv ON vt.user_voucher_id = uv.user_voucher_id
        JOIN users u ON uv.assigned_to = u.user_id
        LEFT JOIN users admin ON vt.changed_by = admin.user_id
        JOIN vouchers v ON uv.voucher_id = v.voucher_id
        WHERE v.voucher_type = 'credito'
          AND vt.credits_before > vt.credits_after
          AND u.user_id = ?     
      `;
      const { rows: creditVoucherTransactions } = await db.query(creditVoucherTransactionsQuery, [targetUserId]);

      // 3. Vouchers ativados na data PARA ESTE USER
      const activatedVouchersQuery = `
        SELECT
            u.user_id,
            u.first_name AS user_first_name,
            u.last_name AS user_last_name,
            u.email AS user_email,
            u.phone,
            admin.first_name AS admin_first_name,
            admin.last_name AS admin_last_name,
            v.name as voucher_name,
            uv.activated_at
        FROM user_vouchers uv
        JOIN users u ON uv.assigned_to = u.user_id
        LEFT JOIN users admin ON uv.activated_by = admin.user_id
        JOIN vouchers v ON uv.voucher_id = v.voucher_id
        WHERE uv.activated_by IS NOT NULL
          AND u.user_id = ?       -- Filtro pelo User ID
      `;
      const { rows: activatedVouchers } = await db.query(activatedVouchersQuery, [targetUserId]);

      // Retornar os resultados das três queries
      return res.status(200).json({
        status: true,
        userId: targetUserId,
        cardsCompleted,
        creditVoucherTransactions,
        activatedVouchers,
      });
    } catch (err) {
      Logger.error(`Error fetching daily activity for user ${targetUserId}`, err);
      return res.status(500).json({
        status: false,
        message: "Erro interno ao buscar relatório do utilizador.",
        error: err.message,
      });
    }
  }
}

module.exports = DashboardController;
