const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");

class OffpickCardsController {
  static async addOffpickCard(req, res, next) {
    try {
      const { name, month, year, is_active } = req.body;

      if (!name || !month || !year) {
        return res.status(200).json({ status: false, message: "Nome, Mês e Ano são obrigatórios." });
      }

      // Verificar se já existe um cartão com o mesmo nome
      const checkQuery = `
      SELECT COUNT(*) as count
      FROM offpick_cards
      WHERE name = ? AND year = ?
    `;
      const { rows: checkResult } = await db.query(checkQuery, [name, year]);

      if (checkResult && checkResult[0].count > 0) {
        return res.status(200).json({ status: false, message: "Já existe um cartão com o mesmo nome e ano." });
      }

      // Verificar se já existe um cartão com o mesmo mês e ano
      const checkQuery2 = `
      SELECT COUNT(*) as count
      FROM offpick_cards
      WHERE month = ? AND year = ?
    `;
      const { rows: checkResult2 } = await db.query(checkQuery2, [month, year]);

      if (checkResult2 && checkResult2[0].count > 0) {
        return res.status(200).json({ status: false, message: "Já existe um cartão com o mesmo mês e ano." });
      }
      const query = `
        INSERT INTO offpick_cards (name, month, year, is_active)
        VALUES (?, ?, ?, ?)
      `;

      await db.query(query, [name, month, year, is_active]);

      return res.status(201).json({ status: true, message: "Cartão de offpick adicionado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao adicionar o cartão de offpick.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getAllOffpickCards(req, res, next) {
    try {
      const { page = 1, limit = 15, orderBy = "offpick_card_id", order = "ASC" } = req.body.pagination || {};

      let query = `
        SELECT *
        FROM offpick_cards
        WHERE 1 = 1
      `;

      let totalCountQuery = `
        SELECT COUNT(*) as count
        FROM offpick_cards
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
      Logger.error("Ocorreu um erro ao buscar os cartões de offpick.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getOffpickCard(req, res, next) {
    try {
      const offpickCardId = req.params.id;

      const query = `
      SELECT *
      FROM offpick_cards
      WHERE offpick_card_id = ?
    `;

      const result = await db.query(query, [offpickCardId]);

      if (result.rows.length === 0) {
        return res.status(200).json({ status: false, message: "Cartão de offpick não encontrado." });
      }

      return res.status(200).json({ status: true, data: result.rows[0] });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o cartão de offpick.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async updateOffpickCard(req, res, next) {
    try {
      const offpickCardId = req.params.id;
      const { name, month, year, is_active } = req.body;

      // Verificar se já existe um cartão com o mesmo nome, excluindo o próprio cartão que está sendo atualizado
      const checkNameQuery = `
      SELECT COUNT(*) as count
      FROM offpick_cards
      WHERE name = ? AND offpick_card_id != ?
    `;
      const { rows: checkNameResult } = await db.query(checkNameQuery, [name, offpickCardId]);

      if (checkNameResult && checkNameResult[0].count > 0) {
        return res.status(200).json({ status: false, message: "Já existe um cartão com o mesmo nome." });
      }

      // Verificar se já existe um cartão com o mesmo mês e ano, excluindo o próprio cartão que está sendo atualizado
      const checkQuery = `
      SELECT COUNT(*) as count
      FROM offpick_cards
      WHERE month = ? AND year = ? AND offpick_card_id != ?
    `;
      const { rows: checkResult } = await db.query(checkQuery, [month, year, offpickCardId]);

      if (checkResult && checkResult[0].count > 0) {
        return res.status(200).json({ status: false, message: "Já existe um cartão com o mesmo mês e ano." });
      }

      const query = `
      UPDATE offpick_cards
      SET name = ?, month = ?, year = ?, is_active = ?
      WHERE offpick_card_id = ?
    `;

      const { rows } = await db.query(query, [name, month, year, is_active, offpickCardId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Cartão de offpick não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Cartão de offpick atualizado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar o cartão de offpick.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async deleteOffpickCard(req, res, next) {
    try {
      const offpickCardId = req.params.id;

      const query = `
      DELETE FROM offpick_cards
      WHERE offpick_card_id = ?
    `;

      const { rows } = await db.query(query, [offpickCardId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Cartão de offpick não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Cartão de offpick eliminado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao eliminar o cartão de offpick.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async assignOffpickCard(req, res, next) {
    try {
      const { user_id, offpick_card_ids, assigned_by } = req.body;

      if (!user_id || !offpick_card_ids || !assigned_by) {
        return res.status(200).json({ status: false, message: "Todos os campos são obrigatórios." });
      }

      if (!Array.isArray(offpick_card_ids)) {
        return res.status(200).json({ status: false, message: "offpick_card_ids deve ser um array de IDs de cartões." });
      }

      try {
        for (let card_id of offpick_card_ids) {
          const query = `
          INSERT INTO user_offpick_cards (user_id, offpick_card_id, assigned_by)
          VALUES (?, ?, ?)
        `;

          await db.query(query, [user_id, card_id, assigned_by]);
        }

        return res.status(201).json({ status: true, message: "Cartões de offpick atribuídos com sucesso." });
      } catch (ex) {
        Logger.error("Ocorreu um erro ao atribuir os cartões de offpick.", ex);
        return res.status(500).json({ status: false, message: "Erro Interno do Servidor" });
      }
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atribuir o cartão de offpick.", ex);
      return res.status(500).json({ status: false, message: "Erro Interno do Servidor" });
    }
  }
}

module.exports = OffpickCardsController;
