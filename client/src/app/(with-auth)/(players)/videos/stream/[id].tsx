"use client";
import React, { useState, useRef, useEffect } from "react";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import {  Center, Title, Loader } from "@mantine/core";
import { getVideosProcessed } from "@/services/video.service";

function VideoStream()
{
    const { user } = useSession();
    const [loading, setLoading] = useState<boolean>(true);

    const fetchComleteVideo = async () => {
        try
        {
    
           /*  const response = await getVideosProcessed(pagination);
            if (response)
            {
            
            } */

            setLoading(false);
        }
        catch (error)
        {
            setLoading(false);
        }
    };

    const streamParsedVideo = async () => {
        try
        {

            /*  const response = await getVideosProcessed(pagination);
             if (response)
             {
             
             } */

            setLoading(false);
        }
        catch (error)
        {
            setLoading(false);
        }
    };


    useEffect(() =>{
        fetchComleteVideo();
    }, []);


    if (!user || loading)
    {
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
       
        </div>
    );
}

export default VideoStream;
