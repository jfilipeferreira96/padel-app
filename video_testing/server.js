const path = require("path");
const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const app = express();
const port = 3010;
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

// ENVIA POR STREAM O VIDEO
// http://localhost:3010/stream?videoName=aaa.mp4
app.get("/stream", async (req, res) => {
  const { videoName } = req.query;

  if (!videoName) {
    return res.json({ status: false, message: "Parâmetros em falta" });
  }

  const videoPath = path.join(__dirname, "videos", videoName);
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Vídeo não encontrado.");
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
});

// Endpoint para stream cortado de vídeo
// http://localhost:3010/stream-parsed?start=0&end=10&videoName=aaa.mp4
app.get("/stream-parsed", async (req, res) => {
  const { start, end, videoName } = req.query;

  if (!start || !end || !videoName) {
    return res.status(400).send("Parâmetros start, end e videoName são necessários.");
  }

  const startTime = parseFloat(start);
  const endTime = parseFloat(end);

  if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
    return res.status(400).send("Parâmetros de tempo inválidos.");
  }

  const videoPath = path.join(__dirname, "videos", videoName);
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Vídeo não encontrado.");
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
});

// Endpoint para verificar se o arquivo existe
//http://localhost:3010/check-file?filepath=videos/aaa.mp4
app.get("/check-file", async (req, res) => {
  const { filepath } = req.query;
  if (!filepath) {
    return res.status(400).json({ status: false, message: "Parâmetros em falta" })
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
});

//http://localhost:3010/download-file?filepath=videos/aaa.mp4
app.get("/download-file", async (req, res) => {
  const { filepath } = req.query;
  if (!filepath) {
    return res.status(400).send("Parâmetro filepath é necessário.");
  }

  const fullPath = path.join(__dirname, filepath);

  // Verifica se o arquivo existe
  if (fs.existsSync(fullPath)) {
    // Faz o download do arquivo
    res.download(fullPath, (err) => {
      if (err) {
        console.error("Erro ao fazer o download:", err);
        res.status(500).send("Erro ao fazer o download do arquivo.");
      }
    });
  } else {
    return res.status(404).send("Arquivo não encontrado.");
  }
});

// Endpoint para chamar o script
//http://localhost:3010/check-file?filepath=videos/aaa.mp4
app.post("/script", async (req, res) => {
  const { campo, timeInicio: start_time, timeInicio: end_time, date, videoId } = req.body;

  if (!campo || !start_time || !end_time || !date || !videoId) {
    return res.json({ status: false, message: "Campos em falta" });
  }

    // Formatar os valores para o comando Python
    const formattedStartDateTime = `${date} ${start_time}`;
    const formattedEndDateTime = `${date} ${end_time}`;
    const fileName = videoId;

    // Montar o comando Python
    const pythonScriptPath = "/www/padel/padel.py";
    const command = `python ${pythonScriptPath} '${formattedStartDateTime}' '${formattedEndDateTime}' ${campo} ${fileName}`;

  try {
    const { stdout, stderr } = await execPromise(command);
    return res.json({ status: true, message: "Vídeo processado com sucesso." });

  } catch (error) {
    Logger.error(`Erro ao executar o script Python: ${err.message}`);
    return res.json({ status: false, message: "Erro ao processar o vídeo com o script Python", error: err.message });
  }

});


app.listen(port, () => {
  console.log(`Servidor escutando na porta ${port}`);
});
