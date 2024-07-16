"use client";
import React, { useState, useEffect } from "react";
import { Center, Card, Loader, Title, SimpleGrid, Image, Text, AspectRatio, UnstyledButton, Flex, Pagination } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import "photoswipe/dist/photoswipe.css";
import { Gallery, Item } from "react-photoswipe-gallery";
import { IconDownload, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { getAllNews } from "@/services/news.service";
import dayjs from "dayjs";
import "dayjs/locale/pt";
dayjs.locale("pt");

const ArticleCard = ({ article }: { article: { title: string; image_path: string; download_path: string; date: string, is_active: boolean } }) => {
  if (!article.is_active) return;
  
  const handleClickOutside = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const closeButton = document.querySelector(".pswp__button.pswp__button--close") as HTMLButtonElement | null;
    if (closeButton) {
      closeButton.click();
    }
  };

  return (
    <Gallery withDownloadButton>
      <Item
        content={
          <Center h={"100%"} bg="var(--mantine-color-gray-light)" p={20} onClick={handleClickOutside}>
            <div className={classes.topbar}>
              <UnstyledButton
                onClick={(e) => {
                  e.stopPropagation();
                  if (article.download_path) {
                    window.open(article.download_path, "_blank");
                  } else {
                    notifications.show({
                      title: "Download Indisponível",
                      message: "Não há link de download disponível para este artigo.",
                      color: "red",
                    });
                  }
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
  );
};

const baseUrl = process.env.NEXT_PUBLIC_API || "http://localhost:5005/";

const Home = () => {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ title: string; image_path: string; download_path: string; date: string; is_active: boolean }[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(1);
  const elementsPerPage = 9;

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const pagination = {
          page,
          limit: elementsPerPage,
          orderBy: "date",
          order: "DESC",
        };

        const response = await getAllNews(pagination);
        
        if (response.status) {
          const transformedData = response.data.map((arr: { id: number; title: string; image_path: string; download_path: string; date: string; is_active: boolean }) => ({
            title: arr.title,
            image_path: arr.image_path ? `${baseUrl}api/uploads/${arr.id}/${arr.image_path}` : null,
            download_path: arr.download_path ? `${baseUrl}api/download/${arr.id}/${arr.download_path}` : null,
            date: arr.date ? dayjs(arr.date).format("MMMM D, YYYY") : null,
            is_active: arr.is_active,
          }));
          setData(transformedData);
          setTotalElements(response.pagination.total); 
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
  }, [user, page]);

  const handlePageChange = (page:number) => {
    setPage(page);
  };

  if (isLoading || !user) {
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
        {data.map((article, index) => (
          <ArticleCard key={index} article={article} />
        ))}
      </SimpleGrid>
      {totalElements > 9 && (
        <Center  mt={"lg"}>
          <Pagination total={Math.ceil(totalElements / elementsPerPage)} onChange={handlePageChange} />
        </Center>
      )}
    </div>
  );
};

export default Home;
