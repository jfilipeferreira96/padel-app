"use client";

import { useEffect, useState } from 'react';

const VideoPage = () =>
{
    const [videoSrc, setVideoSrc] = useState('');

    useEffect(() =>
    {
        // Função para buscar o vídeo
        const fetchVideo = async () =>
        {
            try
            {
                const videoId = 1; // ID do vídeo
                const user = 1;    // ID do usuário

                // Monta a URL para o vídeo
                const url = `http://localhost:3010/stream?videoName=aaa.mp4`;

                //stream - works
                //const url = `http://localhost:5005/api/videos/stream-parsed?videoId=${videoId}&user=${user}&start=${0}&end=${1000}`;

                // Define a URL do vídeo diretamente no state
                setVideoSrc(url);
            } catch (error)
            {
                console.error("Erro ao buscar o vídeo:", error);
            }
        };

        fetchVideo();
    }, []);

    return (
        <div>
            <h1>Vídeo Streaming</h1>
            {videoSrc ? (
                <video
                    src={videoSrc}
                    controls
                    style={{ width: '100%', maxWidth: '800px' }}
                >
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            ) : (
                <p>Carregando vídeo...</p>
            )}
        </div>
    );
};

export default VideoPage;
