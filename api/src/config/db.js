const mysql = require("mysql2/promise");
const Logger = require("../utils/logger");
require("dotenv").config();

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DBNAME,
        port: process.env.DB_PORT,
      });

      // Testar a conexão ao criar o pool
      await this.pool.query("SELECT 1");

      Logger.info("Connected to the database " + process.env.DB_DBNAME);
    } catch (error) {
      Logger.error("Failed to connect to the database:", error.message);
    }
  }

  async query(queryText, queryParams) {
    if (!this.pool) {
      throw new Error("Database pool not initialized. Call connect() first.");
    }

    try {
      const [rows, fields] = await this.pool.query(queryText, queryParams);

      return { rows, fields };
    } catch (error) {
      throw new Error("Error executing query: " + error.message);
    }
  }
}

module.exports = new Database();
