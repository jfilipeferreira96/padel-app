"use client";
import { Title, Text, Center, Flex, Button, Loader, Box, InputBase, Input, ActionIcon, rem, Anchor, Progress, Divider } from "@mantine/core";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { IMaskInput } from "react-imask";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";
import classes from "./classes.module.css";
import "@mantine/dates/styles.css";
import useDownloader from "react-use-downloader";
import { cutVideo, getSingleVideoProcessed } from "@/services/video.service";
import { notifications } from "@mantine/notifications";

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

export default function Stream({ params }: Props) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [compatible, setCompatible] = useState(false);
  const [startTime, setStartTime] = useState<string>("00:00:00");
  const [endTime, setEndTime] = useState<string>("00:00:00");
  const [isTrimming, setIsTrimming] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 657px)");

  // Dois hooks useDownloader, um para cada download
  const {
    size: fullVideoSize,
    elapsed: fullVideoElapsed,
    percentage: fullVideoPercentage,
    download: downloadFullVideo,
    cancel: cancelFullVideo,
    error: errorFullVideo,
    isInProgress: isFullVideoInProgress,
  } = useDownloader();

  const {
    size: trimmedVideoSize,
    elapsed: trimmedVideoElapsed,
    percentage: trimmedVideoPercentage,
    download: downloadTrimmedVideo,
    cancel: cancelTrimmedVideo,
    error: errorTrimmedVideo,
    isInProgress: isTrimmedVideoInProgress,
  } = useDownloader();

  const trimVideo = async () => {
    let ini = startTime;
    let fim = endTime;

    if (!validateTimes(ini, fim)) return;

    setIsTrimming(true);
    setReady(false);

    try {
      const response = await cutVideo(Number(params.videoId), hmsToSeconds(fim) - hmsToSeconds(ini));
      if (response.status === true) {
        setTrimmedVideoUrl(`${process.env.NEXT_URL_API_VIDEOS}/stream?videoName=${params.videoId}_cut.mp4`);
      } else {
        notifications.show({
          message: "Ocorreu um erro",
          color: "red",
        });
      }
    } catch (error) {
      console.log("Erro ao cortar o vídeo: ", error);
      notifications.show({
        message: "Erro ao cortar o vídeo",
        color: "red",
      });
    } finally {
      setIsTrimming(false);
      setReady(true);
    }
  };

  const validateTimes = (startTime: string, endTime: string) => {
    if (!videoDuration) {
      setError("A duração do vídeo não está disponível.");
      return false;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      setError("Por favor, insira um horário válido no formato HH:MM:SS.");
      return false;
    }

    const startSeconds = hmsToSeconds(startTime);
    const endSeconds = hmsToSeconds(endTime);
    const durationSeconds = videoDuration;

    if (startTime === endTime) {
      setError("A hora de início deve ser diferente da hora de fim.");
      return false;
    }

    if (startSeconds > endSeconds) {
      setError("A hora de início não pode ser maior que a hora de fim.");
      return false;
    }

    if (startSeconds < 0 || endSeconds > durationSeconds) {
      setError("As horas de início e fim devem estar dentro dos parâmetros do vídeo.");
      return false;
    }

    setError(null);
    return true;
  };

  const fetchStreamVideo = async () => {
    try {
      if (params.videoId) {
        const check = await getSingleVideoProcessed(parseInt(params.videoId));

        if (check.status) {
          const streamUrl = `${process.env.NEXT_URL_API_VIDEOS}/stream?videoName=${params.videoId}.mp4`;

          setStreamUrl(streamUrl);
          setLoading(false);
          await getVideoDuration(streamUrl);
        } else {
          notifications.show({
            message: check.message,
            color: "red",
          });
          router.back();
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Erro ao carregar vídeo completo:", error);
    }
  };

  useEffect(() => {
    fetchStreamVideo();
  }, []);

  const getFileNameWithTimestamp = () => {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, "-"); // Formata o timestamp
    return `download_${timestamp}.mp4`;
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

  const handleDownload = () => {
    downloadFullVideo(`${process.env.NEXT_URL_API_VIDEOS}/download-file?filepath=videos/${params.videoId}.mp4`, getFileNameWithTimestamp());
  };

  const handleTrimmedDownload = () => {
    downloadTrimmedVideo(`${process.env.NEXT_URL_API_VIDEOS}/download-file?filepath=videos/${params.videoId}_cut.mp4`, getFileNameWithTimestamp());
  };

  const formatSize = (bytes: number): string => {
    const gb = bytes / 1024 ** 3;
    const mb = bytes / 1024 ** 2;
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  };

  const ref1 = useRef<any>(null);
  const ref2 = useRef<any>(null);

  if (loading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <div>
      <Title mt={15}>Vídeo</Title>

      <Center mt={"lg"}>
        {streamUrl && (
          <Box display={"grid"}>
            <video crossOrigin="anonymous" controls src={streamUrl} autoPlay width={isMobile ? "320px" : "600px"}>
              O seu navegador não suporta a reprodução de vídeo.
            </video>
            <Center>
              <Flex justify="center" align="center" direction="column" mt="md">
                <Flex>
                  <Button variant="subtle" color="blue" onClick={handleDownload} disabled={isFullVideoInProgress}>
                    Transferir Vídeo Completo
                  </Button>
                  {isFullVideoInProgress && (
                    <Button onClick={cancelFullVideo} variant="subtle" color="red" ml="md">
                      Cancelar Transferência
                    </Button>
                  )}
                </Flex>
                {isFullVideoInProgress && (
                  <div>
                    <Center>
                      <p>Tamanho do ficheiro: {formatSize(fullVideoSize)}</p>
                    </Center>
                    <Progress value={fullVideoPercentage} />
                  </div>
                )}
              </Flex>
            </Center>
            <Divider mt={"lg"} mb={"lg"} />
          </Box>
        )}
      </Center>

      <Center>
        {loading ? (
          <Text>A carregar...</Text>
        ) : (
          <div>
            <div>
              <Center>Selecione os Trechos para Cortar</Center>
              <Flex justify="center" align="center" mt={"md"}>
                <Input
                  ref={ref1}
                  component={IMaskInput}
                  disabled={isTrimming}
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
                  disabled={isTrimming}
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
              <Center mt="md">
                <Button onClick={trimVideo} disabled={isTrimming} loading={isTrimming}>
                  {loading ? <Loader size="sm" /> : "Aplicar Corte"}
                </Button>
              </Center>
            </div>

            {error && (
              <Center>
                <Text color="red" size="sm" style={{ position: "relative", top: "5px" }}>
                  {error}
                </Text>
              </Center>
            )}

            {trimmedVideoUrl && !isTrimming && (
              <Center>
                <Box display={"grid"} style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                  <video src={trimmedVideoUrl} controls width={isMobile ? "320px" : "600px"} />

                  <Center>
                    <Flex justify="center" align="center" direction="column" mt="md">
                      <Flex>
                        <Button variant="subtle" color="blue" onClick={handleTrimmedDownload} disabled={!trimmedVideoUrl || isTrimmedVideoInProgress}>
                          Transferir Vídeo Cortado
                        </Button>
                        {isTrimmedVideoInProgress && (
                          <Button onClick={cancelTrimmedVideo} variant="subtle" color="red" ml="md">
                            Cancelar Transferência
                          </Button>
                        )}
                      </Flex>
                      {isTrimmedVideoInProgress && (
                        <div>
                          <Center>
                            <p>Tamanho do ficheiro: {formatSize(trimmedVideoSize)}</p>
                          </Center>
                          <Progress value={trimmedVideoPercentage} />
                        </div>
                      )}
                    </Flex>
                  </Center>
                </Box>
              </Center>
            )}
          </div>
        )}
      </Center>
    </div>
  );
}
