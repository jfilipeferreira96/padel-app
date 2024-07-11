"use client";
import React, { useState, useRef, useEffect } from "react";
import { Center, Card, Loader, Title, SimpleGrid, Image, Text, Container, AspectRatio, Box, UnstyledButton } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import "photoswipe/dist/photoswipe.css";
import { Gallery, Item } from "react-photoswipe-gallery";
import { IconDownload, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { getAllNews } from "@/services/news.service";
const baseUrl = process.env.NEXT_PUBLIC_API || "http://localhost:5005/";

const mockdata = [
  {
    title: "Top 10 places to visit in Norway this summer",
    image: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80",
    date: "August 18, 2022",
  },
  {
    title: "Best forests to visit in North America",
    /*  image: "http://localhost:5005/api/uploads/8/1000020547.jpg", */
    date: "August 27, 2022",
  },
  {
    title: "Hawaii beaches review: better than you think",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80",
    date: "September 9, 2022",
  },
  {
    title: "Mountains at night: 12 best locations to enjoy the view",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80",
    date: "September 12, 2022",
  },
];

function Home() {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ title: string; image_path: string; download_path: string; date: string }[]>([]);
  console.log(data)

  if (!user) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  const handleClickOutside = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const closeButton = document.querySelector(".pswp__button.pswp__button--close") as HTMLButtonElement | null;
    if (closeButton) {
      closeButton.click();
    }
  };

  const cards = data.map((article, index) => (
    <Gallery key={index} withDownloadButton>
      <Item
        content={
          <Center h={"100%"} bg="var(--mantine-color-gray-light)" p={20} onClick={handleClickOutside}>
            <div className={classes.topbar}>
              <UnstyledButton
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(1);
                }}
              >
                <IconDownload size={30} stroke={1.5} color="light-dark(var(--mantine-color-black), var(--mantine-color-white))" />
              </UnstyledButton>
              <UnstyledButton onClick={handleClickOutside} mr={10}>
                <IconX size={30} stroke={1.5} color="light-dark(var(--mantine-color-black), var(--mantine-color-white))" />
              </UnstyledButton>
            </div>

            <div>
              <Title className={classes.title} ta="center" mb={"lg"}>
                {article.title}
              </Title>
              <Image src={article.image_path ?? "./Placeholder.svg"} alt={article.title} />
            </div>
          </Center>
        }
      >
        {({ ref, open }) => (
          <Card p="md" radius="md" component="a" href="#" className={classes.card} ref={ref} onClick={open}>
            <AspectRatio ratio={1920 / 1080}>
              <Image src={article.image_path ?? "./Placeholder.svg"} alt={article.title} />
            </AspectRatio>
            <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
              {article.date}
            </Text>
            <Text className={classes.title} mt={5}>
              {article.title}
            </Text>
          </Card>
        )}
      </Item>
    </Gallery>
  ));

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchCard = async () => {
      try {
        const pagination = {
          page: 1,
          limit: 99999,
          orderBy: "id",
          order: "DESC",
        };

        const response = await getAllNews(pagination);
        if (response.status) {
          const transformedData = response.data.map((arr: { id: number; title: string; image_path: string; download_path: string; date: string }) => ({
            title: arr.title,
            image_path: arr.image_path ? `${baseUrl}api/uploads/${arr.id}/${arr.image_path}` : null,
            download_path: arr.download_path ? `${baseUrl}api/download/${arr.id}/${arr.download_path}` : null,
            date: arr.date,
          }));
          setData(transformedData);

          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching card data:", error);
        notifications.show({
          title: "Erro",
          message: "Algo correu mal",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [user]);

  if (isLoading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <div>
      <Title mt={15} className="productheader">
        Olá {user?.first_name} {user?.last_name} 👋
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} mt={20}>
        {cards}
      </SimpleGrid>
    </div>
  );
}

export default Home;
