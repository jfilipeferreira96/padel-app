"use client";
import
  {
    Title,
    Text,
    Center,
    Flex,
    Button,
    Loader,
  } from "@mantine/core";
import { useEffect, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { TimeInput } from "@mantine/dates";
import { useSession } from "@/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { getSingleVideoProcessed } from "@/services/video.service";
import { notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";

const FF = createFFmpeg({
  corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
});

const secondsToHms = (seconds: number) =>
{
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const hmsToSeconds = (hms: string) =>
{
  const [hours, minutes, seconds] = hms.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

interface Props
{
  params: { videoId: string };
}

export default function TesteE({ params }: Props) {
  const { user } = useSession();
  const [inputVideoFile, setInputVideoFile] = useState<File | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null); // URL do streaming
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string | null>(null); // URL do vídeo cortado
  const [ready, setReady] = useState(false); // Para indicar quando o FFmpeg estiver pronto
  const [compatible, setCompatible] = useState(false); // Para verificar compatibilidade do FFmpeg
  const [startTime, setStartTime] = useState<string>("00:00:00");
  const [endTime, setEndTime] = useState<string>("00:00:00");
  const [isTrimming, setIsTrimming] = useState(false); // Indicador de processamento
  const [downloadComplete, setDownloadComplete] = useState(false); // Indicar que o vídeo foi baixado
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 657px)");

  const downloadVideo = async () =>
  {
    const videoUrl = `${process.env.NEXT_URL_API_VIDEOS}/download-file?filepath=videos/${params.videoId}.mp4`;

    try
    {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const file = new File([blob], "video.mp4", { type: "video/mp4" });

      setInputVideoFile(file); // Armazena o arquivo para manipulação com FFmpeg
      setDownloadComplete(true);
      setLoading(false);
    }
    catch (error)
    {
      console.log("Erro ao baixar o vídeo: ", error);
    }
  };

  // Função para carregar e verificar FFmpeg
  const loadFFmpeg = async () => {
    try
    {
      await FF.load(); // Carregando FFmpeg
      setReady(true);
      setCompatible(true); // FFmpeg carregado e pronto para uso
    } catch (error)
    {
      console.log("Erro ao carregar FFmpeg: ", error);
      setReady(true);
      setCompatible(false); // Caso o FFmpeg falhe, definimos o navegador como não compatível
    }
  };

  const validateTimes = () =>
  {
    if (!videoDuration) return false;
    const startSeconds = hmsToSeconds(startTime);
    const endSeconds = hmsToSeconds(endTime);
    const durationSeconds = videoDuration;

    if (startSeconds > endSeconds)
    {
      setError("A hora de início não pode ser maior que a hora de fim.");
      return false;
    }

    if (startSeconds < 0 || endSeconds > durationSeconds)
    {
      setError("As horas de início e fim devem estar dentro dos parâmetros do vídeo.");
      return false;
    }

    setError(null);
    return true;
  };

  const fetchStreamVideo = async () => {
    try
    {
      if (params.videoId)
      {
        const check = await getSingleVideoProcessed(parseInt(params.videoId));
       
        if (check.status)
        {
          const streamUrl = `${process.env.NEXT_URL_API_VIDEOS}/stream?videoName=${params.videoId}.mp4`;

          setStreamUrl(streamUrl);
          setLoading(false);
        }
        else
        {
          notifications.show({
            message: check.message,
            color: "red",
          });
          router.back();
        }

      }
    } catch (error)
    {
      setLoading(false);
      console.error("Erro ao carregar vídeo completo:", error);
    }
  };

  useEffect(() =>{
    fetchStreamVideo();
    loadFFmpeg();
  }, []);

  useEffect(() => {
    if (compatible) {
      downloadVideo();
    }
  }, [compatible]);

  const trimVideo = async () =>
  {
    if (!compatible || !inputVideoFile) return;
    if (!validateTimes()) return;

    setIsTrimming(true);
    setReady(false);

    try
    {
      FF.FS("writeFile", "input.mp4", await fetchFile(inputVideoFile));

      await FF.run(
        "-i", "input.mp4", // Arquivo de entrada
        "-ss", startTime, // Hora de início
        "-to", endTime, // Hora de fim
        "-c", "copy", // Copiar codecs sem recodificar
        "output.mp4" // Arquivo de saída
      );

      const data = FF.FS("readFile", "output.mp4");

      const trimmedBlob = new Blob([data.buffer], { type: "video/mp4" });

      const trimmedUrl = URL.createObjectURL(trimmedBlob);
      setTrimmedVideoUrl(trimmedUrl);
    } catch (error)
    {
      console.log("Erro ao cortar o vídeo: ", error);
    } finally
    {
      setIsTrimming(false);
      setReady(true);
    }
  };

  const handleMetadataLoaded = (event: React.ChangeEvent<HTMLVideoElement>) =>
  {
    const video = event.currentTarget;
    const durationInSeconds = video.duration;
    setVideoDuration(durationInSeconds);

    setEndTime(secondsToHms(durationInSeconds));
  };

  if (!user || loading)
  {
      return (
          <Center mt={100} mih={"50vh"}>
              <Loader color="blue" />
          </Center>
      );
  }

  if (loading)
  {
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
          <video controls src={streamUrl} autoPlay width={isMobile ? "320px" : "600px"} onLoadedMetadata={handleMetadataLoaded}>
            O seu navegador não suporta a reprodução de vídeo.
          </video>
        )}
      </Center>

      <Center mt={"lg"}>
        {!ready ? (
          <Text>A carregar...</Text>
        ) : !compatible ? (
          <Text>O seu browser não é compatível para manipular vídeos.</Text>
        ) : (
          <div>
            {/* Exibir controles de corte após o download */}
            {!downloadComplete && compatible && <div>Por favor, aguarde um momento enquanto carregamos o vídeo completo para realizar os cortes.</div>}
            {
              <div>
                <Flex justify="center" align="center">
                  <TimeInput disabled={!downloadComplete} withSeconds label="Hora de início (HH:MM:SS)" value={startTime} onChange={(event) => setStartTime(event.currentTarget.value)} placeholder="00:00:10" />

                  <TimeInput disabled={!downloadComplete} withSeconds label="Hora de fim (HH:MM:SS)" value={endTime} onChange={(event) => setEndTime(event.currentTarget.value)} placeholder="00:01:00" ml="md" />
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
              <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                <video src={trimmedVideoUrl} controls width={isMobile ? "320px" : "600px"} />
              </div>
            )}
          </div>
        )}
      </Center>
    </div>
  );
}
