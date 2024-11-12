"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, Badge, SimpleGrid, Skeleton, Grid, Tooltip, ActionIcon, rem, Group, Button, Modal } from "@mantine/core";
import { deleteNews, getAllNews, updateNews } from "@/services/news.service";
import { IconCircleLetterA, IconCircleLetterD, IconEye, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import AddNewsModal from "@/components/news-modal/add";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { usePathname } from "next/navigation";

function getBadge(isActive: number)
{
  return isActive === 1 ? { name: "Ativo", color: "blue" } : { name: "Inativo", color: "gray" };
}

interface News
{
  id: number;
  title: string;
  content: string;
  author: string;
  is_active: number;
  category: string | null;
  url_image: string | null;
  created_at: string;
}

function News()
{
  const pathname = usePathname();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(() =>
  {
    const storedValue = localStorage.getItem(pathname);
    return storedValue ? parseInt(storedValue) : 10;
  });
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isModalOpenAdd, setIsModalOpenAdd] = useState<boolean>(false);
  const [deleteNewsId, setDeleteNewsId] = useState<number | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchData = async () =>
  {
    setLoading(true);
    try
    {
      const pagination = {
        page: activePage,
        limit: elementsPerPage,
        orderBy: 'id',
        order: 'DESC'
      }

      const response = await getAllNews(pagination);

      if (response)
      {
        setNews(response.data);
        setTotalElements(response.pagination.total || 0);
        setActivePage(response.pagination.page || 1);
      }

      setLoading(false);
    } catch (error)
    {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() =>
  {
    fetchData();
  }, [activePage, elementsPerPage]);

  const handlePageChange = (page: number) =>
  {
    setActivePage(page);
  };

  const handleEditClick = (newsId: number) => {
  
    updateNews(newsId)
      .then((res) => {
        if (res.status === true) {
          notifications.show({
            message: res.message,
            color: "green",
          });
        } else {
          notifications.show({
            title: "Erro",
            message: "Algo correu mal",
            color: "red",
          });
        }
      })
      .finally(() => {
        close(), fetchData();
      });
  };

  const handleElementsPerPageChange = (value: string | null) =>
  {

    if (value)
    {
      setElementsPerPage(parseInt(value));
      setActivePage(1); // Reset to first page whenever elements per page change
      localStorage.setItem(pathname, value);
    }
  };

  const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage;

  const rows = news?.map((article) => (
    <Table.Tr key={article.id} bg={selectedRows.includes(article.id) ? "var(--mantine-color-blue-light)" : undefined}>
      <Table.Td>
        <Badge variant="filled" size="md" fw={700} color={getBadge(article.is_active).color} style={{ minWidth: "110px" }}>
          {getBadge(article.is_active).name}
        </Badge>
      </Table.Td>
      <Table.Td>{article.title}</Table.Td>
      <Table.Td>{article.author}</Table.Td>
      <Table.Td>
        <Group gap={0} justify="center">
          <Tooltip label={"Apagar Notícias"} withArrow position="top">
            <ActionIcon
              className="action-icon-size"
              variant="filled"
              color="red"
              onClick={() => {
                setDeleteNewsId(article.id);
                open();
              }}
            >
              <IconTrash style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={article.is_active ? "Desativar" : "Ativar"} withArrow position="top">
            <ActionIcon className="action-icon-size" variant="filled" onClick={() => handleEditClick(article.id)}>
              {article.is_active ? <IconCircleLetterD size={20} stroke={1.5} /> : <IconCircleLetterA size={20} stroke={1.5} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <h1>Notícias</h1>
      <AddNewsModal isModalOpen={isModalOpenAdd} setIsModalOpen={setIsModalOpenAdd} fetchData={fetchData} />

      <Modal opened={opened} onClose={close} withCloseButton={false}>
        <Center>
          <h3>Tem a certeza que pretende eliminar?</h3>
        </Center>
        <Button
          fullWidth
          variant="filled"
          color="red"
          size="md"
          onClick={() => {
            if (deleteNewsId) {
              deleteNews(deleteNewsId)
                .then((res) => {
                  if (res.status === true) {
                    notifications.show({
                      message: res.message,
                      color: "red",
                    });
                  } else {
                    notifications.show({
                      title: "Erro",
                      message: "Algo correu mal",
                      color: "red",
                    });
                  }
                })
                .finally(() => {
                  close(), fetchData();
                });
            }
          }}
        >
          Confirmo
        </Button>
      </Modal>

      <Card withBorder shadow="md" p={30} mt={10} radius="md" style={{ flex: 1 }}>
        <Group justify="space-between" align="center" mb={"lg"}>
          <Flex align={"center"}>
            <Text>A mostrar</Text>
            <Select
              data={["10", "20", "30", "50"]}
              value={elementsPerPage.toString()}
              allowDeselect={false}
              style={{ width: "80px", marginLeft: "8px" }}
              ml={4}
              mr={4}
              onChange={(value) => handleElementsPerPageChange(value)}
            />
            <Text>entradas</Text>
          </Flex>

          <Button
            variant="light"
            color="green"
            rightSection={<IconPlus size={18} />}
            onClick={() => {
              setIsModalOpenAdd(true);
            }}
          >
            Adicionar Notícia
          </Button>
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Título</Table.Th>
                <Table.Th>Autor</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {news.length > 0 && (
          <Flex justify={"space-between"} mt={"lg"}>
            <Text>
              A mostrar {initialIndex + 1} a {Math.min(finalIndex, totalElements)} de {totalElements} elementos
            </Text>
            <MantinePagination total={Math.ceil(totalElements / elementsPerPage)} onChange={handlePageChange} />
          </Flex>
        )}
      </Card>
    </>
  );
}

export default News;
