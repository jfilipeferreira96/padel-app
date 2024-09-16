"use client";
import
    {
        Title,
        Text,
        Center,
        Flex,
        Button,
    } from "@mantine/core";
import { useEffect, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { TimeInput } from "@mantine/dates";

// Função para ler arquivo como Base64
const readFileAsBase64 = async (file: File): Promise<string | ArrayBuffer | null> =>
{
    return new Promise((resolve, reject) =>
    {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Inicializando FFmpeg
const FF = createFFmpeg({
    corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
});

export default function Teste()
{
    const [inputVideoFile, setInputVideoFile] = useState<File | null>(null);
    const [streamUrl] = useState<string>("http://localhost:3010/stream?videoName=1.mp4"); // URL do streaming
    const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string | null>(null); // URL do vídeo cortado
    const [ready, setReady] = useState(false); // Para indicar quando o FFmpeg estiver pronto
    const [compatible, setCompatible] = useState(false); // Para verificar compatibilidade do FFmpeg
    const [startTime, setStartTime] = useState<string>("00:00:00");
    const [endTime, setEndTime] = useState<string>("00:00:00");
    const [isTrimming, setIsTrimming] = useState(false); // Indicador de processamento
    const [downloadComplete, setDownloadComplete] = useState(false); // Indicar que o vídeo foi baixado

    // Função para baixar o vídeo para manipulação
    const downloadVideo = async () =>
    {
        const videoUrl = "http://localhost:3010/download-file?filepath=videos/1.mp4"; // URL de download
        try
        {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const file = new File([blob], "video.mp4", { type: "video/mp4" });

            setInputVideoFile(file); // Armazena o arquivo para manipulação com FFmpeg
            setDownloadComplete(true); // Indica que o download está completo
        } catch (error)
        {
            console.log("Erro ao baixar o vídeo: ", error);
        }
    };

    // Função para carregar e verificar FFmpeg
    const loadFFmpeg = async () =>
    {
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

    useEffect(() =>
    {
        loadFFmpeg(); // Verificar FFmpeg quando o componente for montado
        downloadVideo(); // Baixar o vídeo em segundo plano
    }, []);

    // Função para cortar o vídeo usando FFmpeg
    const trimVideo = async () =>
    {
        if (!compatible || !inputVideoFile) return;

        setIsTrimming(true); // Indicador de que o corte está em andamento
        setReady(false); // Desativa interações enquanto processa

        try
        {
            // Adicionando o vídeo no sistema de arquivos do FFmpeg
            FF.FS("writeFile", "input.mp4", await fetchFile(inputVideoFile));

            // Executando o comando de corte no FFmpeg
            await FF.run(
                "-i", "input.mp4", // Arquivo de entrada
                "-ss", startTime, // Hora de início
                "-to", endTime, // Hora de fim
                "-c", "copy", // Copiar codecs sem recodificar
                "output.mp4" // Arquivo de saída
            );

            // Lendo o arquivo cortado do sistema de arquivos virtual do FFmpeg
            const data = FF.FS("readFile", "output.mp4");

            // Criando um Blob para o arquivo de saída
            const trimmedBlob = new Blob([data.buffer], { type: "video/mp4" });

            // Gerando URL para download ou exibição
            const trimmedUrl = URL.createObjectURL(trimmedBlob);
            setTrimmedVideoUrl(trimmedUrl); // Atualizando a URL do vídeo cortado
        } catch (error)
        {
            console.log("Erro ao cortar o vídeo: ", error);
        } finally
        {
            setIsTrimming(false); // Fim do processo de corte
            setReady(true); // Reativar interações
        }
    };

    return (
        <div>
            <Title mt={15}>Vídeo via Stream</Title>
            <Center mt={"lg"}>
                {!ready ? (
                    <Text>A carregar...</Text>
                ) : !compatible ? (
                    <Text>O seu browser não é compatível para manipular vídeos com FFmpeg.</Text>
                ) : (
                    <div>
                        {/* Exibição do vídeo via stream */}
                        <video
                            src={streamUrl} // Exibe o vídeo via stream
                            controls
                            width="450"
                        />

                        {/* Exibir controles de corte após o download */}
                        {downloadComplete && (
                            <div>
                                <Flex justify="center" align="center" mt="md">
                                    <TimeInput
                                        withSeconds
                                        label="Hora de início (HH:MM:SS)"
                                        value={startTime}
                                        onChange={(event) => setStartTime(event.currentTarget.value)}
                                        placeholder="00:00:10"
                                    />
                                    <TimeInput
                                        withSeconds
                                        label="Hora de fim (HH:MM:SS)"
                                        value={endTime}
                                        onChange={(event) => setEndTime(event.currentTarget.value)}
                                        placeholder="00:01:00"
                                        ml="md"
                                    />
                                </Flex>

                                {/* Botão para cortar o vídeo */}
                                <Button mt="md" onClick={trimVideo} disabled={isTrimming}>
                                    {isTrimming ? "Cortando..." : "Cortar Vídeo"}
                                </Button>
                            </div>
                        )}

                        {/* Exibição do vídeo cortado */}
                        {trimmedVideoUrl && (
                            <div>
                                <Title mt={15}>Vídeo Cortado</Title>
                                <video
                                    src={trimmedVideoUrl}
                                    controls
                                    width="450"
                                />
                            </div>
                        )}
                    </div>
                )}
            </Center>
        </div>
    );
}
