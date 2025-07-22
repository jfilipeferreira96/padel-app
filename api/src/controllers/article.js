const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");

class ArticlesController {
  static async addArticle(req, res, next) {
    try {
      const { title, content, image_path, download_path, is_active, date } = req.body;

      if (!title) {
        return res.status(200).json({ status: false, message: "Título  são obrigatórios." });
      }

      const query = `
        INSERT INTO articles (title, content, image_path, download_path, user_id, is_active, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const { rows: newArticle } = await db.query(query, [title, content, image_path, download_path ?? image_path, req.user?.id, is_active, date]);

      const articleId = newArticle.insertId;
      // Loop dos arquivos enviados
      // Verifica se req.files é um array de arquivos
      if (Array.isArray(req.files) && req.files.length > 0) {
        // Loop através dos arquivos enviados e mova-os para a pasta de armazenamento
        req.files.forEach((file) => {
          const fileName = file.originalname;

          const storagePath = `src/uploads/${articleId}`;
          //Tratamento de ficheiros
          if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
          }

          const filePath = path.join(storagePath, fileName);
          fs.writeFileSync(filePath, file.buffer);
        });
      }

      return res.status(201).json({ status: true, message: "Artigo adicionado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao adicionar o artigo.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getAllArticles(req, res, next) {
    try {
      const { page = 1, limit = 15, orderBy = "id", order = "ASC" } = req.body.pagination || {};

      let query = `
        SELECT articles.*, users.first_name, users.last_name
        FROM articles
        LEFT JOIN users ON articles.user_id = users.user_id
        WHERE 1 = 1
      `;

      let totalCountQuery = `
        SELECT COUNT(*) as count
        FROM articles
        LEFT JOIN users ON articles.user_id = users.user_id
        WHERE 1 = 1
      `;

      const params = [];

      // Filtros
      if (req.body.filters) {
        const { title } = req.body.filters;

        if (title) {
          query += ` AND articles.title LIKE ?`;
          totalCountQuery += ` AND articles.title LIKE ?`;
          params.push(`%${title}%`);
        }
      }

      const offset = (page - 1) * limit;

      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const { rows } = await db.query(query, params);
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2)); // Remover parâmetros de limite e offset

      const data = rows.map((row) => ({
        ...row,
        author: `${row.first_name} ${row.last_name}`,
      }));

      return res.status(200).json({
        status: true,
        data,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os artigos.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getArticle(req, res, next) {
    try {
      const articleId = req.params.id;

      const query = `
      SELECT *
      FROM articles
      WHERE id = ?
    `;

      const result = await db.query(query, [articleId]);

      if (result.rows.length === 0) {
        return res.status(200).json({ status: false, message: "Artigo não encontrado." });
      }

      return res.status(200).json({ status: true, data: result.rows[0] });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o artigo.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async updateArticle(req, res, next) {
    try {
      const articleId = req.params.id;

      // Verifica se o artigo existe antes de tentar atualizá-lo
      const findArticleQuery = `
        SELECT * FROM articles WHERE id = ?
      `;
      const articleResult = await db.query(findArticleQuery, [articleId]);

      if (articleResult.rows.length === 0) {
        return res.status(404).json({ status: false, message: "Artigo não encontrado." });
      }

      const currentIsActive = articleResult.rows[0].is_active;
      const newIsActive = currentIsActive === 1 ? 0 : 1;

      const updateQuery = `
        UPDATE articles SET is_active = ? WHERE id = ?
      `;
      await db.query(updateQuery, [newIsActive, articleId]);

      return res.status(200).json({ status: true, message: "Artigo atualizado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar o artigo.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async deleteArticle(req, res, next) {
    try {
      const articleId = req.params.id;

      const query = `
      DELETE FROM articles
      WHERE id = ?
    `;

      const { rows } = await db.query(query, [articleId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Artigo não encontrado." });
      }

      const storagePath = path.join(__dirname, "../uploads", articleId.toString());

      if (fs.existsSync(storagePath)) {
        // Verifica se é um diretório antes de tentar removê-lo
        if (fs.lstatSync(storagePath).isDirectory()) {
          fs.rmdirSync(storagePath, { recursive: true });
        } else {
          // Caso não seja um diretório, trata como um erro (embora isso seja improvável aqui)
          Logger.error(`O caminho ${storagePath} não é um diretório.`);
        }
      }

      return res.status(200).json({ status: true, message: "Artigo eliminado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao eliminar o artigo.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }
}

module.exports = ArticlesController;
