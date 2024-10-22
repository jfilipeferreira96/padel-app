const path = require("path");
const express = require("express");
const fs = require("fs");
const app = express();
const port = 3010;
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const cors = require("cors");
const cron = require("node-cron");

// Configuração do CORS para permitir todos os tipos de pedidos
app.use(cors());

// Middleware para lidar com JSON no corpo das requisições
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Função para salvar o status de execução em um arquivo JSON
function saveExecutionStatus(videoId, status, retries = 0, command = null) {
  const filePath = path.join(__dirname, "execution_status.json");
  let statuses = {};
  if (fs.existsSync(filePath)) {
    statuses = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // Atualizar ou criar um novo registro de status
  statuses[videoId] = {
    status,
    retries,
    command: command || (statuses[videoId] ? statuses[videoId].command : null),
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(filePath, JSON.stringify(statuses, null, 2));
}

// Função para verificar e reexecutar scripts falhados
async function checkAndRestartFailedScripts() {
  const filePath = path.join(__dirname, "execution_status.json");
  if (!fs.existsSync(filePath)) return;

  const statuses = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const [videoId, info] of Object.entries(statuses)) {
    const tempVideoPath = path.join(__dirname, "videos", `temp_${videoId}.mp4`);
    const finalVideoPath = path.join(__dirname, "videos", `${videoId}.mp4`);

    const videoExists = fs.existsSync(tempVideoPath) || fs.existsSync(finalVideoPath);

    if (info.status === "failed" || (info.status === "pending" && info.retries < 5 && !videoExists)) {
      if (info.retries < 5) {
        console.log(`Reexecutando script para o vídeo ${videoId}, tentativa ${info.retries + 1}`);
        saveExecutionStatus(videoId, "retrying", info.retries + 1, info.command);
        await executeScript(info.command, videoId, info.retries + 1);
      } else {
        console.log(`Script para o vídeo ${videoId} excedeu o número máximo de tentativas.`);
        saveExecutionStatus(videoId, "exceeded_retries", info.retries, info.command);
      }
    } else if (videoExists && info.status !== "completed") {
      saveExecutionStatus(videoId, "completed", info.retries, info.command);
    }
  }
}

// Função para executar o script e atualizar o status
async function executeScript(command, videoId, retries = 0) {
  try {
    const { stdout, stderr } = await execPromise(command, { timeout: 600000 }); // 10 minutos de timeout

    if (stderr) {
      console.log(`Erro no script Python: ${stderr}`);
      saveExecutionStatus(videoId, "failed", retries, command);
      return;
    }
    console.log(`Saída do script Python: ${stdout}`);
    saveExecutionStatus(videoId, "completed", retries, command);
  } catch (error) {
    console.log(`Erro ao executar o script Python: ${error.message}`);
    saveExecutionStatus(videoId, "failed", retries, command);
  }
}

// Função para limpar entradas antigas do JSON
function cleanOldEntries() {
  const filePath = path.join(__dirname, "execution_status.json");
  if (!fs.existsSync(filePath)) return;

  const statuses = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const now = new Date();

  // Filtrar entradas com mais de 2 meses de idade
  const filteredStatuses = Object.entries(statuses).reduce((acc, [videoId, info]) => {
    const entryDate = new Date(info.timestamp);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(now.getMonth() - 2);

    if (entryDate > twoMonthsAgo) {
      acc[videoId] = info;
    }
    return acc;
  }, {});

  fs.writeFileSync(filePath, JSON.stringify(filteredStatuses, null, 2));
}


// ENVIA POR STREAM O VIDEO
// http://localhost:3010/stream?videoName=aaa.mp4
app.get("/stream", async (req, res) => {
  try {
    const { videoName } = req.query;

    if (!videoName) {
      return res.json({ status: false, message: "Parâmetros em falta" });
    }

    const videoPath = path.join(__dirname, "videos", videoName);
    if (!fs.existsSync(videoPath)) {
      return res.send("Vídeo não encontrado.");
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const timestamp = Date.now();
    const fileNameWithTimestamp = `${timestamp}.mp4`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileNameWithTimestamp}"`);

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
        return res.json({ status: false, message: "Range não satisfatório." });
      }

      const chunkSize = end - start + 1;
      const videoStream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      // Enviar o chunk do vídeo
      videoStream.pipe(res);
    }
  } catch (err) {
    console.log("Erro no streaming de vídeo:", err);
    res.json({ status: false, message: "Erro no streaming de vídeo" });
  }
});

// Endpoint para verificar se o arquivo existe
//http://localhost:3010/check-file?filepath=videos/aaa.mp4
app.get("/check-file", async (req, res) => {
  try {
    const { filepath } = req.query;
    if (!filepath) {
      return res.json({ status: false, message: "Parâmetros em falta" });
    }

    const fullPath = path.join(__dirname, filepath);

    // Verifica se o arquivo existe
    fs.exists(fullPath, (exists) => {
      if (exists) {
        return res.json({ exists: true });
      } else {
        return res.json({ exists: false });
      }
    });
  } catch (err) {
    console.log("Erro ao verificar o arquivo:", err);
    res.json({ status: false, message: "Erro ao verificar o arquivo" });
  }
});


//http://localhost:3010/download-file?filepath=videos/aaa.mp4
app.get("/download-file", async (req, res) => {
  try {
    const { filepath } = req.query;
    if (!filepath) {
      return res.send("Parâmetro filepath é necessário.");
    }

    const fullPath = path.join(__dirname, filepath);

    // Verifica se o arquivo existe
    if (fs.existsSync(fullPath)) {
      // Faz o download do arquivo
      res.download(fullPath, (err) => {
        if (err) {
          console.log("Erro ao fazer o download:", err);
          res.send("Erro ao fazer o download do arquivo.");
        }
      });
    } else {
      return res.send("Arquivo não encontrado.");
    }
  } catch (err) {
    console.log("Erro no download de arquivo:", err);
    res.json({ status: false, message: "Erro ao fazer o download do arquivo" });
  }
});


// Endpoint para chamar o script
app.post("/script", (req, res) => {
  try {
    const { campo, campo_location, start_time, end_time, formattedDate, videoId, secret } = req.body;

    if (secret !== "a@akas34324_!") {
      return res.json({ status: false, message: "Sem permissões" });
    }

    if (!campo || !start_time || !end_time || !formattedDate || !videoId) {
      return res.json({ status: false, message: "Campos em falta" });
    }

    const formattedStartTime = start_time.includes(":00") ? start_time : `${start_time}:00`;
    const formattedEndTime = end_time.includes(":00") ? end_time : `${end_time}:00`;

    const formattedStartDateTime = `${formattedDate} ${formattedStartTime}`.trim();
    const formattedEndDateTime = `${formattedDate} ${formattedEndTime}`.trim();
    const fileName = videoId;

    const pythonScriptPath = "/root/scripts/padel.py";
    const campoLocation = campo_location.toLowerCase().includes("lamas") ? "lamas" : "padel";
    const command = `python3 ${pythonScriptPath} '${formattedStartDateTime}' '${formattedEndDateTime}' ${campoLocation} ${campo} ${fileName}`;

    console.log("Comando a ser executado:", command);

    // Salvar o status de execução como "pending" antes de executar
    saveExecutionStatus(videoId, "pending", 0, command);

    // Executar o comando de script e atualizar o status
    executeScript(command, videoId);

    return res.json({ status: true, message: "Comando Python executado. Processamento será feito em segundo plano." });
  } catch (err) {
    console.log("Erro no endpoint de script:", err);
    res.json({ status: false, message: "Erro ao chamar o script" });
  }
});

// Agendamento para verificar scripts falhados a cada 5 minutos
cron.schedule("*/5 * * * *", () => {
  checkAndRestartFailedScripts();
});

cron.schedule("0 0 * * *", () => {
  cleanOldEntries();
});

const server = app.listen(port, () => {
  console.log(`Servidor à escuta na porta ${port}`);
});

// Aumentar o timeout do servidor Express para 5 minutos (1200000 milissegundos)
server.setTimeout(1200000);
