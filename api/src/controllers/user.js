const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

class UserController {
  static generateAccessToken(user) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      Logger.error("JWT_SECRET is not defined in the environment.");
    }

    return jwt.sign(user, secret, { expiresIn: "30d" });
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(200).json({ status: false, error: "Pedido Inválido", message: "Email e password são obrigatórios" });
      }

      const query = `
            SELECT u.*, 
            (
              SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
                'offpeak_card_id', uoc.offpeak_card_id,
                'name', oc.name,
                'month', oc.month,
                'year', oc.year,
                'assigned_by', uoc.assigned_by,
                'assigned_by_first_name', IFNULL(au.first_name, ''),
                'assigned_by_last_name', IFNULL(au.last_name, ''),
                'assigned_at', uoc.assigned_at
              )), ']') AS offpeaks
              FROM user_offpeak_cards uoc
              JOIN offpeak_cards oc ON uoc.offpeak_card_id = oc.offpeak_card_id
              LEFT JOIN users au ON uoc.assigned_by = au.user_id
              WHERE uoc.user_id = u.user_id
          ) AS offpeaks
            FROM users u
            WHERE u.email = ?
        `;

      const { rows } = await db.query(query, [email]);

      if (rows.length === 0) {
        return res.status(200).json({ error: "Não Autorizado", status: false, message: "Email ou Password incorretos" });
      }

      const user = rows[0];

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(200).json({ error: "Não Autorizado", status: false, message: "Email ou Password incorretos" });
      }

      let locations = [];

      if (user.user_type === "admin") {
        const locationsQuery = `
                SELECT al.location_id, l.name as location_name 
                FROM admin_locations al 
                LEFT JOIN locations l ON al.location_id = l.location_id 
                WHERE al.admin_id = ?
            `;
        const locationsResult = await db.query(locationsQuery, [user.user_id]);
        locations = locationsResult.rows;
      }

      const accessToken = UserController.generateAccessToken({
        id: user.user_id,
        email: user.email,
        user_type: user.user_type,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        birthdate: user.birthdate,
        locations,
        video_credits: user.video_credits,
        offpeaks: JSON.parse(user.offpeaks || "[]"),
      });

      return res.json({
        status: true,
        user: {
          id: user.user_id,
          email: user.email,
          user_type: user.user_type,
          first_name: user.first_name,
          last_name: user.last_name,
          birthdate: user.birthdate,
          phone: user.phone,
          locations,
          video_credits: user.video_credits,
          offpeaks: JSON.parse(user.offpeaks || "[]"),
        },
        accessToken,
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro durante o login.", ex);
      res.status(500).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async register(req, res, next) {
    try {
      const { email, phone, password, first_name, last_name, birthdate, user_type, locations } = req.body;

      if (!email || !password) {
        return res.status(200).json({ status: false, error: "Pedido Inválido", message: "Email e password são obrigatórios" });
      }

      const query = "SELECT * FROM users WHERE email = ?";
      const { rows } = await db.query(query, [email]);

      if (rows.length > 0) {
        return res.status(200).json({ error: "Pedido Inválido", message: "Email já em uso" });
      }

      if (phone) {
        const queryPhone = "SELECT * FROM users WHERE phone = ?";
        const { rows: phoneResult } = await db.query(queryPhone, [phone]);

        if (phoneResult.length > 0) {
          return res.status(200).json({ error: "Pedido Inválido", message: "Nº de telemóvel já está em uso" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const formattedBirthdate = birthdate ? new Date(birthdate).toISOString().slice(0, 19).replace("T", " ") : null;

      let newUser;

      if (user_type === "admin") {
        const insertQuery = "INSERT INTO users (password, email, phone, first_name, last_name, birthdate, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)";
        newUser = await db.query(insertQuery, [hashedPassword, email, phone, first_name, last_name, formattedBirthdate, "admin"]);

        if (locations && Array.isArray(locations) && locations.length > 0) {
          const admin_id = newUser.rows.insertId;

          const insertLocationsQuery = "INSERT INTO admin_locations (admin_id, location_id) VALUES ";
          const values = locations.map((loc) => `(${admin_id}, ${loc.value})`).join(", ");

          await db.query(insertLocationsQuery + values);
        }
      } else {
        const insertQuery = "INSERT INTO users (password, email, phone, first_name, last_name, birthdate, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)";
        newUser = await db.query(insertQuery, [hashedPassword, email, phone, first_name, last_name, formattedBirthdate, "player"]);
      }

      const accessToken = UserController.generateAccessToken({
        id: newUser.rows.insertId,
        email: email,
        user_type: user_type === "admin" ? "admin" : "player",
        first_name: first_name,
        last_name: last_name,
        phone: phone,
        phone: phone,
        birthdate: birthdate,
        offpeaks: [],
      });

      return res.status(201).json({
        status: true,
        user: {
          id: newUser.rows.insertId,
          email: email,
          phone: phone,
        },
        accessToken,
        offpeaks: [],
      });
    } catch (ex) {
      Logger.error("An error occurred during registration.", ex);
      res.status(500).json({ error: "Internal Server Error", message: ex.message });
    }
  }

  static async createAccount(req, res, next) {
    try {
      const { email, password, first_name, last_name, birthdate, user_type, locations } = req.body;

      if (!email || !password) {
        return res.status(200).json({ status: false, error: "Bad Request", message: "Email and password are required" });
      }

      const query = "SELECT * FROM users WHERE email = ?";
      const { rows } = await db.query(query, [email]);

      if (rows.length > 0) {
        return res.status(200).json({ error: "Bad Request", message: "Email already used" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery = "INSERT INTO users (password, email, first_name, last_name, birthdate, user_type) VALUES (?, ?, ?, ?, ?, ?)";
      const newUser = await db.query(insertQuery, [hashedPassword, email, first_name, last_name, birthdate, user_type]);
      const userId = newUser.rows.insertId;

      if (user_type === "admin" && locations) {
      }

      return res.status(201).json({
        status: true,
        user: {
          id: userId,
          email: email,
        },
      });
    } catch (ex) {
      Logger.error("An error occurred during registration.", ex);
      res.status(500).json({ error: "Internal Server Error", message: ex.message });
    }
  }

  static async getSingleUser(req, res, next) {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(200).json({ error: "Invalid user ID" });
    }

    try {
      const query = `
            SELECT u.*, 
            (
              SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
                'offpeak_card_id', uoc.offpeak_card_id,
                'name', oc.name,
                'month', oc.month,
                'year', oc.year,
                'assigned_by', uoc.assigned_by,
                'assigned_by_first_name', IFNULL(au.first_name, ''),
                'assigned_by_last_name', IFNULL(au.last_name, ''),
                'assigned_at', uoc.assigned_at
              )), ']') AS offpeaks
              FROM user_offpeak_cards uoc
              JOIN offpeak_cards oc ON uoc.offpeak_card_id = oc.offpeak_card_id
              LEFT JOIN users au ON uoc.assigned_by = au.user_id
              WHERE uoc.user_id = u.user_id
          ) AS offpeaks
            FROM users u
            WHERE u.user_id = ?
        `;

      const { rows } = await db.query(query, [id]);

      if (rows.length === 0) {
        return res.status(200).json({ error: "User not found" });
      }

      const data = rows[0];
      let locations = [];
      if (data.user_type === "admin") {
        const locationsQuery = `
          SELECT al.location_id, l.name as location_name 
          FROM admin_locations al 
          LEFT JOIN locations l ON al.location_id = l.location_id 
          WHERE al.admin_id = ?
        `;

        const locationsResult = await db.query(locationsQuery, [data.user_id]);
        locations = locationsResult.rows;
      }

      const user = {
        ...rows[0],
        locations,
        offpeaks: JSON.parse(rows[0].offpeaks),
      };

      return res.status(200).json(user);
    } catch (error) {
      Logger.error(`An error occurred while fetching user with ID ${id}:`, error);
      return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 15, orderBy = "user_id", order = "ASC" } = req.body.pagination || {};

      const validOrderFields = ["user_id", "first_name", "created_at", "current_credit"];
      const validOrderDirections = ["ASC", "DESC"];

      // Segurança extra contra SQL injection
      const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : "user_id";
      const safeOrder = validOrderDirections.includes(order?.toUpperCase()) ? order.toUpperCase() : "ASC";

      let query = `
      SELECT 
        u.*,

        (
          SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
              'offpeak_card_id', uoc.offpeak_card_id,
              'name', oc.name,
              'month', oc.month,
              'year', oc.year,
              'assigned_by', uoc.assigned_by,
              'assigned_by_first_name', IFNULL(au.first_name, ''),
              'assigned_by_last_name', IFNULL(au.last_name, ''),
              'assigned_at', uoc.assigned_at
            )), ']') AS offpeaks
            FROM user_offpeak_cards uoc
            JOIN offpeak_cards oc ON uoc.offpeak_card_id = oc.offpeak_card_id
            LEFT JOIN users au ON uoc.assigned_by = au.user_id
            WHERE uoc.user_id = u.user_id
        ) AS offpeaks,

        (
          SELECT SUM(uv.credit_balance)
          FROM user_vouchers uv
          WHERE uv.assigned_to = u.user_id AND uv.is_active = 1 AND uv.credit_balance IS NOT NULL
        ) AS current_credit

      FROM users u
      WHERE u.email != "admin1@mail.com"
    `;

      let totalCountQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE email != "admin1@mail.com"
    `;

      const params = [];

      if (req.body.filters) {
        const { user_type, created_at, email, name, phone } = req.body.filters;

        if (user_type) {
          query += ` AND u.user_type = ?`;
          totalCountQuery += ` AND user_type = ?`;
          params.push(user_type);
        }

        if (created_at) {
          query += ` AND DATE(u.created_at) = ?`;
          totalCountQuery += ` AND DATE(created_at) = ?`;
          params.push(created_at);
        }

        const searchValue = email || name || phone;
        if (searchValue) {
          query += `
          AND (
            u.email LIKE ? 
            OR u.phone LIKE ? 
            OR u.first_name LIKE ? 
            OR u.last_name LIKE ?
            OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
          )`;

          totalCountQuery += `
          AND (
            email LIKE ? 
            OR phone LIKE ? 
            OR first_name LIKE ? 
            OR last_name LIKE ?
            OR CONCAT(first_name, ' ', last_name) LIKE ?
          )`;
          const pattern = `%${searchValue}%`;
          params.push(pattern, pattern, pattern, pattern, pattern);
        }
      }

      const offset = (page - 1) * limit;

      let orderByClause;
      if (safeOrderBy === "current_credit") {
        orderByClause = `
        ORDER BY (
          SELECT SUM(uv.credit_balance)
          FROM user_vouchers uv
          WHERE uv.assigned_to = u.user_id AND uv.is_active = 1 AND uv.credit_balance IS NOT NULL
        ) ${safeOrder}
      `;
      } else {
        orderByClause = `ORDER BY u.${safeOrderBy} ${safeOrder}`;
      }

      query += ` ${orderByClause} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const { rows } = await db.query(query, params);
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2));

      const users = rows.map((row) => ({
        ...row,
        offpeaks: row.offpeaks ? JSON.parse(row.offpeaks) : [],
      }));

      return res.status(200).json({
        status: true,
        data: users,
        pagination: {
          page,
          limit,
          orderBy: safeOrderBy,
          order: safeOrder,
          total: parseInt(totalCountRows[0].count),
        },
      });
    } catch (ex) {
      Logger.error("Erro ao buscar utilizadores", ex);
      res.status(500).json({
        error: "Erro Interno do Servidor",
        message: ex.message,
      });
    }
  }

  static async deleteUser(req, res, next) {
    const userId = req.params.id;

    try {
      // Verificar se o user que faz a requisição é um admin
      if (req.user.user_type !== "admin") {
        return res.status(200).json({ status: false, error: "Forbidden", message: "Only admins can delete users" });
      }

      const deleteQuery = "DELETE FROM users WHERE user_id = ?";
      const { rows } = await db.query(deleteQuery, [userId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, error: "Not Found", message: "User not found" });
      }

      return res.status(200).json({
        status: true,
        message: "User deleted successfully",
      });
    } catch (ex) {
      Logger.error("An error occurred while deleting user.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error", message: ex.message });
    }
  }

  static async updateUser(req, res, next) {
    const userId = req.params.id;
    const { email, first_name, last_name, birthdate, user_type = "player", locations, phone } = req.body;

    try {
      if (!req.body) {
        return res.json({ status: false, error: "Pedido Inválido", message: "O corpo do pedido está em falta" });
      }

      // Verificar se o utilizador que faz a requisição é um administrador
      if (req.user.user_type !== "admin") {
        return res.json({ status: false, error: "Proibido", message: "Apenas administradores podem atualizar utilizadores" });
      }

      // Verificar se o e-mail já está em uso por outro utilizador
      const checkEmailQuery = "SELECT * FROM users WHERE email = ? AND user_id != ?";
      const { rows: emailRows } = await db.query(checkEmailQuery, [email, userId]);

      if (emailRows.length > 0) {
        return res.json({ status: false, error: "Conflito", message: "O email já está em uso" });
      }

      // Verificar se o utilizador existe
      const checkUserQuery = "SELECT * FROM users WHERE user_id = ?";
      const { rows: userRows } = await db.query(checkUserQuery, [userId]);

      if (userRows.length === 0) {
        return res.json({ status: false, error: "Não Encontrado", message: "Utilizador não encontrado" });
      }

      // Atualizar o utilizador
      const updateQuery = `
      UPDATE users
      SET email = ?, first_name = ?, last_name = ?, phone = ?, birthdate = ?, user_type = ?
      WHERE user_id = ?
    `;
      const formattedBirthdate = birthdate ? new Date(birthdate).toISOString().slice(0, 19).replace("T", " ") : null;
      await db.query(updateQuery, [email, first_name, last_name, phone, formattedBirthdate, user_type, userId]);

      // Se o utilizador for do tipo admin e locations for zero ou não definido, apagar todas as entradas de admin_locations
      if (user_type === "admin" && (!locations || locations.length === 0)) {
        // Apagar todas as entradas existentes do admin_locations para o utilizador
        const deleteQuery = "DELETE FROM admin_locations WHERE admin_id = ?";
        await db.query(deleteQuery, [userId]);
      } else if (user_type === "admin" && locations && locations.length > 0) {
        // Se houver locations, atualizar admin_locations
        // Apagar todas as entradas existentes do admin_locations para o utilizador
        const deleteQuery = "DELETE FROM admin_locations WHERE admin_id = ?";
        await db.query(deleteQuery, [userId]);

        // Inserir novas entradas para as locations recebidas
        const insertLocationsQuery = "INSERT INTO admin_locations (admin_id, location_id) VALUES ";
        const values = locations.map((loc) => `(${userId}, ${loc.value})`).join(", ");

        await db.query(insertLocationsQuery + values);
      }

      return res.status(200).json({
        status: true,
        user: {
          email,
          first_name,
          last_name,
          birthdate,
          user_type,
          phone,
          id: userId,
        },
        message: "Utilizador atualizado com sucesso",
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar o utilizador.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getUserEntryCards(req, res, next) {
    const userId = req.params.id;

    try {
      // Verificar se o utilizador solicitado é o mesmo que está a fazer a requisição
      if (req.user?.id !== parseInt(userId) && req.user?.user_type !== "admin") {
        return res.status(200).json({ status: false, error: "Forbidden", message: "You are not allowed to access this resource" });
      }

      // Consultar os cartões de entrada do utilizador
      const activeCardsQuery = `
        SELECT *
        FROM entry_cards 
        WHERE entry_cards.user_id = ? AND entry_cards.is_active = 1
      `;

      const { rows: activeCards } = await db.query(activeCardsQuery, [userId]);

      const lastCompletedCardQuery = `
          SELECT 
          ec.card_id,
          ec.user_id,
          ec.created_at AS card_created_at,
          SUM(ce.num_of_entries) AS total_entries,
          MAX(e.entry_time) AS last_updated
        FROM 
          entry_cards ec
        JOIN 
          card_entries ce ON ec.card_id = ce.card_id
        JOIN 
          entries e ON ce.entry_id = e.entry_id
        WHERE 
          ec.user_id = ?
          AND ec.is_active = 0
          AND ec.entry_count = 10
        GROUP BY 
          ec.card_id
        ORDER BY 
          last_updated DESC
        LIMIT 1;
      `;

      const { rows: completedCard } = await db.query(lastCompletedCardQuery, [userId]);

      return res.status(200).json({
        status: true,
        actual_card: activeCards,
        last_completed_card: completedCard.length ? completedCard[0] : null,
      });
    } catch (ex) {
      Logger.error("An error occurred while fetching user entry cards.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error", message: ex.message });
    }
  }

  static async updateOwnUser(req, res, next) {
    const userId = req.params.id;
    const { email, first_name, last_name, birthdate, password } = req.body;

    try {
      // Verificar se o utilizador está tentando atualizar o próprio perfil
      if (parseInt(req.user.id) !== parseInt(userId)) {
        return res.status(200).json({ error: "Permissão Negada", message: "Você não tem permissão para atualizar este utilizador" });
      }

      // Verificar se pelo menos um campo foi fornecido para atualização
      if (!email && !first_name && !last_name && !birthdate && !password) {
        return res.status(200).json({ error: "Pedido Inválido", message: "Nenhum dado novo fornecido para atualização" });
      }

      // Verificar se o e-mail já está em uso por outro utilizador (se fornecido)
      if (email) {
        const checkEmailQuery = "SELECT * FROM users WHERE email = ? AND user_id != ?";
        const { rows: emailRows } = await db.query(checkEmailQuery, [email, userId]);

        if (emailRows.length > 0) {
          return res.status(200).json({ error: "Conflito", message: "O email já está em uso por outro utilizador" });
        }
      }

      // Preparar campos para atualização
      const updateFields = [];
      const updateValues = [];

      if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }
      if (first_name) {
        updateFields.push("first_name = ?");
        updateValues.push(first_name);
      }
      if (last_name) {
        updateFields.push("last_name = ?");
        updateValues.push(last_name);
      }
      if (birthdate) {
        updateFields.push("birthdate = ?");
        const formattedBirthdate = new Date(birthdate).toISOString().slice(0, 19).replace("T", " ");
        updateValues.push(formattedBirthdate);
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push("password = ?");
        updateValues.push(hashedPassword);
      }

      // Executar a atualização se houver campos para atualizar
      if (updateFields.length > 0) {
        updateValues.push(userId); // Adicionar userId ao final dos valores para o WHERE clause

        const updateQuery = `
          UPDATE users
          SET ${updateFields.join(", ")}
          WHERE user_id = ?
        `;
        await db.query(updateQuery, updateValues);

        return res.status(200).json({ status: true, message: "Configurações atualizadas com sucesso" });
      } else {
        return res.status(200).json({ error: "Pedido Inválido", message: "Nenhum dado novo fornecido para atualização" });
      }
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar as configurações do utilizador.", ex);
      res.status(200).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async sendMail(to, subject, text, html) {
    let transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SEND_EMAIL,
        pass: process.env.SEND_EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    let mailOptions = {
      from: `"Pro Padel" <${process.env.SEND_EMAIL}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

    try {
      let info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  static async forgotPassword(req, res) {
    const { email } = req.body;

    try {
      const query = "SELECT * FROM users WHERE email = ?";
      const { rows } = await db.query(query, [email]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, error: "Pedido Inválido", message: "Email não encontrado" });
      }

      const user = rows[0];
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000); // Token expira em 1 hora

      const updateQuery = "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?";
      await db.query(updateQuery, [token, expires, email]);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

      const subject = "Redefinição de palavra-passe";
      const text = `Foi solicitado uma redefinição de palavra-passe. Por favor, clique no link a seguir ou cole no seu navegador para concluir o processo: ${resetLink}`;
      const html = `<p>Foi solicitado uma redefinição de palavra-passe.</p><p>Por favor, clique no link a seguir ou cole no seu navegador para concluir o processo:</p><a href="${resetLink}">${resetLink}</a>`;

      // Enviar email omitido por simplicidade
      await UserController.sendMail(email, subject, text, html);

      return res.status(200).json({ status: true, message: "Link de redefinição de palavra-passe enviado para o email" });
    } catch (error) {
      Logger.error("Erro ao enviar link de redefinição de palavra-passe", error);
      return res.status(500).json({ error: "Erro Interno do Servidor", message: error.message });
    }
  }

  static async resetPassword(req, res) {
    const { token, newPassword } = req.body;

    try {
      const query = "SELECT * FROM users WHERE reset_password_token IS NOT NULL AND reset_password_expires > NOW()";
      const { rows } = await db.query(query);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, error: "Pedido Inválido", message: "Token inválido ou expirado" });
      }

      const user = rows[0];

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE user_id = ?";
      await db.query(updateQuery, [hashedPassword, user.user_id]);

      return res.status(200).json({ status: true, message: "Palavra-passe redefinida com sucesso" });
    } catch (error) {
      Logger.error("Erro ao redefinir palavra-passe", error);
      return res.status(500).json({ error: "Erro Interno do Servidor", message: error.message });
    }
  }

  static async checkToken(req, res) {
    const { token } = req.params;
    try {
      // Verifica se o token foi fornecido
      if (!token) {
        return res.status(200).json({ status: false, message: "Token não fornecido" });
      }

      const query = "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()";
      const { rows } = await db.query(query, [token]);

      // Se não houver usuário com o token válido
      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Token inválido ou expirado" });
      }

      // Se o token for encontrado e não expirou
      return res.status(200).json({ status: true, message: "Token válido" });
    } catch (error) {
      Logger.error("Erro ao verificar o token", error);
      return res.status(500).json({ error: "Erro Interno do Servidor", message: error.message });
    }
  }
}

module.exports = UserController;
