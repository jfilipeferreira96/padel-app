// pages/api/video.js
/*
import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from "next";

async function postData(): Promise<{ status: boolean, error?: string, message?: string, data?: any }>
{
    
    try
    {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/videos/teste`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: "asdasd"
            })
        });

        const responseData = await response.json();
        
        return responseData;
    }
    catch (error)
    {
        console.log(error)
        return { status: false };
    }
}

type ResponseData = {
    message: string;
    status?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>)
{
    // Pedido à REST API
    const response = await postData();
    console.log('PostData status:', response);

    if (response.status)
    {
        // Lógica para quando a chamada API foi bem-sucedida
        const videoPath = path.resolve('.', 'videos', 'video.mp4');

        if (fs.existsSync(videoPath))
        {
            const stat = fs.statSync(videoPath);
            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Content-Length': stat.size,
            });

            const readStream = fs.createReadStream(videoPath);
            readStream.pipe(res);

        }
        else
        {
            res.status(404).json({ message: 'Video not found' });
        } 
    } else
    {
        res.json({ message: 'Failed to post data' });
    }
}
*/