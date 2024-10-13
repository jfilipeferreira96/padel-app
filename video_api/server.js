const path = require("path");
const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const app = express();
const port = 3010;
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const cors = require("cors");

// Configuração do CORS para permitir todos os tipos de pedidos
app.use(cors());

// Middleware para lidar com JSON no corpo das requisições
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

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
    console.error("Erro no streaming de vídeo:", err);
    res.json({ status: false, message: "Erro no streaming de vídeo" });
  }
});

// http://localhost:3010/cut-video?filename=aaa.mp4&start=00:00:10&end=00:00:60
/* app.get("/cut-video", (req, res) => {
  const { start, end, filename } = req.query;

  if (!start || !end || !filename) {
    return res.status(400).json({ error: "Start, end, and filename are required" });
  }

  const inputPath = path.join(__dirname, "videos", filename);
  const outputFilename = `temp_${Date.now()}.mp4`;
  const outputPath = path.join(__dirname, "videos", outputFilename);

  // Verifica se o arquivo de entrada existe
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: "File not found" });
  }

  ffmpeg(inputPath)
    .setStartTime(start)
    .setDuration(parseTime(end) - parseTime(start))
    .output(outputPath)
    .on("end", () => {
      res.json({ status: true, filename: outputFilename });
    })
    .on("error", (err) => {
      res.status(500).json({ status: false, error: err.message });
    })
    .run();
}); */

// Função auxiliar para converter o tempo no formato HH:MM:SS para segundos
function parseTime(time) {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

// Endpoint para stream cortado de vídeo
// http://localhost:3010/stream-parsed?start=0&end=10&videoName=aaa.mp4
/* app.get("/stream-parsed", async (req, res) => {
  try {
    const { start, end, videoName } = req.query;

    if (!start || !end || !videoName) {
      return res.send("Parâmetros start, end e videoName são necessários.");
    }

    const startTime = parseFloat(start);
    const endTime = parseFloat(end);

    if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
      return res.send("Parâmetros de tempo inválidos.");
    }

    const videoPath = path.join(__dirname, "videos", videoName);
    if (!fs.existsSync(videoPath)) {
      return res.send("Vídeo não encontrado.");
    }

    // Define o caminho do arquivo temporário
    const tempFilePath = path.join(__dirname, "videos", `temp_${Date.now()}.mp4`);

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
          res.send("Erro ao transmitir o vídeo.");
        });
    });

    // Captura erros do FFmpeg
    command.on("error", (err) => {
      console.error("Erro ao processar o vídeo:", err);
      if (!res.headersSent) {
        res.send("Erro ao processar o vídeo.");
      }
    });
  } catch (err) {
    console.error("Erro no endpoint de stream cortado:", err);
    res.json({ status: false, message: "Erro no stream cortado" });
  }
});
 */
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
    console.error("Erro ao verificar o arquivo:", err);
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
          console.error("Erro ao fazer o download:", err);
          res.send("Erro ao fazer o download do arquivo.");
        }
      });
    } else {
      return res.send("Arquivo não encontrado.");
    }
  } catch (err) {
    console.error("Erro no download de arquivo:", err);
    res.json({ status: false, message: "Erro ao fazer o download do arquivo" });
  }
});

// Endpoint para chamar o script
//http://localhost:3010/script
app.post("/script", (req, res) => {
  try {
    const { campo, campo_location, start_time, end_time, date, videoId, secret } = req.body;

    if (secret !== "a@akas34324_!") {
      return res.json({ status: false, message: "Sem permissões" });
    }

    if (!campo || !start_time || !end_time || !date || !videoId) {
      return res.json({ status: false, message: "Campos em falta" });
    }

    // Adicionar ':00' ao start_time e end_time se não tiverem os segundos
    const formattedStartTime = start_time.includes(":00") ? start_time : `${start_time}:00`;
    const formattedEndTime = end_time.includes(":00") ? end_time : `${end_time}:00`;

    // Garantir que a data está no formato YYYY-MM-DD
    const formattedDate = new Date(date).toISOString().split("T")[0];

    // Formatar os valores para o comando Python
    const formattedStartDateTime = `${formattedDate} ${formattedStartTime}`.trim();
    const formattedEndDateTime = `${formattedDate} ${formattedEndTime}`.trim();
    const fileName = videoId;

    // Montar o comando Python, garantindo que as aspas simples estão bem formatadas
    const pythonScriptPath = "/root/scripts/padel.py";
    const campoLocation = campo_location.toLowerCase().includes("lamas") ? "lamas" : "padel";
    const command = `python3 ${pythonScriptPath} '${formattedStartDateTime}' '${formattedEndDateTime}' ${campoLocation} ${campo} ${fileName}`;

    console.log("Comando a ser executado:", command);

    // Executar o comando sem await
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao executar o script Python: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Erro no script Python: ${stderr}`);
        return;
      }
      console.log(`Saída do script Python: ${stdout}`);
    });

    // Enviar a resposta imediatamente, sem esperar o fim do exec
    return res.json({ status: true, message: "Comando Python executado. Processamento será feito em segundo plano." });
  } catch (err) {
    console.error("Erro no endpoint de script:", err);
    res.json({ status: false, message: "Erro ao chamar o script" });
  }
});

const server = app.listen(port, () => {
  console.log(`Servidor à escuta na porta ${port}`);
});

// Aumentar o timeout do servidor Express para 5 minutos (1200000 milissegundos)
server.setTimeout(1200000);
