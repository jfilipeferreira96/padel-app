"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "@/providers/SessionProvider";
import { Center, Title, Loader } from "@mantine/core";
import { useRouter } from "next/navigation";

interface Props {
  params: { videoId: string };
}
function VideoStream({ params }: Props) {
  const { user } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const router = useRouter();
  const videoId = params.videoId;

  const streamParsedVideo = async () => {
    try {
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Erro ao carregar o stream do vídeo:", error);
    }
  };

  const fetchCompleteVideo = async () => {
    try {
      if (videoId) { // isto nao funciona pois 
        const streamUrl = `http://localhost:5005/api/videos/stream?videoId=${videoId}&user=${user.id}`;
        setVideoUrl(streamUrl);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Erro ao carregar vídeo completo:", error);
    }
  };

  useEffect(() => {
    if (videoId) {
      //streamParsedVideo();
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

      {videoUrl && (
        <video controls src={videoUrl} width="100%">
          O seu navegador não suporta a reprodução de vídeo.
        </video>
      )}
    </div>
  );
}

export default VideoStream;
