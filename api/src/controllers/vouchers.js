const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");

class VouchersController {
  static async addVoucher(req, res, next) {
    try {
      const { name, image_url } = req.body;

      if (!name) {
        return res.status(200).json({ status: false, message: "Nome é obrigatório." });
      }

      const query = `
        INSERT INTO vouchers (name, image_url)
        VALUES (?, ?)
      `;

      await db.query(query, [name, image_url]);

      return res.status(200).json({ status: true, message: "Voucher adicionado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao adicionar o voucher.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getVouchersHistory(req, res, next) {
    try {
      const { page = 1, limit = 15, orderBy = "uv.voucher_id", order = "ASC" } = req.body.pagination || {};

      let query = `
      SELECT uv.user_voucher_id, uv.voucher_id, v.name as voucher_name, uv.reason, uv.assigned_at, uv.activated_at, 
             u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name, u.phone,
             a.email AS admin_email, a.first_name AS admin_first_name, a.last_name AS admin_last_name,
             act.email AS activated_by_email, act.first_name AS activated_by_first_name, act.last_name AS activated_by_last_name
      FROM user_vouchers uv
      LEFT JOIN vouchers v ON uv.voucher_id = v.voucher_id
      LEFT JOIN users u ON uv.assigned_to = u.user_id
      LEFT JOIN users a ON uv.assigned_by = a.user_id
      LEFT JOIN users act ON uv.activated_by = act.user_id
      WHERE 1 = 1
    `;

      let totalCountQuery = `
      SELECT COUNT(*) AS count
      FROM user_vouchers uv
      LEFT JOIN vouchers v ON uv.voucher_id = v.voucher_id
      LEFT JOIN users u ON uv.assigned_to = u.user_id
      LEFT JOIN users a ON uv.assigned_by = a.user_id
      LEFT JOIN users act ON uv.activated_by = act.user_id
      WHERE 1 = 1
    `;

      const params = [];

      // Filtros
      if (req.body.filters) {
        const { email, name, phone, validated_by, assigned_to } = req.body.filters;

        const searchValue = email || name || phone;
        if (searchValue) {
          query += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
          totalCountQuery += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
          const searchPattern = `%${searchValue}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (validated_by !== undefined && validated_by === false) {
          query += ` AND uv.activated_by IS NOT NULL`;
          totalCountQuery += ` AND uv.activated_by IS NOT NULL`;
        }

        if (validated_by !== undefined && validated_by === true) {
          query += ` AND uv.activated_by IS NULL`;
          totalCountQuery += ` AND uv.activated_by IS NULL`;
        }

        if (assigned_to) {
          query += ` AND uv.assigned_to = ?`;
          totalCountQuery += ` AND uv.assigned_to = ?`;
          params.push(assigned_to);
        }
      }
      const offset = (page - 1) * limit;

      // Finalizando a consulta com ORDER BY, LIMIT e OFFSET
      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // Executando as consultas
      const { rows } = await db.query(query, params);
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, -2)); // Removendo limit e offset para a consulta de contagem

      return res.status(200).json({
        status: true,
        data: rows,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os vouchers.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getAllVouchers(req, res, next) {
    try {
      // Consulta inicial sem as condições WHERE
      let query = `
        SELECT * FROM vouchers
        WHERE 1 = 1
        `;

      let totalCountQuery = `
        SELECT COUNT(*) AS count
        FROM vouchers
        WHERE 1 = 1
        `;

      // Executando as consultas
      const { rows } = await db.query(query);
      const { rows: totalCountRows } = await db.query(totalCountQuery);

      return res.status(200).json({
        status: true,
        data: rows,
        total: totalCountRows,
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os vouchers.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getVoucher(req, res, next) {
    try {
      const voucherId = req.params.id;

      const query = `
        SELECT *
        FROM vouchers
        WHERE voucher_id = ?
      `;

      const result = await db.query(query, [voucherId]);

      if (result.rows.length === 0) {
        return res.status(200).json({ status: false, message: "Voucher não encontrado." });
      }

      return res.status(200).json({ status: true, data: result.rows[0] });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o voucher.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async updateVoucher(req, res, next) {
    try {
      const voucherId = req.params.id;
      const { name, image_url } = req.body;

      const query = `
        UPDATE vouchers
        SET name = ?, image_url = ?
        WHERE voucher_id = ?
      `;

      const { rows } = await db.query(query, [name, image_url, voucherId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Voucher não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Voucher atualizado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar o voucher.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async deleteVoucher(req, res, next) {
    try {
      const voucherId = req.params.id;

      const query = `
        DELETE FROM user_vouchers
        WHERE user_voucher_id = ?
      `;

      const { rows } = await db.query(query, [voucherId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Voucher não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Voucher eliminado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao eliminar o voucher.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async assignVoucher(req, res, next) {
    try {
      const { voucher_id, assigned_to, reason, is_active } = req.body;
      const assigned_by = req.user?.id;
      console.log(voucher_id, assigned_to, reason, is_active);
      console.log(assigned_by);
      if (!voucher_id || !assigned_by || !assigned_to || !reason) {
        return res.status(200).json({ status: false, message: "Todos os campos são obrigatórios." });
      }

      if (!is_active) {
        const query = `
        INSERT INTO user_vouchers (voucher_id, assigned_by, assigned_to)
        VALUES (?, ?, ?)
      `;

        await db.query(query, [voucher_id, assigned_by, assigned_to]);
      }

      if (is_active) {
        const query = `
        INSERT INTO user_vouchers (voucher_id, assigned_by, assigned_to, activated_by, activated_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

        await db.query(query, [voucher_id, assigned_by, assigned_to, assigned_by]);
      }

      return res.status(201).json({ status: true, message: "Voucher atribuído com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atribuir o voucher.", ex);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async activateVoucher(req, res, next) {
    try {
      const { id: userVoucherId } = req.body;
      const activated_by = req.user?.id;

      if (!activated_by) {
        return res.status(200).json({ status: false, message: "Campos obrigatórios em falta." });
      }

      const query = `
        UPDATE user_vouchers
        SET activated_by = ?, activated_at = CURRENT_TIMESTAMP
        WHERE user_voucher_id = ?
      `;

      const { rows } = await db.query(query, [activated_by, userVoucherId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Voucher de utilizador não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Voucher ativado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao ativar o voucher.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getUserVouchers(req, res, next) {
    try {
      const userId = req.params.userId;

      // Verificação básica para garantir que userId seja fornecido
      if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Bad Request", message: "O ID do utilizador é obrigatório." });
      }

      const query = `
        SELECT v.*, uv.assigned_at, uv.assigned_by, uv.activated_at, uv.activated_by
        FROM vouchers v
        JOIN user_vouchers uv ON v.voucher_id = uv.voucher_id
        WHERE uv.assigned_to = ?
        ORDER BY uv.assigned_at DESC
      `;

      // Executando a consulta no banco de dados
      const { rows } = await db.query(query, [userId]);

      // Verificando se não foram encontrados vouchers
      if (rows.length === 0) {
        return res.status(StatusCodes.OK).json({ status: true, data: [], message: "Nenhum voucher encontrado para este utilizador." });
      }

      // Retornando os dados dos vouchers
      return res.status(StatusCodes.OK).json({ status: true, data: rows });
    } catch (ex) {
      // Logando o erro e retornando uma resposta de erro
      Logger.error("Ocorreu um erro ao buscar os vouchers do utilizador.", ex);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }
}

module.exports = VouchersController;
