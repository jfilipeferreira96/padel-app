"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "@/providers/SessionProvider";
import { Center, Title, Loader, Flex, TextInput, Button, Text, Stack } from "@mantine/core";
import { useRouter } from "next/navigation";
import { TimeInput } from "@mantine/dates";
import { getSingleVideoProcessed } from "@/services/video.service";
import { notifications } from "@mantine/notifications";

interface Props {
  params: { videoId: string };
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

function VideoStream({ params }: Props) {
  const { user } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:00:00");
  const [cuttedVideoUrl, setCuttedVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isCutting, setIsCutting] = useState<boolean>(false);

  const fetchCompleteVideo = async () => {
    try {
      if (params.videoId) {
        const check = await getSingleVideoProcessed(parseInt(params.videoId));
        if (check.status) {
          const streamUrl = `${process.env.NEXT_URL_API_VIDEOS || "https://www.videos-pro-padel.top"}/stream?videoName=${params.videoId}.mp4`;
          setVideoUrl(streamUrl);
          setLoading(false);
        }
        else {
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

  const handleMetadataLoaded = (event: React.ChangeEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const durationInSeconds = video.duration;
    setVideoDuration(durationInSeconds);

    setEndTime(secondsToHms(durationInSeconds));
  };

  const validateTimes = () => {
    if (!videoDuration) return false;
    const startSeconds = hmsToSeconds(startTime);
    const endSeconds = hmsToSeconds(endTime);
    const durationSeconds = videoDuration;

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

  const handleCutVideo = async () => {
    if (!validateTimes()) return;

    setIsCutting(true);
    try {
      const response = await fetch(`${process.env.NEXT_URL_API_VIDEOS || "https://www.videos-pro-padel.top"}/cut-video?filename=${params.videoId}.mp4&start=${startTime}&end=${endTime}`);
      const res = await response.json();
      if (res.status) {
        setCuttedVideoUrl(`${process.env.NEXT_URL_API_VIDEOS || "https://www.videos-pro-padel.top"}/stream?videoName=${res.filename}`);
      }
    } catch (error) {
      console.error("Erro ao cortar vídeo", error);
    } finally {
      setIsCutting(false);
    }
  };

  useEffect(() => {
    if (params.videoId) {
      fetchCompleteVideo();
    }
  }, [params.videoId]);

  if (!user || loading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <div>
      <Title mt={15} className="productheader">
        Vídeo
      </Title>

      <Center mt={"lg"}>
        {videoUrl && (
          <video controls src={videoUrl} width="80%" onLoadedMetadata={handleMetadataLoaded}>
            O seu navegador não suporta a reprodução de vídeo.
          </video>
        )}
      </Center>
      <Center mt={"lg"}>
        {cuttedVideoUrl && (
          <video controls src={cuttedVideoUrl} width="80%">
            O seu navegador não suporta a reprodução de vídeo.
          </video>
        )}
      </Center>

      <Flex justify="center" align="center" mt="md">
        <TimeInput withSeconds label="Hora de início (HH:MM:SS)" value={startTime} onChange={(event) => setStartTime(event.currentTarget.value)} placeholder="00:00:10" />
        <TimeInput withSeconds label="Hora de fim (HH:MM:SS)" value={endTime} onChange={(event) => setEndTime(event.currentTarget.value)} placeholder="00:01:00" ml="md" />
      </Flex>

      {error && (
        <Center>
          <Text color="red" size="sm" style={{ position: "relative", top: "5px" }}>
            {error}
          </Text>
        </Center>
      )}

      <Center mt="md">
        <div style={{ textAlign: "center"}}>
          <Button onClick={handleCutVideo} disabled={loading} loading={isCutting}>
            {loading ? <Loader size="sm" /> : "Cortar"}
          </Button>
          {isCutting && (
            <Text size="sm" color="dimmed" mt="xs">
              Este procedimento pode ser demorado. Por favor, aguarde.
            </Text>
          )}
        </div>
      </Center>
    </div>
  );
}

export default VideoStream;
