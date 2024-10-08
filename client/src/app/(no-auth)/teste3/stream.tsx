"use client";
import { Title, Text, Center, Flex, Button, Loader, Box, InputBase, Input, ActionIcon, rem, Anchor, Progress } from "@mantine/core";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { IMaskInput } from "react-imask";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";
import classes from "./classes.module.css";
import "@mantine/dates/styles.css";
import { get, set } from "idb-keyval";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import useDownloader from "react-use-downloader";

async function getCachedUrl(url: string, type: string, key: string) {
  try {
    let buffer = await get(key);
    if (!buffer) {
      const response = await fetch(url);
      buffer = await response.arrayBuffer();
      await set(key, buffer);
    }
    const blob = new Blob([buffer], { type });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching or caching the URL:", error);
    throw new Error("Failed to load resources for ffmpeg.");
  }
}

const secondsToHms = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const hmsToSeconds = (hms: string) => {
  const [hours, minutes, seconds] = hms.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

interface Props {
  params: { videoId: string };
}

const ffmpeg = new FFmpeg();
const baseURL = "https://unpkg.com/@ffmpeg/core@latest/dist/umd";

export default function TesteEComponent() {
  const [inputVideoFile, setInputVideoFile] = useState<File | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [compatible, setCompatible] = useState(false);
  const [startTime, setStartTime] = useState<string>("00:00:00");
  const [endTime, setEndTime] = useState<string>("00:00:00");
  const [isTrimming, setIsTrimming] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 657px)");

  const { size, elapsed, percentage, download, cancel, error: errordownload, isInProgress } = useDownloader();

  const downloadVideo = async () => {
    const videoUrl = `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`;

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const file = new File([blob], "video.mp4", { type: "video/mp4" });

      setInputVideoFile(file);
      setDownloadComplete(true);
      setLoading(false);
    } catch (error) {
      console.log("Erro ao baixar o vídeo: ", error);
    }
  };

  const getFileNameWithTimestamp = () => {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, "-"); // Formata o timestamp
    return `download_${timestamp}.mp4`;
  };

  const loadFFmpeg = async () => {
    try {
      setLoading(true);
      const coreUrl = await getCachedUrl(`${baseURL}/ffmpeg-core.js`, "text/javascript", "ffmpeg-core");
      const wasmUrl = await getCachedUrl(`${baseURL}/ffmpeg-core.wasm`, "application/wasm", "ffmpeg-wasm");

      await ffmpeg.load({
        coreURL: coreUrl,
        wasmURL: wasmUrl,
      });

      setReady(true);
      setCompatible(true);
    } catch (err) {
      console.log(err);
      setCompatible(false);
    }
  };

  const validateTimes = (startTime: string, endTime: string) => {
    if (!videoDuration) {
      setError("A duração do vídeo não está disponível.");
      return false;
    }

    // Verifica se os tempos estão no formato correto (hh:mm:ss)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      setError("Por favor, insira um horário válido no formato HH:MM:SS.");
      return false;
    }

    const startSeconds = hmsToSeconds(startTime);
    const endSeconds = hmsToSeconds(endTime);
    const durationSeconds = videoDuration;

    // Verifica se a hora de início é igual à hora de fim
    if (startTime === endTime) {
      setError("A hora de início deve ser diferente da hora de fim.");
      return false;
    }

    // Verifica se a hora de início é maior que a de fim
    if (startSeconds > endSeconds) {
      setError("A hora de início não pode ser maior que a hora de fim.");
      return false;
    }

    // Verifica se as horas estão dentro da duração do vídeo
    if (startSeconds < 0 || endSeconds > durationSeconds) {
      setError("As horas de início e fim devem estar dentro dos parâmetros do vídeo.");
      return false;
    }

    setError(null);
    return true;
  };

  const fetchStreamVideo = async () => {
    try {
      const streamUrl = `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`;
      setStreamUrl(streamUrl);
      await getVideoDuration(streamUrl); // Obtém a duração do vídeo quando o URL é setado
    } catch (error) {
      console.error("Erro ao carregar vídeo completo:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamVideo();
    loadFFmpeg();
  }, []);

  useEffect(() => {
    if (compatible) {
      downloadVideo();
    }
  }, [compatible]);

  const trimVideo = async () => {
    let ini = startTime;
    let fim = endTime;

    if (!ffmpeg || !inputVideoFile) return;
    if (!compatible || !inputVideoFile) return;

    if (!validateTimes(ini, fim)) return;

    setIsTrimming(true);
    setReady(false);

    try {
      await ffmpeg.writeFile("input.mp4", await fetchFile(inputVideoFile));
      await ffmpeg.exec(["-i", "input.mp4", "-ss", ini, "-to", fim, "-c", "copy", "output.mp4"]);

      const fileData = await ffmpeg.readFile("output.mp4");
      const data = new Uint8Array(fileData as ArrayBuffer);
      const trimmedBlob = new Blob([data.buffer], { type: "video/mp4" });
      const trimmedUrl = URL.createObjectURL(trimmedBlob);
      setTrimmedVideoUrl(trimmedUrl);
    } catch (error) {
      console.log("Erro ao cortar o vídeo: ", error);
    } finally {
      setIsTrimming(false);
      setReady(true);
    }
  };

  const getVideoDuration = async (url: string) => {
    return new Promise<void>((resolve, reject) => {
      const videoElement = document.createElement("video");
      videoElement.preload = "metadata"; // Pré-carrega apenas os metadados
      videoElement.crossOrigin = "anonymous";
      videoElement.addEventListener("loadedmetadata", () => {
        const durationInSeconds = videoElement.duration;
        setVideoDuration(durationInSeconds);
        setEndTime(secondsToHms(durationInSeconds));
        setLoading(false);
        resolve();
      });

      videoElement.addEventListener("error", (error) => {
        console.error("Erro ao carregar os metadados do vídeo:", error);
        setLoading(false);
        reject(error);
      });

      videoElement.src = url;
    });
  };

  const ref1 = useRef<any>(null);
  const ref2 = useRef<any>(null);

  const handleDownload = () => {
    if (inputVideoFile && !isInProgress) {
      const url = URL.createObjectURL(inputVideoFile);

      // Criar um link temporário para download
      const a = document.createElement("a");
      a.href = url;
      a.download = getFileNameWithTimestamp(); // Define o nome do arquivo usando a função
      document.body.appendChild(a);
      a.click(); // Simula o clique no link
      document.body.removeChild(a); // Remove o link após o download
    } else {
      // Se o download não estiver completo, exibe opções de download
      download(`https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`, getFileNameWithTimestamp());
    }
  };

  const formatSize = (bytes: number): string => {
    const gb = bytes / 1024 ** 3;
    const mb = bytes / 1024 ** 2;
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  };


  if (loading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <>
      <div>
        <Title mt={15}>Vídeo</Title>

        <Center mt={"lg"}>
          {streamUrl && (
            <Box display={"grid"}>
              <video crossOrigin="anonymous" controls src={streamUrl} autoPlay width="600px">
                O seu navegador não suporta a reprodução de vídeo.
              </video>
              <Center>
                <Flex justify="center" align="center" direction="column" mt="md">
                  <Flex>
                    <Button variant="subtle" color="blue" onClick={handleDownload} disabled={isInProgress}>
                      Transferir Vídeo Completo
                    </Button>
                    {isInProgress && (
                      <Button onClick={cancel} variant="subtle" color="red" ml="md">
                        Cancelar Download
                      </Button>
                    )}
                  </Flex>
                  {isInProgress && (
                    <div>
                      <Center>
                        <p>Tamanho do ficheiro: {formatSize(size)}</p>
                      </Center>
                      <Progress value={percentage} />
                    </div>
                  )}
                </Flex>
              </Center>
            </Box>
          )}
        </Center>

        <Center mt={"lg"}>
          {!ready ? (
            <Text>A carregar...</Text>
          ) : !compatible ? (
            <Text>O seu browser não é compatível para manipular vídeos.</Text>
          ) : (
            <div>
              {!downloadComplete && compatible && <Box mb={"md"}>Por favor, aguarde um momento enquanto carregamos o vídeo completo para realizar os cortes.</Box>}
              {
                <div>
                  <Flex justify="center" align="center">
                    <Input
                      ref={ref1}
                      component={IMaskInput}
                      disabled={!downloadComplete}
                      label="Início (HH:MM:SS)"
                      value={startTime}
                      onChange={(event) => {
                        setStartTime(event.currentTarget.value);
                      }}
                      placeholder="00:00:10"
                      className={classes.center}
                    />

                    <Input
                      ref={ref2}
                      disabled={!downloadComplete}
                      component={IMaskInput}
                      label="Fim (HH:MM:SS)"
                      value={endTime}
                      onChange={(event) => {
                        setEndTime(event.currentTarget.value);
                      }}
                      placeholder="00:01:00"
                      ml="md"
                      className={classes.center}
                    />
                  </Flex>
                  <Center mt="sm">
                    <Button onClick={trimVideo} disabled={isTrimming || !downloadComplete} loading={isTrimming}>
                      {loading ? <Loader size="sm" /> : "Cortar"}
                    </Button>
                  </Center>
                </div>
              }

              {error && (
                <Center>
                  <Text color="red" size="sm" style={{ position: "relative", top: "5px" }}>
                    {error}
                  </Text>
                </Center>
              )}

              {trimmedVideoUrl && (
                <Center>
                  <Box display={"grid"} style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                    <video src={trimmedVideoUrl} controls width={isMobile ? "320px" : "600px"} />
                    <Center>
                      <Anchor mt="md" href={trimmedVideoUrl} download={getFileNameWithTimestamp()} target="_blank" underline="hover">
                        Download do Vídeo Cortado
                      </Anchor>
                    </Center>
                  </Box>
                </Center>
              )}
            </div>
          )}
        </Center>
      </div>
    </>
  );
}
