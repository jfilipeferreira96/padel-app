"use client";
import
{
    TextInput,
    PasswordInput,
    Checkbox,
    Anchor,
    Paper,
    Title,
    Text,
    Container,
    Group,
    Button,
    Center,
    Flex,
    useComputedColorScheme,
    UnstyledButton,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { routes } from "@/config/routes";
import styled from "styled-components";
import { z } from "zod";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { TimeInput } from "@mantine/dates";

// Tipagem para o retorno da função readFileAsBase64
const readFileAsBase64 = async (file: File): Promise<string | ArrayBuffer | null> =>
{
    return new Promise((resolve, reject) =>
    {
        const reader = new FileReader();
        reader.onload = () =>
        {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const FF = createFFmpeg({
    corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
});

export default function Teste()
{
    const [inputVideoFile, setInputVideoFile] = useState<File | null>(null); // Tipagem correta para File
    const [trimmedVideoFile, setTrimmedVideoFile] = useState<File | null>(null);
    const [videoMeta, setVideoMeta] = useState<{
        name: string;
        duration: number;
        videoWidth: number;
        videoHeight: number;
    } | null>(null);
    const [url, setUrl] = useState<string>(""); // Renomeado para evitar conflito com URL do browser
    const [trimIsProcessing, setTrimIsProcessing] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<string>("00:00:00");
    const [endTime, setEndTime] = useState<string>("00:00:00");
    const [rStart, setRstart] = useState<number>(0);
    const [rEnd, setRend] = useState<number>(10);
    const [thumbNails, setThumbNails] = useState<string[]>([]);
    const [thumbnailIsProcessing, setThumbnailIsProcessing] = useState(false);

    const [ready, setReady] = useState(false);
    const [compatible, setCompatible] = useState(false);

    const loadVideo = async () =>
    {
        //const videoStreaming = "http://localhost:3010/stream?fileName=1.mp4"; // Stream

        const videoUrl = "http://localhost:3010/download-file?filepath=videos/1.mp4"; // URL de download
        console.log('entrei')
        try
        {
            const response = await fetch(videoUrl);

            const blob = await response.blob();
            const file = new File([blob], "video.mp4", { type: "video/mp4" });

            setInputVideoFile(file);
            setUrl((await readFileAsBase64(file)) as string); // Garantindo que a URL seja uma string
        } catch (error)
        {
            console.log("Erro ao carregar o vídeo: ", error);
        }
    };
    const load = async () =>
    {
        try
        {
            await FF.load();
            setReady(true);
            setCompatible(true);
            loadVideo();
        } catch (error)
        {
            console.log(error);
            setReady(true);
            setCompatible(false);
        }
    };
    useEffect(() =>
    {
        load();
    }, []);

    const handleLoadedData = async (e: React.SyntheticEvent<HTMLVideoElement>) =>
    {
        const el = e.currentTarget;
        if (!inputVideoFile) return;

        const meta = {
            name: inputVideoFile.name,
            duration: el.duration,
            videoWidth: el.videoWidth,
            videoHeight: el.videoHeight,
        };
        setVideoMeta(meta);
    };

    return (
        <div>
            <Title mt={15} className="productheader">
                Vídeo
            </Title>
            <Center mt={"lg"}>
                {!ready ? (
                    <Text>A carregar</Text>
                ) : !compatible ? (
                    <Text>O seu browser não é compativel para fazer cortes.</Text>
                ) : (
                    <div>
                        <video
                            src={inputVideoFile ? url : undefined} // Evitar null, undefined é o mais adequado
                            autoPlay
                            controls
                            onLoadedMetadata={handleLoadedData}
                            width="450"
                        />

                                <Flex justify="center" align="center" mt="md">
                                    <TimeInput withSeconds label="Hora de início (HH:MM:SS)" value={startTime} onChange={(event) => setStartTime(event.currentTarget.value)} placeholder="00:00:10" />
                                    <TimeInput withSeconds label="Hora de fim (HH:MM:SS)" value={endTime} onChange={(event) => setEndTime(event.currentTarget.value)} placeholder="00:01:00" ml="md" />
                                </Flex>
                            </div>



                )}
            </Center>
        </div>
    );
}
