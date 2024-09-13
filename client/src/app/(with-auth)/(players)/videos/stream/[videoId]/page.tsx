"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "@/providers/SessionProvider";
import { Center, Title, Loader, Flex, TextInput, Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { TimeInput } from "@mantine/dates";

interface Props {
  params: { videoId: string };
}
function VideoStream({ params }: Props) {
  const { user } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const router = useRouter();
  const videoId = params.videoId;
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [cuttedVideoUrl, setCuttedVideoUrl] = useState("");

  const fetchCompleteVideo = async () => {
    try {
      if (videoId) {
        // isto nao funciona pois
        const streamUrl = `http://localhost:3010/stream?videoName=${videoId}.mp4`;
        setVideoUrl(streamUrl);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Erro ao carregar vídeo completo:", error);
    }
  };

  const handleCutVideo = async () => {
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3010/cut-video?filename=${videoId}.mp4&start=${startTime}&end=${endTime}`);
      const res = await response.json();
      if (res.status) {
        // Guarda o nome do arquivo de saída no estado
        setCuttedVideoUrl(`http://localhost:3010/stream?videoName=${res.filename}.mp4`);
      }
     
    } catch (error) {
      console.error("Erro ao cortar vídeo", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchCompleteVideo();
    }
  }, [videoId]);

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
        Blablablabla
      </Title>

      <Center mt={"lg"}>
        {videoUrl && (
          <video controls src={videoUrl} width="80%">
            O seu navegador não suporta a reprodução de vídeo.
          </video>
        )}

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

      {/* Botão de cortar com estado de loading */}
      <Center mt="md">
        <Button onClick={handleCutVideo} disabled={loading}>
          {loading ? <Loader size="sm" /> : "Cortar"}
        </Button>
      </Center>
    </div>
  );
}

export default VideoStream;
