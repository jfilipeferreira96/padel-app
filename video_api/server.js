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
function saveExecutionStatus(videoId, status, retries = 0) {
  const filePath = path.join(__dirname, "execution_status.json");
  let statuses = {};
  if (fs.existsSync(filePath)) {
    statuses = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // Atualizar ou criar um novo registro de status
  statuses[videoId] = { status, retries, timestamp: new Date().toISOString() };
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

    // Verificar se o arquivo temporário ou final já existe na pasta
    const videoExists = fs.existsSync(tempVideoPath) || fs.existsSync(finalVideoPath);

    if (info.status === "failed" || info.status === "pending" && info.retries < 5 && !videoExists) {
      console.log(`Reexecutando script para o vídeo ${videoId}, tentativa ${info.retries + 1}`);

      // Incrementar o número de tentativas e reexecutar o script
      saveExecutionStatus(videoId, "retrying", info.retries + 1);
      await executeScript(info.command, videoId, info.retries + 1);
    } else if (info.retries >= 5) {
      console.log(`Script para o vídeo ${videoId} excedeu o número máximo de tentativas.`);
      saveExecutionStatus(videoId, "exceeded_retries", info.retries);
    } else if (videoExists && info.status !== "completed") {
      // Atualizar o status para "completed"
      saveExecutionStatus(videoId, "completed");
    }
  }
}

// Função para executar o script e atualizar o status
async function executeScript(command, videoId, retries = 0) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      console.log(`Erro no script Python: ${stderr}`);
      saveExecutionStatus(videoId, "failed", retries);
      return;
    }
    console.log(`Saída do script Python: ${stdout}`);
    saveExecutionStatus(videoId, "completed");
  } catch (error) {
    console.log(`Erro ao executar o script Python: ${error.message}`);
    saveExecutionStatus(videoId, "failed", retries);
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

// Endpoint para verificar se o arquivo existe
app.get("/check-file", async (req, res) => {
  try {
    const { filepath } = req.query;
    if (!filepath) {
      return res.json({ status: false, message: "Parâmetros em falta" });
    }

    const fullPath = path.join(__dirname, filepath);

    // Verifica se o arquivo existe
    fs.exists(fullPath, (exists) => {
      return res.json({ exists });
    });
  } catch (err) {
    console.log("Erro ao verificar o arquivo:", err);
    res.json({ status: false, message: "Erro ao verificar o arquivo" });
  }
});

// Endpoint para download de arquivo
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
    saveExecutionStatus(videoId, "pending", 0);

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
  console.log("A verificar scripts falhados...");
  checkAndRestartFailedScripts();
});

// Agendar limpeza a cada dia
cron.schedule("0 0 * * *", () => {
  console.log("A Limpar entradas antigas...");
  cleanOldEntries();
});

const server = app.listen(port, () => {
  console.log(`Servidor à escuta na porta ${port}`);
});

// Aumentar o timeout do servidor Express para 5 minutos (1200000 milissegundos)
server.setTimeout(1200000);
