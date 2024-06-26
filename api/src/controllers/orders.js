const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");

class OrdersController {
  static async addProduct(req, res, next) {
    try {
      const { name, description, price, is_active, stock } = req.body;

      if (!name || !price) {
        return res.status(200).json({ status: false, message: "Name and Price are required." });
      }

      const query = `
        INSERT INTO products (name, description, price, is_active, stock)
        VALUES (?, ?, ?, ?, ?)
      `;

      await db.query(query, [name, description, price, is_active, stock]);

      return res.status(201).json({ status: true, message: "Product added successfully." });
    } catch (ex) {
      Logger.error("An error occurred while adding product.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error", message: ex.message });
    }
  }

  static async getAllProducts(req, res, next) {
    try {
      const { page = 1, limit = 15, orderBy = "product_id", order = "ASC" } = req.body.pagination || {};

      let query = `
        SELECT *
        FROM products
        WHERE 1 = 1
      `;

      let totalCountQuery = `
        SELECT COUNT(*) as count
        FROM products
        WHERE 1 = 1
      `;

      const params = [];

      // Filters
      if (req.body.filters) {
        const { name, priceRange } = req.body.filters;

        if (name) {
          query += ` AND name LIKE ?`;
          totalCountQuery += ` AND name LIKE ?`;
          params.push(`%${name}%`);
        }

        if (priceRange) {
          const { min, max } = priceRange;
          query += ` AND price BETWEEN ? AND ?`;
          totalCountQuery += ` AND price BETWEEN ? AND ?`;
          params.push(min, max);
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
      Logger.error("An error occurred while fetching products.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error", message: ex.message });
    }
  }

  static async getProduct(req, res, next) {
    try {
      const productId = req.params.id;

      const query = `
      SELECT *
      FROM products
      WHERE product_id = ?
    `;

      const result = await db.query(query, [productId]);

      if (result.rows.length === 0) {
        return res.status(200).json({ status: false, message: "Produto não encontrado." });
      }

      return res.status(200).json({ status: true, data: result.rows[0] });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o produto.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const productId = req.params.id;
      const { name, description, price, is_active, stock } = req.body;

      const query = `
      UPDATE products
      SET name = ?, description = ?, price = ?, is_active = ?, stock = ?
      WHERE product_id = ?
    `;

      const { rows }  = await db.query(query, [name, description, price, is_active, stock, productId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Produto não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Produto atualizado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar o produto.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const productId = req.params.id;

      const query = `
      DELETE FROM products
      WHERE product_id = ?
    `;

      const { rows } = await db.query(query, [productId]);

      if (rows.length === 0) {
        return res.status(200).json({ status: false, message: "Produto não encontrado." });
      }

      return res.status(200).json({ status: true, message: "Produto eliminado com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao eliminar o produto.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async addOrder(req, res, next) {
    try {
      const { user_id, order_items } = req.body;

      if (!user_id || !order_items || !order_items.length) {
        return res.status(200).json({ status: false, message: "User ID and Order Items are required." });
      }

      // Calculate total price
      let totalPrice = 0;
      for (const item of order_items) {
        const product = await db.query("SELECT price FROM products WHERE product_id = ?", [item.product_id]);
        if (product.length) {
          totalPrice += product[0].price * item.quantity;
        }
      }

      const orderQuery = `
        INSERT INTO orders (user_id, total_price, status)
        VALUES (?, ?, 'pending')
      `;

      const { insertId: orderId } = await db.query(orderQuery, [user_id, totalPrice]);

      for (const item of order_items) {
        const orderItemQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `;
        await db.query(orderItemQuery, [orderId, item.product_id, item.quantity, item.price]);
      }

      return res.status(201).json({ status: true, message: "Order created successfully." });
    } catch (ex) {
      Logger.error("An error occurred while creating order.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error", message: ex.message });
    }
  }

  static async getAllOrders(req, res, next) {
    try {
      const { page = 1, limit = 15, orderBy = "order_id", order = "ASC" } = req.body.pagination || {};

      let query = `
        SELECT 
          o.order_id, 
          o.user_id, 
          o.total_price, 
          o.status, 
          o.created_at, 
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.birthdate,
          CONCAT(
        '[',
        GROUP_CONCAT(
            CONCAT(
                '{"product_id": ', p.product_id, 
                ', "name": "', p.name, 
                '", "description": "', p.description, 
                '", "price": ', p.price, 
                ', "quantity": ', oi.quantity, 
                '}'
            )
            SEPARATOR ', '
        ),
        ']'
    ) AS products
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE 1 = 1
    `;

      let totalCountQuery = `
      SELECT COUNT(*) as count
      FROM orders
      WHERE 1 = 1
    `;

      const params = [];

      // Filters
      if (req.body.filters) {
        const { user_id, status, dateRange } = req.body.filters;

        if (user_id) {
          query += ` AND o.user_id = ?`;
          totalCountQuery += ` AND user_id = ?`;
          params.push(user_id);
        }

        if (status) {
          query += ` AND o.status = ?`;
          totalCountQuery += ` AND o.status = ?`;
          params.push(status);
        }

        if (dateRange) {
          const { start, end } = dateRange;
          query += ` AND DATE(o.created_at) BETWEEN ? AND ?`;
          totalCountQuery += ` AND DATE(o.created_at) BETWEEN ? AND ?`;
          params.push(start, end);
        }
      }

      const offset = (page - 1) * limit;

      query += ` GROUP BY o.order_id, u.user_id ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const { rows } = await db.query(query, params);
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2));

      let sendObject = rows.map((row) => {
        return {
          ...row,
          products: row.products ? JSON.parse(row.products) : [],
        };
      });

      return res.status(200).json({
        status: true,
        data: sendObject,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("An error occurred while fetching orders.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error", message: ex.message });
    }
  }
}

module.exports = OrdersController;
