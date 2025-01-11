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
const moment = require("moment");

// Configuração do CORS para permitir todos os tipos de pedidos
app.use(cors());

// Middleware para lidar com JSON no corpo das requisições
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

function logWithTimestamp(message) {
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
  console.log(`[${timestamp}] ${message}`);
}

app.use((req, res, next) => {
  logWithTimestamp(`Request received: ${req.method} ${req.url}`);
  next();
});

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
    logWithTimestamp("Erro no streaming de vídeo:", err);
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
    logWithTimestamp("Erro ao verificar o arquivo:", err);
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
          logWithTimestamp("Erro ao fazer o download:", err);
          res.send("Erro ao fazer o download do arquivo.");
        }
      });
    } else {
      return res.send("Arquivo não encontrado.");
    }
  } catch (err) {
    logWithTimestamp("Erro no download de arquivo:", err);
    res.json({ status: false, message: "Erro ao fazer o download do arquivo" });
  }
});

// Função para salvar o status de execução em um arquivo JSON
function saveExecutionStatus(videoId, status, retries = 0, command = null) {
  const filePath = path.join(__dirname, "execution_status.json");
  let statuses = {};
  if (fs.existsSync(filePath)) {
    statuses = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  statuses[videoId] = {
    status,
    retries,
    command: command || (statuses[videoId] ? statuses[videoId].command : null),
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(filePath, JSON.stringify(statuses, null, 2));
}

// Função para verificar se há algum script em execução
function isScriptProcessing() {
  const filePath = path.join(__dirname, "execution_status.json");
  if (!fs.existsSync(filePath)) return false;

  const statuses = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Object.values(statuses).some((info) => info.status === "processing");
}

// Função para carregar o próximo script pendente do arquivo JSON e processá-lo
async function processQueue() {
  const filePath = path.join(__dirname, "execution_status.json");
  if (!fs.existsSync(filePath)) return;

  const statuses = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // Verificar se já existe um script sendo processado
  if (isScriptProcessing()) {
    return; // Se houver um script em processamento, não inicie outro
  }

  // Encontrar o próximo item com estado "pending" ou "retrying"
  const nextItem = Object.entries(statuses).find(([_, info]) => info.status === "pending" || info.status === "retrying");

  if (nextItem) {
    const [videoId, info] = nextItem;

    // Atualiza o status para "processing"
    saveExecutionStatus(videoId, "processing", info.retries, info.command);

    // Executa o script
    try {
      const { stdout, stderr } = await execPromise(info.command, { timeout: 600000 });

      if (stderr || stdout.includes("ERRO")) {
        logWithTimestamp(`Erro no script Python: ${stderr}`);
        saveExecutionStatus(videoId, "failed", info.retries, info.command);
      } else {
        logWithTimestamp(`Saída do script Python: ${stdout}`);
        saveExecutionStatus(videoId, "completed", info.retries, info.command);
      }
    } catch (error) {
      logWithTimestamp(`Erro ao executar o script Python: ${error.message}`);
      saveExecutionStatus(videoId, "failed", info.retries, info.command);
    }

    // Após completar, tenta processar o próximo na fila
    processQueue();
  }
}

// Função para adicionar comandos ao arquivo JSON e iniciar o processamento se não estiver em execução
function addToQueue(command, videoId, retries = 0) {
  saveExecutionStatus(videoId, "pending", retries, command);
  processQueue(); // Tentar processar a fila se não estiver ocupada
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
        logWithTimestamp(`Reexecutando script para o vídeo ${videoId}, tentativa ${info.retries + 1}`);
        saveExecutionStatus(videoId, "retrying", info.retries + 1, info.command);
        processQueue(); // Adiciona ao processamento
      } else {
        logWithTimestamp(`Script para o vídeo ${videoId} excedeu o número máximo de tentativas.`);
        saveExecutionStatus(videoId, "exceeded_retries", info.retries, info.command);
      }
    } else if (videoExists && info.status !== "completed") {
      saveExecutionStatus(videoId, "completed", info.retries, info.command);
    }
  }
  cleanOldEntries();
}

app.post("/cut-video", async (req, res) => {
  try {
    const { videoId, startTime, endTime, secret } = req.body;

    if (secret !== "a@akas34324_!") {
      return res.json({ status: false, message: "Sem permissões" });
    }

    if (!videoId || startTime === undefined || endTime === undefined) {
      return res.json({ status: false, message: "Campos em falta" });
    }

    // Construa os caminhos dos arquivos
    const inputFilePath = path.join(__dirname, "videos", `${videoId}.mp4`);
    const outputFilePath = path.join(__dirname, "videos", `${videoId}_cut.mp4`);

    // Verifique se o arquivo de entrada existe
    if (!fs.existsSync(inputFilePath)) {
      return res.json({ status: false, message: "Vídeo não encontrado." });
    }

    // Se o arquivo de saída já existir, remova-o
    if (fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);
    }

    // Calcule a duração do corte
    const cutDuration = endTime - startTime;

    // Comando FFmpeg para cortar o vídeo
    const command = `ffmpeg -i ${inputFilePath} -ss ${startTime} -t ${cutDuration} -c copy ${outputFilePath}`;

    logWithTimestamp("Executando comando:", command);

    // Executar o comando com FFmpeg
    await execPromise(command);

    // Verifique se o arquivo de saída foi criado
    if (fs.existsSync(outputFilePath)) {
      return res.json({ status: true, message: "Vídeo cortado com sucesso.", fileName: `${videoId}_cut.mp4` });
    } else {
      return res.json({ status: false, message: "Erro: vídeo não foi cortado." });
    }
  } catch (err) {
    logWithTimestamp("Erro ao cortar vídeo:", err);
    res.json({ status: false, message: "Erro ao cortar o vídeo" });
  }
});

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
    let formattedEndDateTime = `${formattedDate} ${formattedEndTime}`.trim();

    // Adicionar 30 minutos ao formattedEndDateTime
    formattedEndDateTime = moment(formattedEndDateTime, "YYYY-MM-DD HH:mm:ss").add(30, "minutes").format("YYYY-MM-DD HH:mm:ss");

    const fileName = videoId;

    const pythonScriptPath = "/root/scripts/padel.py";
    const campoLocation = campo_location.toLowerCase().includes("lamas") ? "lamas" : "padel";
    const command = `python3 ${pythonScriptPath} '${formattedStartDateTime}' '${formattedEndDateTime}' ${campoLocation} ${campo} ${fileName}`;

    logWithTimestamp("Comando a ser executado:", command);

    // Salvar o status de execução como "pending" no JSON
    addToQueue(command, videoId);

    return res.json({ status: true, message: "Comando Python adicionado à fila. Processamento será feito em sequência." });
  } catch (err) {
    logWithTimestamp("Erro no endpoint de script:", err);
    res.json({ status: false, message: "Erro ao chamar o script" });
  }
});

// Agendamento para verificar scripts falhados a cada 5 minutos
cron.schedule("*/5 * * * *", () => {
  checkAndRestartFailedScripts();
});

const server = app.listen(port, () => {
  logWithTimestamp(`Servidor à escuta na porta ${port}`);
});

// Aumentar o timeout do servidor Express para 5 minutos (1200000 milissegundos)
server.setTimeout(1200000);
