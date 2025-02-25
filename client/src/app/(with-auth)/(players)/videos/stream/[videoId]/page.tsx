"use client";
import { Title, Text, Center, Flex, Button, Loader, Box, InputBase, Input, ActionIcon, rem, Anchor, Progress, Divider, Tooltip } from "@mantine/core";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { IMaskInput } from "react-imask";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";
import classes from "./classes.module.css";
import "@mantine/dates/styles.css";
import useDownloader from "react-use-downloader";
import { cutVideo, getSingleVideoProcessed } from "@/services/video.service";
import { notifications } from "@mantine/notifications";
import { TimeInput } from "@mantine/dates";
import { IconVideo, IconVideoOff, IconPlayerRecord, IconPlayerPause } from "@tabler/icons-react";
import styled from "styled-components";
import { VideoPlayer, VideoPlayerProps, VideoPlayerState } from "@videojs-player/react";
import "video.js/dist/video-js.css";
import videojs from "video.js";

type VideoJsPlayer = ReturnType<typeof videojs>;

const VideoContainer = styled.div`
  @media (max-width: 768px) {
    .video-js {
      width: 400px;
      height: 320px;
    }
    .video-js .vjs-time-control {
      flex: none;
      font-size: 1em;
      line-height: 3em;
      min-width: 0em;
      width: auto;
      padding-left: 4px;
      padding-right: 4px;
    }
    .video-js .vjs-control{
      width: 3em;
    }
  }
  @media (max-width: 470px) {
    .video-js {
      width: 320px;
      height: 260px;
    }
  }

  .video-js .vjs-time-control {
    display: block;
  }
`;

const StyledVideo = styled.video`
  display: block;
  height: auto;
`;

const ButtonContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
  z-index: 10;
`;

const StyledActionIcon = styled(ActionIcon)`
  background: rgba(0, 0, 0, 0.6) !important;
  border-radius: 50%;

`;

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStartDisabled, setIsStartDisabled] = useState(false);
  const [autoTrim, setAutoTrim] = useState<number>(0);
  const playerRef = useRef<any>();
  const [playerState, setPlayerState] = useState<any>();

  const handleMounted: VideoPlayerProps["onMounted"] = (payload) => {
    playerRef.current = payload.player;
    setPlayerState(payload.state);
  };

  const handleStateChange = (state: VideoPlayerState) => {
    setPlayerState(state);
  };

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
    const ini = startTime;
    const fim = endTime;
    setTrimmedVideoUrl(null);

    if (!validateTimes(ini, fim)) return;

    setIsTrimming(true);
    setReady(false);

    try {
      const startSeconds = hmsToSeconds(startTime);
      const endSeconds = hmsToSeconds(endTime);
      const response = await cutVideo(Number(params.videoId), startSeconds, endSeconds);
      if (response.status === true) {
        setTrimmedVideoUrl(`${process.env.NEXT_URL_API_VIDEOS}/stream?videoName=${params.videoId}_cut.mp4&timestamp=${Date.now()}`);
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

  const validateLimits = (startTime: string, endTime: string) => {
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

    // Verifica se startTime está dentro do intervalo [00:00:00, videoDuration]
    if (startSeconds < 0 || startSeconds > durationSeconds) {
      setError("O horário de início deve estar dentro da duração do vídeo.");
      return false;
    }

    // Verifica se endTime está dentro do intervalo [startTime, videoDuration]
    if (endSeconds < startSeconds || endSeconds > durationSeconds) {
      setError("O horário de fim deve estar dentro da duração do vídeo e após o horário de início.");
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

   const handleStartClick = () => {
     if (playerState && playerState.currentTime !== undefined) {
       const currentTime = playerState.currentTime;
       setStartTime(secondsToHms(currentTime));
       setIsStartDisabled(true);
     }
   };

   // Função para definir o fim do corte usando playerState
   const handleEndClick = () => {
     if (playerState && playerState.currentTime !== undefined) {
       const currentTime = playerState.currentTime;
       setEndTime(secondsToHms(currentTime));
       setAutoTrim(autoTrim + 1);
       setIsStartDisabled(false);
     }
   };
  
  useEffect(() => {
    if (autoTrim > 0)
    {
      trimVideo();
    }
  }, [autoTrim])
  
  const ref1 = useRef<any>(null);
  const ref2 = useRef<any>(null);

  useEffect(() => {
    const handleFullScreenChange = () =>
    {
      const container = videoRef.current?.parentNode as HTMLElement;
      if (document.fullscreenElement)
      {
        container?.classList.add("fullscreen-active");
      } else
      {
        container?.classList.remove("fullscreen-active");
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

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
            <VideoContainer>
              <VideoPlayer
                onMounted={handleMounted}
                onStateChange={handleStateChange}
                crossOrigin="anonymous"
                height={320}
                controlBar={{ remainingTimeDisplay: false }}
                controls
                options={{
                  autoplay: false,
                  controls: true,
                  sources: [{ src: streamUrl, type: "video/mp4" }],
                  volume: 0.0,
                }}
              >
                {({ player, state }: { player: VideoJsPlayer | any; state: VideoPlayerState }) => (
                  <>
                    {!loading && (
                      <ButtonContainer>
                        <Tooltip label={!isStartDisabled ? "Definir Início do Corte" : "Definir Fim do Corte"} withArrow position="top">
                          <StyledActionIcon
                            variant="filled"
                            color="gray"
                            size="lg"
                            radius="xl"
                            aria-label={isStartDisabled ? "Definir Início" : "Definir Fim"}
                            onClick={!isStartDisabled ? handleStartClick : handleEndClick}
                          >
                            {!isStartDisabled ? <IconPlayerRecord stroke={1.5} color="white" /> : <IconPlayerPause stroke={1.5} color="#e03131" />}
                          </StyledActionIcon>
                        </Tooltip>
                      </ButtonContainer>
                    )}
                  </>
                )}
              </VideoPlayer>
            </VideoContainer>
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


              <Flex justify="center" mt="lg">

                <Button onClick={handleStartClick} disabled={isStartDisabled} leftSection={<IconPlayerRecord stroke={1.5} />}>
                  Marcar Início
                </Button>
                <Button onClick={handleEndClick} ml="md" disabled={!isStartDisabled} leftSection={<IconPlayerPause stroke={1.5} />}>
                  Marcar Fim
                </Button>
              </Flex>

              <Flex justify="center" align="center" mt={"md"}>
                <TimeInput
                  ref={ref1}
                  label="Início"
                  withSeconds
                  min="00:00:00"
                  max={videoDuration ? secondsToHms(videoDuration) : "23:59:59"}
                  value={startTime}
                  onChange={(event) => {
                    const newStartTime = event.target.value;
                    if (validateLimits(newStartTime, endTime)) {
                      setStartTime(newStartTime);
                    }
                  }}
                  mr={"md"}
                  className={classes.center}
                />

                <TimeInput
                  ref={ref2}
                  label="Fim"
                  withSeconds
                  min="00:00:00"
                  max={videoDuration ? secondsToHms(videoDuration) : "23:59:59"}
                  value={endTime}
                  onChange={(event) => {
                    const newEndTime = event.target.value;
                    if (validateLimits(startTime, newEndTime)) {
                      setEndTime(newEndTime);
                    }
                  }}
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
                  <VideoContainer>
                      <VideoPlayer
                      src={trimmedVideoUrl}
                      crossOrigin="anonymous"
                      height={320}
                      controlBar={{ remainingTimeDisplay: false }}
                      controls
                      options={{
                        autoplay: false,
                        controls: true,
                        sources: [{ src: trimmedVideoUrl, type: "video/mp4" }],
                        volume: 0.0,
                      }}
                    />
                  </VideoContainer>

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
