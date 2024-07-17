const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");

class AcessosController {
  static async RegisterEntry(req, res, next) {
    try {
      const { userEmail, userPhone, locationId } = req.body;

      if ((!userEmail && !userPhone) || !locationId) {
        return res.status(200).json({ status: false, message: "O email ou o telefone do utilizador e o ID da localização são obrigatórios." });
      }

      // Verificar se o utilizador que faz a requisição é um administrador
      if (req.user.user_type !== "admin") {
        return res.status(200).json({ status: false, error: "Forbidden", message: "Apenas os administradores podem registar entradas." });
      }

      let checkExistenceQuery, existenceParams, userIdentifier;

      if (userEmail) {
        checkExistenceQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE email = ?) AS user_exists,
          (SELECT COUNT(*) FROM locations WHERE location_id = ?) AS location_exists
      `;
        existenceParams = [userEmail, locationId];
        userIdentifier = { column: "email", value: userEmail };
      } else {
        checkExistenceQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE phone = ?) AS user_exists,
          (SELECT COUNT(*) FROM locations WHERE location_id = ?) AS location_exists
      `;
        existenceParams = [userPhone, locationId];
        userIdentifier = { column: "phone", value: userPhone };
      }

      const { rows: existenceResult } = await db.query(checkExistenceQuery, existenceParams);

      const userExists = existenceResult[0].user_exists;
      const locationExists = existenceResult[0].location_exists;

      if (userExists === 0) {
        return res.status(200).json({ status: false, message: "Utilizador não encontrado." });
      }

      if (locationExists === 0) {
        return res.status(200).json({ status: false, message: "Localização não encontrada." });
      }

      // Verificar se o utilizador tem alguma entrada nos últimos 10 minutos
      const recentEntryQuery = `
      SELECT entry_id
      FROM entries
      WHERE user_id = (SELECT user_id FROM users WHERE ${userIdentifier.column} = ?) AND entry_time >= NOW() - INTERVAL 10 MINUTE
    `;
      const { rows } = await db.query(recentEntryQuery, [userIdentifier.value]);

      if (rows.length > 0) {
        return res.status(400).json({ status: false, message: "O utilizador já registou uma entrada nos últimos 10 minutos." });
      }

      const query = `
      INSERT INTO entries (user_id, location_id)
      VALUES ((SELECT user_id FROM users WHERE ${userIdentifier.column} = ?), ?)
    `;
      const values = [userIdentifier.value, locationId];
      const { rows: entrada } = await db.query(query, values);
      const entradaId = entrada.insertId;

      return res.status(200).json({ status: true, message: "Entrada registada com sucesso." });
    } catch (error) {
      Logger.error("Erro ao registar entrada:", error);
      return res.status(200).json({ status: false, message: "Erro ao registar entrada." });
    }
  }

  static async ValidateEntries(req, res) {
    try {
      const { entryIds } = req.body;
      const adminId = req?.user?.id;

      if (!adminId || !entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
        return res.status(200).json({ status: false, message: "Parâmetros inválidos." });
      }

      // Verificar se o user que faz a requisição é um admin
      if (req.user.user_type !== "admin") {
        return res.status(200).json({ status: false, error: "Proibido", message: "Apenas administradores podem atualizar utilizadores" });
      }

      // Verificar se todos os elementos em entryIds são números
      if (!entryIds.every((id) => typeof id === "number")) {
        return res.status(200).json({ status: false, message: "Todos os elementos em entryIds devem ser números." });
      }

      // Safe-check: Filtrar apenas as entryIds que ainda não foram validadas
      const unvalidatedEntryIds = await AcessosController.filterUnvalidatedEntryIds(entryIds);

      // Verificar se ainda há entryIds após o filtro
      if (unvalidatedEntryIds.length === 0) {
        return res.status(200).json({ status: false, message: "Todas as entryIds fornecidas já foram validadas." });
      }

      // Se todos os elementos em entryIds são números, continua
      const entryIdPlaceholders = unvalidatedEntryIds.map(() => "?").join(", ");
      const values = [adminId, ...unvalidatedEntryIds];

      const query = `
                UPDATE entries 
                SET validated_by = ?, validated_at = NOW() 
                WHERE entry_id IN (${entryIdPlaceholders}) AND validated_by IS NULL
        `;
      const { rows } = await db.query(query, values);
      const totalUpdated = rows.affectedRows;

      if (totalUpdated === 0) {
        return res.status(200).json({ status: false, message: "Entrada inválida" });
      }

      const ValidateCards = await AcessosController.CardLogic(unvalidatedEntryIds);

      if (!ValidateCards.status || ValidateCards.failedIds.length > 0) {
        Logger.error("Ocorreu um problema com a lógica de entradas de cartões");
        console.error(ValidateCards.failedIds);
        return res.status(200).json({ status: false, message: "Nem todas as entradas foram validadas com sucesso" });
      }

      return res.status(200).json({ status: true, message: "Todas as entradas foram validadas com sucesso" });
    } catch (error) {
      Logger.error("Erro ao validar entradas:", error);
      return res.status(200).json({ status: false, message: "Erro ao validar entradas." });
    }
  }

  static async filterUnvalidatedEntryIds(entryIds) {
    const unvalidatedEntryIds = [];
    for (const entryId of entryIds) {
      // Verificar se a entrada já foi validada
      const { rows: validationStatus } = await db.query("SELECT validated_by FROM entries WHERE entry_id = ?", [entryId]);
      if (!validationStatus[0].validated_by) {
        unvalidatedEntryIds.push(entryId);
      }
    }
    return unvalidatedEntryIds;
  }

  static async CardLogic(entryIds) {
    try {
      if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
        return { status: false, successCount: 0, failedCount: 0, successfulIds: [], failedIds: [] };
      }

      const MAX_ENTRIES_PER_CARD = 10;
      let successCount = 0;
      let failedCount = 0;
      const successfulIds = [];
      const failedIds = [];

      for (const entryId of entryIds) {
        try {
          // Verificar se o utilizador já possui um cartão ativo
          const { rows: existingCard } = await db.query(
            `SELECT card_id, entry_count FROM entry_cards
              WHERE user_id = (SELECT user_id FROM entries WHERE entry_id = ?) AND is_active = 1
            `,
            [entryId]
          );

          if (existingCard.length === 0) {
            // Se não tem cartão nem está ativo, criar um novo cartão
            const { rows: newCard } = await db.query("INSERT INTO entry_cards (user_id) VALUES ((SELECT user_id FROM entries WHERE entry_id = ?))", [entryId]);
            const cardId = newCard.insertId;

            // Criar uma entrada no card_entries
            await db.query("INSERT INTO card_entries (card_id, entry_id, num_of_entries) VALUES (?, ?, ?)", [cardId, entryId, 1]);

            successCount++;
            successfulIds.push(entryId);
          } else {
            // Se já tem cartão, então vamos adicionar uma entrada a este cartão
            const cardId = existingCard[0].card_id;
            const entryCount = parseInt(existingCard[0].entry_count);

            if (entryCount + 1 <= MAX_ENTRIES_PER_CARD) {
              // Define se é especial ou não baseado na quantidade de entradas
              const isSpecial = entryCount + 1 === MAX_ENTRIES_PER_CARD ? 1 : 0;
              const isCardActive = entryCount + 1 === MAX_ENTRIES_PER_CARD ? 0 : 1;

              await db.query(
                `UPDATE entry_cards 
                    SET entry_count = entry_count + 1, is_active = ? 
                WHERE card_id = ?`,
                [isCardActive, cardId]
              );

              await db.query(
                `INSERT INTO card_entries 
                  (card_id, entry_id, num_of_entries, is_special)
                VALUES (?, ?, ?, ?)`,
                [cardId, entryId, entryCount + 1, isSpecial]
              );

              successCount++;
              successfulIds.push(entryId);
            } else {
              failedCount++;
              failedIds.push(entryId);
            }
          }
        } catch (error) {
          Logger.error("Erro ao processar entrada:", error);
          failedCount++;
          failedIds.push(entryId);
        }
      }

      return { status: true, successCount, failedCount, successfulIds, failedIds };
    } catch (error) {
      Logger.error("Erro ao validar a lógica de cartões:", error);
      return { status: false, successCount: 0, failedCount: entryIds.length, successfulIds: [], failedIds: entryIds };
    }
  }
}

module.exports = AcessosController;
