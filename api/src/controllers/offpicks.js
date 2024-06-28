const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");

class OffpeakCardsController {
  static async addOffpeakCard(req, res, next) {
    try {
      const { name, month, year, is_active } = req.body;

      if (!name || !month || !year) {
        return res.status(200).json({ status: false, message: "Nome, Mês e Ano são obrigatórios." });
      }

      // Verificar se já existe um cartão com o mesmo nome
      const checkQuery = `
      SELECT COUNT(*) as count
      FROM offpeak_cards
      WHERE name = ? AND year = ?
    `;
      const { rows: checkResult } = await db.query(checkQuery, [name, year]);

      if (checkResult && checkResult[0].count > 0) {
        return res.status(200).json({ status: false, message: "Já existe um cartão com o mesmo nome e ano." });
      }

      // Verificar se já existe um cartão com o mesmo mês e ano
      const checkQuery2 = `
      SELECT COUNT(*) as count
      FROM offpeak_cards
      WHERE month = ? AND year = ?
    `;
      const { rows: checkResult2 } = await db.query(checkQuery2, [month, year]);

      if (checkResult2 && checkResult2[0].count > 0) {
        return res.status(200).json({ status: false, message: "Já existe um cartão com o mesmo mês e ano." });
      }
      const query = `
        INSERT INTO offpeak_cards (name, month, year, is_active)
        VALUES (?, ?, ?, ?)
      `;

      await db.query(query, [name, month, year, is_active]);

      return res.status(201).json({ status: true, message: "Cartão de offpeak adicionado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao adicionar o cartão de offpeak.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getAllOffpeakCards(req, res, next) {
    try {
      const { page = 1, limit = 15, orderBy = "offpeak_card_id", order = "ASC" } = req.body.pagination || {};

      let query = `
        SELECT *
        FROM offpeak_cards
        WHERE 1 = 1
      `;

      let totalCountQuery = `
        SELECT COUNT(*) as count
        FROM offpeak_cards
        WHERE 1 = 1
      `;

      const params = [];

      // Filters
      if (req.body.filters) {
        const { name, month, year, is_active } = req.body.filters;

        if (name) {
          query += ` AND name LIKE ?`;
          totalCountQuery += ` AND name LIKE ?`;
          params.push(`%${name}%`);
        }

        if (month) {
          query += ` AND month = ?`;
          totalCountQuery += ` AND month = ?`;
          params.push(month);
        }

        if (year) {
          query += ` AND year = ?`;
          totalCountQuery += ` AND year = ?`;
          params.push(year);
        }

        if (is_active !== undefined) {
          query += ` AND is_active = ?`;
          totalCountQuery += ` AND is_active = ?`;
          params.push(is_active);
        }
      }

      const offset = (page - 1) * limit;

      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const { rows } = await db.query(query, params);
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2)); // Remove limit and offset params

      return res.status(200).json({
        status: true,
        data: rows,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os cartões de offpeak.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getOffpeakCard(req, res, next) {
    try {
      const offpeakCardId = req.params.id;

      const query = `
      SELECT *
      FROM offpeak_cards
      WHERE offpeak_card_id = ?
    `;

      const result = await db.query(query, [offpeakCardId]);

      if (result.rows.length === 0) {
        return res.status(200).json({ status: false, message: "Cartão de offpeak não encontrado." });
      }

      return res.status(200).json({ status: true, data: result.rows[0] });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o cartão de offpeak.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async updateOffpeakCard(req, res, next) {
    try {
      const offpeakCardId = req.params.id;
      const { name, month, year, is_active } = req.body;

      // Verificar se já existe um cartão com o mesmo nome, excluindo o próprio cartão que está sendo atualizado
      const checkNameQuery = `
      SELECT COUNT(*) as count
      FROM offpeak_cards
      WHERE name = ? AND offpeak_card_id != ?
    `;
      const { rows: checkNameResult } = await db.query(checkNameQuery, [name, offpeakCardId]);

      if (checkNameResult && checkNameResult[0].count > 0) {
        return res.status(200).json({ status: false, message: "Já existe um cartão com o mesmo nome." });
      }

      // Verificar se já existe um cartão com o mesmo mês e ano, excluindo o próprio cartão que está sendo atualizado
      const checkQuery = `
      SELECT COUNT(*) as count
      FROM offpeak_cards
      WHERE month = ? AND year = ? AND offpeak_card_id != ?
    `;
      const { rows: checkResult } = await db.query(checkQuery, [month, year, offpeakCardId]);

      if (checkResult && checkResult[0].count > 0) {
        return res.status(200).json({ status: false, message: "Já existe um cartão com o mesmo mês e ano." });
      }

      const query = `
      UPDATE offpeak_cards
      SET name = ?, month = ?, year = ?, is_active = ?
      WHERE offpeak_card_id = ?
    `;

      const { rows } = await db.query(query, [name, month, year, is_active, offpeakCardId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Cartão de offpeak não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Cartão de offpeak atualizado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar o cartão de offpeak.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async deleteOffpeakCard(req, res, next) {
    try {
      const offpeakCardId = req.params.id;

      const query = `
      DELETE FROM offpeak_cards
      WHERE offpeak_card_id = ?
    `;

      const { rows } = await db.query(query, [offpeakCardId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Cartão de offpeak não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Cartão de offpeak eliminado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao eliminar o cartão de offpeak.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async assignOffpeakCard(req, res, next) {
    try {
      const { user_id, offpeak_card_ids, assigned_by } = req.body;

      if (!user_id || !offpeak_card_ids || !assigned_by) {
        return res.status(200).json({ status: false, message: "Todos os campos são obrigatórios." });
      }

      if (!Array.isArray(offpeak_card_ids)) {
        return res.status(200).json({ status: false, message: "offpeak_card_ids deve ser um array de IDs de cartões." });
      }

      try {
        for (let card_id of offpeak_card_ids) {
          const query = `
          INSERT INTO user_offpeak_cards (user_id, offpeak_card_id, assigned_by)
          VALUES (?, ?, ?)
        `;

          await db.query(query, [user_id, card_id, assigned_by]);
        }

        return res.status(201).json({ status: true, message: "Cartões de offpeak atribuídos com sucesso." });
      } catch (ex) {
        Logger.error("Ocorreu um erro ao atribuir os cartões de offpeak.", ex);
        return res.status(500).json({ status: false, message: "Erro Interno do Servidor" });
      }
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atribuir o cartão de offpeak.", ex);
      return res.status(500).json({ status: false, message: "Erro Interno do Servidor" });
    }
  }
}

module.exports = OffpeakCardsController;
