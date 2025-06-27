const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const db = require("../config/db");
const Logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const axios = require("axios");
const moment = require("moment-timezone");

class VideoController {
  static async getCreditsHistory(req, res, next) {
    try {
      let query = `
          SELECT uch.*, 
                u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name, u.phone,
                a.email AS admin_email, a.first_name AS admin_first_name, a.last_name AS admin_last_name
          FROM users_credits_history uch
          LEFT JOIN users u ON uch.user_id = u.user_id
          LEFT JOIN users a ON uch.given_by = a.user_id
          WHERE 1 = 1
        `;

      let totalCountQuery = `
          SELECT COUNT(*) as count
          FROM users_credits_history uch
          LEFT JOIN users u ON uch.user_id = u.user_id
          LEFT JOIN users a ON uch.given_by = a.user_id
          WHERE 1 = 1
        `;

      const params = [];

      // Filtros
      if (req.body.filters) {
        const { email, name, phone, userId } = req.body.filters;

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
            u.email LIKE ? 
            OR u.phone LIKE ? 
            OR u.first_name LIKE ? 
            OR u.last_name LIKE ?
            OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
          )`;
          const searchPattern = `%${searchValue}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (userId) {
          query += ` AND uch.user_id = ?`;
          totalCountQuery += ` AND uch.user_id = ?`;
          params.push(userId);
        }
      }

      const { page = 1, limit = 15, orderBy = "uch.created_at", order = "DESC" } = req.body.pagination || {};
      const offset = (page - 1) * limit;

      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // Executar query principal
      const { rows } = await db.query(query, params);

      // Executar query de contagem total
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2));

      return res.status(200).json({
        status: true,
        data: rows,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o histórico de créditos.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getVideosProcessed(req, res, next) {
    try {
      const { name, email, phone, below_48h = true } = req.body.filters || {};
      const userId = req.body.userId;
      const { page = 1, limit = 15, orderBy = "vp.id", order = "ASC" } = req.body.pagination || {};

      // Passo 1: Buscar todos os vídeos que estão sendo processados para este Utilizador
      let queryVerifyIfIsProcessing = `
            SELECT vp.*, u.email, u.first_name, u.last_name, u.phone
            FROM videos_processed vp
            LEFT JOIN users u ON vp.user_id = u.user_id
            WHERE vp.user_id = ? AND vp.status = 'processing'
        `;
      const processingVideos = await db.query(queryVerifyIfIsProcessing, [userId]);

      // Para cada vídeo em processamento, verificar se o arquivo existe
      for (let video of processingVideos.rows) {
        const videoPath = `videos/${video.id}.mp4`;
        const checkFileUrl = `${process.env.URL_API_VIDEOS}/check-file?filepath=${videoPath}`;

        try {
          // Fazer requisição HTTP para verificar se o arquivo existe
          const response = await axios.get(checkFileUrl);
          const { exists } = response.data;

          // Verificar quanto tempo o vídeo está sendo processado
          const processingTimeInHours = (new Date() - new Date(video.created_at)) / (1000 * 60 * 60);

          let newStatus = "processing"; // Manter o status por padrão

          if (exists) {
            // Se o arquivo existir, atualizar o status para 'completed'
            newStatus = "completed";
          } else if (!exists && processingTimeInHours > 4) {
            // Se o arquivo não existir e o tempo for maior que 4 horas, marcar como 'failed'
            newStatus = "failed";
          }

          // Atualizar o status no banco de dados, se necessário
          if (newStatus !== "processing") {
            let updateStatusQuery = `
                        UPDATE videos_processed
                        SET status = ?, updated_at = NOW()
                        WHERE id = ?
                    `;
            await db.query(updateStatusQuery, [newStatus, video.id]);
          }
        } catch (err) {
          Logger.error(`Erro ao verificar arquivo do vídeo ID ${video.id}`, err);
        }
      }

      // Passo 2: Continuar a lógica de listagem com paginação e filtros
      let query = `
            SELECT vp.*, u.email, u.first_name, u.last_name, u.phone
            FROM videos_processed vp
            LEFT JOIN users u ON vp.user_id = u.user_id
            WHERE 1 = 1
        `;

      let totalCountQuery = `
            SELECT COUNT(*) as count
            FROM videos_processed vp
            LEFT JOIN users u ON vp.user_id = u.user_id
            WHERE 1 = 1
        `;

      const params = [];

      if (userId) {
        query += ` AND vp.user_id = ?`;
        totalCountQuery += ` AND vp.user_id = ?`;
        params.push(userId);
      }

      if (name) {
        query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ?)`;
        totalCountQuery += ` AND (u.first_name LIKE ? OR u.last_name LIKE ?)`;
        const searchPattern = `%${name}%`;
        params.push(searchPattern, searchPattern);
      }

      if (email) {
        query += ` AND u.email LIKE ?`;
        totalCountQuery += ` AND u.email LIKE ?`;
        params.push(`%${email}%`);
      }

      if (phone) {
        query += ` AND u.phone LIKE ?`;
        totalCountQuery += ` AND u.phone LIKE ?`;
        params.push(`%${phone}%`);
      }

      if (below_48h) {
        query += `
          AND (vp.validated_at IS NULL OR vp.validated_at >= NOW() - INTERVAL 48 HOUR)
        `;
        totalCountQuery += `
          AND (vp.validated_at IS NULL OR vp.validated_at >= NOW() - INTERVAL 48 HOUR)
        `;
      }

      const offset = (page - 1) * limit;

      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const { rows } = await db.query(query, params);
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2));

      return res.status(200).json({
        status: true,
        data: rows,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os vídeos processados.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getVideosWaiting(req, res, next) {
    try {
      const { name, email, phone } = req.body.filters || {};
      const userId = req.body.userId;
      const { page = 1, limit = 15, orderBy = "vp.id", order = "ASC" } = req.body.pagination || {};

      let query = `
          SELECT vp.*, u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name, u.phone, c.name as campo_name
          FROM videos_processed vp
          LEFT JOIN users u ON vp.user_id = u.user_id
          LEFT JOIN campos c ON vp.campo = c.value
          WHERE vp.status = 'waiting'
      `;

      let totalCountQuery = `
          SELECT COUNT(*) as count
          FROM videos_processed vp
          LEFT JOIN users u ON vp.user_id = u.user_id
          LEFT JOIN campos c ON vp.campo = c.value
          WHERE vp.status = 'waiting'
      `;

      const params = [];

      if (name) {
        query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ?)`;
        totalCountQuery += ` AND (u.first_name LIKE ? OR u.last_name LIKE ?)`;
        const searchPattern = `%${name}%`;
        params.push(searchPattern, searchPattern);
      }

      if (email) {
        query += ` AND u.email LIKE ?`;
        totalCountQuery += ` AND u.email LIKE ?`;
        params.push(`%${email}%`);
      }

      if (phone) {
        query += ` AND u.phone LIKE ?`;
        totalCountQuery += ` AND u.phone LIKE ?`;
        params.push(`%${phone}%`);
      }

      const offset = (page - 1) * limit;

      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const { rows } = await db.query(query, params);
      const { rows: totalCountRows } = await db.query(totalCountQuery, params.slice(0, params.length - 2));

      return res.status(200).json({
        status: true,
        data: rows,
        pagination: { page, limit, orderBy, order, total: parseInt(totalCountRows[0].count) },
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os vídeos processados.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async updateUserCredits(req, res, next) {
    try {
      const { userId, credits } = req.body;

      if (!userId || credits === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: false, message: "O ID do Utilizador e os créditos são obrigatórios." });
      }

      const userQuery = `SELECT video_credits FROM users WHERE user_id = ?`;
      const { rows: userRows } = await db.query(userQuery, [userId]);

      if (userRows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ status: false, message: "Utilizador não encontrado." });
      }

      const creditsBefore = userRows[0].video_credits || 0;
      const creditsAfter = creditsBefore + credits;

      const updateQuery = `UPDATE users SET video_credits = ? WHERE user_id = ?`;
      await db.query(updateQuery, [credits, userId]);

      const historyQuery = `
        INSERT INTO users_credits_history (user_id, credits_before, credits_after, given_by)
        VALUES (?, ?, ?, ?)
      `;
      await db.query(historyQuery, [userId, creditsBefore, creditsAfter, req.user?.id || null]);

      return res.status(200).json({ status: true, message: "Créditos atualizados com sucesso." });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao atualizar os créditos do Utilizador.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async addVideoProcessed(req, res) {
    try {
      const user = req.user;
      const userId = user.id;

      if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: false, message: "O ID do Utilizador é obrigatório." });
      }

      const { campo, date, timeInicio: start_time, timeFim: end_time } = req.body;

      // Buscar os créditos do utilizador
      const { rows: userResult } = await db.query(`SELECT video_credits FROM users WHERE user_id = ?`, [userId]);
      const userCredits = userResult[0].video_credits;

      if (userCredits <= 0) {
        return res.json({ status: false, message: "Créditos insuficientes." });
      }

      // Inserir o vídeo na tabela videos_processed com status 'waiting'
      const insertVideoQuery = `
      INSERT INTO videos_processed (user_id, campo, date, start_time, end_time, status)
      VALUES (?, ?, ?, ?, ?, 'waiting')
    `;

      const { rows: result } = await db.query(insertVideoQuery, [userId, campo, date, start_time, end_time]);

      // Subtrair um crédito do utilizador
      const updateCreditsQuery = `UPDATE users SET video_credits = video_credits - 1 WHERE user_id = ?`;
      await db.query(updateCreditsQuery, [userId]);

      // Registrar a alteração de créditos
      const historyQuery = `
      INSERT INTO users_credits_history (user_id, credits_before, credits_after, given_by)
      VALUES (?, ?, ?, ?)
    `;
      await db.query(historyQuery, [userId, userCredits, userCredits - 1, req.user?.id || null]);

      return res.json({
        status: true,
        message: "Vídeo adicionado com sucesso na lista de processamento.",
        videoProcessedId: result.insertId,
      });
    } catch (err) {
      Logger.error(`Erro ao adicionar vídeo para processamento: ${err.message}`);
      return res.json({ status: false, message: "Erro ao adicionar vídeo para processamento.", error: err.message });
    }
  }

  static async cutVideo(req, res) {
    const { videoId, startTime, endTime } = req.body;

    try {
      // Verificar se os parâmetros necessários estão presentes
      if (!videoId || startTime === undefined || endTime === undefined) {
        return res.json({ status: false, message: "Campos 'videoId', 'startTime' e 'endTime' são obrigatórios." });
      }

      // Buscar os detalhes do vídeo que está sendo cortado
      const { rows: videoDetails } = await db.query(
        `SELECT videos_processed.*, (SELECT name FROM campos WHERE value = videos_processed.campo) as campo_location 
         FROM videos_processed 
         WHERE id = ?`,
        [videoId]
      );

      if (!videoDetails.length) {
        return res.json({ status: false, message: "Vídeo não encontrado." });
      }

      // Preparar o corpo da requisição para o corte de vídeo
      const body = {
        videoId: videoId,
        startTime: startTime,
        endTime: endTime,
        secret: "a@akas34324_!",
      };

      // Chamada à API para cortar o vídeo
      const cutVideoUrl = `${process.env.URL_API_VIDEOS}/cut-video`;

      try {
        const response = await axios.post(cutVideoUrl, body);
        return res.json({ status: response.data.status, message: response.data.message });
      } catch (err) {
        // Se a chamada à API falhar
        Logger.error(`Erro ao cortar vídeo: ${err.message}`);
        return res.json({ status: false, message: "Erro ao cortar o vídeo.", error: err.message });
      }
    } catch (err) {
      Logger.error(`Erro ao processar corte de vídeo: ${err.message}`);
      return res.json({ status: false, message: "Erro ao processar corte de vídeo.", error: err.message });
    }
  }

  static async processVideo(req, res) {
    const { videoId, accepted } = req.body;
    const validatedByUserId = req.user.id;

    try {
      // Buscar os detalhes do vídeo que está sendo processado
      const { rows: videoDetails } = await db.query(`SELECT videos_processed.*, (SELECT name FROM campos WHERE value = videos_processed.campo) as campo_location FROM videos_processed WHERE id = ?`, [videoId]);

      if (!videoDetails.length) {
        return res.json({ status: false, message: "Vídeo não encontrado." });
      }

      const { user_id, campo, date, start_time, end_time, status, campo_location } = videoDetails[0];

      // Se o vídeo não for aceito, devolver crédito ao utilizador
      if (accepted === false) {
        // Atualizar o status do vídeo para "rejected"
        const updateVideoQuery = `
        UPDATE videos_processed
        SET status = 'rejected', validated_by = ?, validated_at = NOW()
        WHERE id = ?
      `;
        await db.query(updateVideoQuery, [validatedByUserId, videoId]);

        // Devolver um crédito ao utilizador
        const updateCreditsQuery = `UPDATE users SET video_credits = video_credits + 1 WHERE user_id = ?`;
        await db.query(updateCreditsQuery, [user_id]);

        // Registrar a devolução de crédito
        const { rows: userCreditsResult } = await db.query(`SELECT video_credits FROM users WHERE user_id = ?`, [user_id]);
        const userCredits = userCreditsResult[0].video_credits;

        const historyQuery = `
        INSERT INTO users_credits_history (user_id, credits_before, credits_after, given_by)
        VALUES (?, ?, ?, ?)
      `;
        await db.query(historyQuery, [user_id, userCredits - 1, userCredits, validatedByUserId]);

        return res.json({ status: true, message: "Vídeo rejeitado e crédito devolvido ao utilizador." });
      }

      // Caso contrário, continuar com o processamento do vídeo (accepted = true)
      // Atualizar o status do vídeo para "processing" e definir o validador
      const updateVideoQuery = `
      UPDATE videos_processed
      SET status = 'processing', validated_by = ?, validated_at = NOW()
      WHERE id = ?
    `;
      await db.query(updateVideoQuery, [validatedByUserId, videoId]);

      // Formatar os valores para o comando Python
      const formattedStartDateTime = `${date} ${start_time}`;
      const formattedEndDateTime = `${date} ${end_time}`;
      const fileName = videoId; // Considerando que videoId é o mesmo que videoId

      const url = `${process.env.URL_API_VIDEOS}/script`;

      const formattedDate = moment(date).tz("Europe/Lisbon").format("YYYY-MM-DD");

      const body = {
        campo,
        campo_location,
        start_time,
        end_time,
        formattedDate,
        videoId: videoId,
        secret: "a@akas34324_!",
      };

      try {
        // Chamada à API para processar o vídeo
        const response = await axios.post(url, body);

        if (response.data.status) {
          // Tudo certo, não precisamos alterar os créditos aqui

          return res.json({ status: true, message: "Vídeo processado com sucesso." });
        } else {
          // Atualizar o status do vídeo para "failed" se a API falhar
          const updateVideoStatusQuery = `
          UPDATE videos_processed
          SET status = 'failed', error_message = ?
          WHERE id = ?
        `;
          await db.query(updateVideoStatusQuery, ["Falha ao correr o script no videos_api.", videoId]);

          Logger.error(`Erro ao executar o script Python`);
          return res.json({ status: false, message: "Erro ao processar o vídeo." });
        }
      } catch (err) {
        // Se o comando Python falhar, atualizar o status do vídeo para "failed"
        const updateVideoStatusQuery = `
        UPDATE videos_processed
        SET status = 'failed', error_message = ?
        WHERE id = ?
      `;
        await db.query(updateVideoStatusQuery, [err.message, videoId]);

        Logger.error(`Erro ao executar o script Python: ${err.message}`);
        return res.json({ status: false, message: "Erro ao processar o vídeo com o script", error: err.message });
      }
    } catch (err) {
      Logger.error(`Erro ao processar vídeo: ${err.message}`);
      return res.json({ status: false, message: "Erro ao processar vídeo.", error: err.message });
    }
  }

  /* static async addVideoProcessed(req, res, next) {
    try {
      const { campo, timeInicio: start_time, timeFim: end_time, date } = req.body;
      const userId = req.user?.id;

      if (!campo || !start_time || !end_time || !date) {
        return res.json({ status: false, message: "Campos em falta" });
      }

      const userQuery = `SELECT video_credits FROM users WHERE user_id = ?`;
      const { rows: userRows } = await db.query(userQuery, [userId]);

      if (userRows.length === 0) {
        return res.json({ status: false, message: "Utilizador não encontrado." });
      }

      const userCredits = userRows[0].video_credits || 0;

      if (userCredits <= 0) {
        return res.json({ status: false, message: "Créditos insuficientes para processar o vídeo." });
      }

      const insertVideoQuery = `
        INSERT INTO videos_processed (user_id, campo, start_time, end_time, date)
        VALUES (?, ?, ?, ?, ?)
      `;
      const { rows: entrada } = await db.query(insertVideoQuery, [userId, campo, start_time, end_time, date]);
      const videoId = entrada.insertId;

      // Formatar os valores para o comando Python
      const formattedStartDateTime = `${date} ${start_time}`;
      const formattedEndDateTime = `${date} ${end_time}`;
      const fileName = videoId;

      //const pythonScriptPath = "/www/padel/padel.py";
      //const command = `python ${pythonScriptPath} '${formattedStartDateTime}' '${formattedEndDateTime}' ${campo} ${fileName}`;
      try {
        //const { stdout, stderr } = await execPromise(command);
        //Logger.info(`Saída do script Python: ${stdout}`);
        
        const url = `${process.env.URL_API_VIDEOS}/script`;
        const body = {
          campo,
          start_time,
          end_time,
          date,
          videoId,
          secret: "a@akas34324_!",
        };

        const response = await axios.post(url, body);

        if (response.data.status) {
          const updateCreditsQuery = `UPDATE users SET video_credits = video_credits - 1 WHERE user_id = ?`;
          await db.query(updateCreditsQuery, [userId]);

          const historyQuery = `
          INSERT INTO users_credits_history (user_id, credits_before, credits_after, given_by)
          VALUES (?, ?, ?, ?)
        `;
          await db.query(historyQuery, [userId, userCredits, userCredits - 1, req.user?.id || null]);

          return res.json({ status: true, message: "Vídeo processado e créditos atualizados com sucesso." });
        } else {
          const updateVideoStatusQuery = `
            UPDATE videos_processed
            SET status = 'failed', error_message = ?
            WHERE id = ?
          `;
          await db.query(updateVideoStatusQuery, ["Falha ao correr o script no videos_api.", videoId]);

          Logger.error(`Erro ao executar o script Python`);
          return res.json({ status: false, message: "Erro ao processar o vídeo." });
        }
      } catch (err) {
        // Se o comando Python falhar, atualizar o status do vídeo para "failed"
        const updateVideoStatusQuery = `
          UPDATE videos_processed
          SET status = 'failed', error_message = ?
          WHERE id = ?
        `;
        await db.query(updateVideoStatusQuery, [err.message, videoId]);

        Logger.error(`Erro ao executar o script Python: ${err.message}`);
        return res.json({ status: false, message: "Erro ao processar o vídeo com o script", error: err.message });
      }
    } catch (ex) {
      Logger.error("Ocorreu um erro ao processar o vídeo.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  } */

  static async getSingleVideoProcessed(req, res, next) {
    try {
      const videoId = req.params.id;

      const query = `
        SELECT vp.*, u.email, u.first_name, u.last_name, u.phone
        FROM videos_processed vp
        LEFT JOIN users u ON vp.user_id = u.user_id
        WHERE vp.id = ?
      `;

      const { rows } = await db.query(query, [videoId]);

      if (rows.length === 0) {
        return res.json({ status: false, message: "Vídeo não encontrado." });
      }

      return res.status(StatusCodes.OK).json({ status: true, data: rows[0] });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar o vídeo.", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getCreditsPageParams(req, res, next) {
    try {
      const creditQuery = `
        SELECT video_credits FROM users
        WHERE user_id = ?
      `;
      const { rows: creditRows } = await db.query(creditQuery, [req.user.id]);

      if (creditRows.length === 0) {
        return res.json({ status: false, message: "Créditos não encontrados." });
      }

      const credits = creditRows[0].video_credits;

      // Busca todos os campos disponíveis
      const camposQuery = `
        SELECT * FROM campos ORDER BY FIELD(name, 'Lamas - SusyPetros', 'Lamas - Campo 2', 'Lamas - Carlsberg', 'Lamas - BalizasLandia', 'Lamas - Campo AQS');
      `;
      const { rows: camposRows } = await db.query(camposQuery);

      const data = {
        credits,
        campos: camposRows.length === 0 ? [] : camposRows,
      };

      return res.status(StatusCodes.OK).json({ status: true, data });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao buscar os dados da página de créditos.", ex);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async getFullVideoStream(req, res, next) {
    try {
      const { videoId, user } = req.query;

      if (!videoId) {
        return res.json({ status: false, message: "Parâmetros em falta" });
      }

      const videoPath = path.join(__dirname, "..", "..", "videos", `${videoId}.mp4`);

      if (!fs.existsSync(videoPath)) {
        return res.json({ status: false, message: "Vídeo não encontrado." });
      }

      // Validação da permissão para ver o vídeo
      const query = `
        SELECT vp.id
        FROM videos_processed vp
        WHERE vp.id = ? AND vp.user_id = ?
      `;

      const { rows } = await db.query(query, [videoId, user]);

      if (rows.length === 0) {
        return res.json({ status: false, message: "Não tem permissões para ver este vídeo." });
      }

      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (!range) {
        // Se o cliente não solicitou um intervalo, retorna o vídeo completo
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
        });

        // Enviar o arquivo completo
        const videoStream = fs.createReadStream(videoPath);
        videoStream.pipe(res);
      } else {
        // Tratamento do range para streaming parcial
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          return res.status(416).json({ status: false, message: "Range não satisfatório." });
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
        });

        // Utilização de ffmpeg para transmitir o vídeo a partir do ponto de início
        ffmpeg(videoPath)
          .setStartTime(start / 1000) // Início em segundos
          .setDuration(chunkSize / 1000) // Duração do trecho a ser enviado
          .format("mp4")
          .on("start", (commandLine) => {
            console.log("Comando FFmpeg:", commandLine);
          })
          .on("stderr", (stderrLine) => {
            console.error("FFmpeg stderr:", stderrLine);
          })
          .on("error", (err) => {
            console.error("Erro ao processar o vídeo:", err);
            if (!res.headersSent) {
              res.status(500).json({ status: false, message: "Erro ao processar o vídeo." });
            }
          })
          .pipe(res, { end: true });
      }
    } catch (ex) {
      console.error("Ocorreu um erro ao buscar o vídeo.", ex);
      res.status(500).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }

  static async streamTrimmedVideo(req, res, next) {
    try {
      const { videoId, start, end } = req.query;
      const user = req.user;

      if (!videoId || !start || !end) {
        return res.json({ status: false, message: "Parâmetros em falta" });
      }

      const startTime = parseFloat(start);
      const endTime = parseFloat(end);

      if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
        return res.json({ status: false, message: "Parâmetros de tempo inválidos." });
      }

      const videoPath = path.join(__dirname, "..", "..", "videos", `${videoId}.mp4`);
      if (!fs.existsSync(videoPath)) {
        return res.json({ status: false, message: "Vídeo não encontrado." });
      }

      // Validação se tem a permissão para ver este video
      const query = `
        SELECT vp.id
        FROM videos_processed vp
        WHERE vp.id = ? AND vp.user_id
      `;

      const { rows } = await db.query(query, [videoId, user.id]);

      if (rows.length === 0) {
        return res.json({ status: false, message: "Não tem permissões para ver este vídeo." });
      }

      // Define o caminho do arquivo temporário
      const tempFilePath = path.join(__dirname, "..", "..", "videos", `temp_${Date.now()}.mp4`);

      res.setHeader("Content-Type", "video/mp4");

      const command = ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(tempFilePath)
        .format("mp4");

      // Executa o comando FFmpeg
      command.run();

      // Quando o FFmpeg termina a criação do vídeo cortado
      command.on("end", () => {
        fs.createReadStream(tempFilePath)
          .pipe(res)
          .on("finish", () => {
            // Remove o arquivo temporário após o streaming
            fs.unlink(tempFilePath, (err) => {
              if (err) {
                console.error("Erro ao remover o arquivo temporário:", err);
              }
            });
          })
          .on("error", (err) => {
            console.error("Erro ao transmitir o vídeo:", err);
            res.status(500).send("Erro ao transmitir o vídeo.");
          });
      });

      // Captura erros do FFmpeg
      command.on("error", (err) => {
        console.error("Erro ao processar o vídeo:", err);
        if (!res.headersSent) {
          res.status(500).send("Erro ao processar o vídeo.");
        }
      });
    } catch (ex) {
      Logger.error("Ocorreu um erro ao cortar o vídeo", ex);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erro Interno do Servidor", message: ex.message });
    }
  }
}

module.exports = VideoController;
