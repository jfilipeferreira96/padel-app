"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Select, Flex, Tooltip, ActionIcon, TextInput, Box, Text, Group, Pagination, rem, Modal, Center, Button } from "@mantine/core";
import { IconCheck, IconRefresh, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { useLocation } from "@/providers/LocationProvider";
import { usePathname } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { getCreditsHistory, getVideosWaiting, processVideo } from "@/services/video.service";
import dayjs from "dayjs";

// Interface para os vouchers
interface Voucher
{
  user_id: number;
  credits_before: number;
  credits_after: number;
  given_by: string | null;
  created_at: Date;
  phone: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
}

// Interface para os vídeos waiting
interface VideoWaiting
{
  id: number;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  campo: string;
  campo_name: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface VideoActionProps
{
  videoId: number;
  accepted: boolean;
}

function VideoCredits()
{
  const pathname = usePathname();
  const [activeVoucherPage, setActiveVoucherPage] = useState<number>(1); // Separado para os vouchers
  const [activeVideoPage, setActiveVideoPage] = useState<number>(1); // Separado para vídeos
  const [elementsPerPage, setElementsPerPage] = useState<number>(() =>
  {
    const storedValue = localStorage.getItem(pathname);
    return storedValue ? parseInt(storedValue) : 10;
  });
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [videosWaiting, setVideosWaiting] = useState<VideoWaiting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalVouchers, setTotalVouchers] = useState<number>(0);
  const { location } = useLocation();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterOption, setFilterOption] = useState<string | null>(() =>
  {
    const storedValue = localStorage.getItem("filterVoucher");
    return storedValue ? storedValue : null;
  });

  // Função para buscar vídeos com status "waiting"
  const fetchVideosWaiting = async () =>
  {
    setLoading(true);
    try
    {
      const pagination = {
        page: activeVideoPage, // Usando activeVideoPage para paginação de vídeos
        limit: elementsPerPage,
        orderBy: "vp.id",
        order: "DESC",
      };

      const filters: any = {
        email: searchTerm ?? null,
        name: searchTerm ?? null,
        phone: searchTerm ?? null,
      };

      const response = await getVideosWaiting(pagination, filters);
      if (response.status)
      {
        setVideosWaiting(response.data);
      }
      setLoading(false);
    } catch (error)
    {
      console.error("Erro ao buscar vídeos por aceitar:", error);
      setLoading(false);
    }
  };

  // Função para buscar dados dos históricos de crédito
  const fetchData = async () =>
  {
    setLoading(true);
    try
    {
      const pagination = {
        page: activeVoucherPage, // Usando activeVoucherPage para paginação de vouchers
        limit: elementsPerPage,
        orderBy: "uch.id",
        order: "DESC",
      };

      const filters: any = {
        email: searchTerm ?? null,
        name: searchTerm ?? null,
        phone: searchTerm ?? null,
      };

      if (filterOption === "Ver ativados")
      {
        filters.validated_by = false;
      } else if (filterOption === "Ver não ativados")
      {
        filters.validated_by = true;
      }

      const response = await getCreditsHistory(pagination, filters);

      if (response.status)
      {
        setVouchers(response.data);
        setTotalVouchers(response.pagination.total || 0);
        setActiveVoucherPage(response.pagination.page || 1);
      }

      setLoading(false);
    } catch (error)
    {
      console.error("Erro ao buscar histórico de créditos:", error);
      setLoading(false);
    }
  };

  const handleFilterChange = (value: string | null) =>
  {
    setFilterOption(value);
    localStorage.setItem("filterVoucher", value || "");
  };

  useEffect(() =>
  {
    fetchData();
    fetchVideosWaiting(); // Buscar vídeos por aceitar ao carregar o componente
  }, [activeVoucherPage, activeVideoPage, elementsPerPage, searchTerm, filterOption]);

  const handleVoucherPageChange = (page: number) =>
  {
    setActiveVoucherPage(page); // Função específica para mudar página dos vouchers
  };

  const handleVideoPageChange = (page: number) =>
  {
    setActiveVideoPage(page); // Função específica para mudar página dos vídeos
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) =>
  {
    setSearchTerm(event.currentTarget.value);
  };

  const handleElementsPerPageChange = (value: string | null) =>
  {
    if (value)
    {
      setElementsPerPage(parseInt(value));
      setActiveVoucherPage(1); // Reset para primeira página sempre que o número de elementos por página muda
      localStorage.setItem(pathname, value);
    }
  };

  const initialIndex = (activeVoucherPage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage;

  const onProcessVideo = async ({ videoId, accepted }: VideoActionProps) =>
  {
    try
    {
      const response = await processVideo(videoId, accepted);
      if (response.status)
      {
        notifications.show({
          title: "Sucesso",
          message: response.message,
          color: "green",
        });
        fetchData();
        fetchVideosWaiting();
      } else
      {
        notifications.show({
          title: "Erro",
          message: accepted ? "Falha ao validar o vídeo." : "Falha ao rejeitar o vídeo.",
          color: "red",
        });
      }
    } catch (error)
    {
      notifications.show({
        title: "Erro",
        message: accepted ? "Falha ao validar o vídeo." : "Falha ao rejeitar o vídeo.",
        color: "red",
      });
    }
  };

  // Mapeamento dos vídeos por aceitar para a tabela
  const videoRows = videosWaiting.map((video, index) => (
    <Table.Tr key={index}>
      <Table.Td>{`${video.user_first_name} ${video.user_last_name}`}</Table.Td>
      <Table.Td>{video.user_email}</Table.Td>
      <Table.Td>{video.campo_name}</Table.Td>
      <Table.Td>{dayjs(video.date).format("YYYY-MM-DD")}</Table.Td>
      <Table.Td>{video.start_time}</Table.Td>
      <Table.Td>{video.end_time}</Table.Td>
      <Table.Td>
        <Group gap={0} justify="center">
          <Tooltip label="Validar Vídeo" withArrow position="top">
            <ActionIcon className="action-icon-size" variant="filled" color="green" onClick={() => onProcessVideo({ videoId: video.id, accepted: true })}>
              <IconCheck size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Recusar Vídeo" withArrow position="top">
            <ActionIcon className="action-icon-size" variant="filled" color="red" onClick={() => onProcessVideo({ videoId: video.id, accepted: false })}>
              <IconX size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  // Mapeamento dos vouchers para a tabela
  const voucherRows = vouchers.map((voucher, index) => (
    <Table.Tr key={index}>
      <Table.Td>
        {voucher.user_first_name} {voucher.user_last_name}
      </Table.Td>
      <Table.Td>{voucher.user_email}</Table.Td>
      <Table.Td>{voucher.phone}</Table.Td>
      <Table.Td>{voucher.credits_before}</Table.Td>
      <Table.Td>{voucher.credits_after}</Table.Td>
      <Table.Td>{voucher.given_by ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "-"}</Table.Td>
      <Table.Td>{new Date(voucher.created_at).toLocaleString()}</Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <h1>Vídeos por Aceitar</h1>

      <Card withBorder shadow="md" p={30} mt={10} radius="md" style={{ flex: 1 }}>
        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Campo</Table.Th>
                <Table.Th>Data</Table.Th>
                <Table.Th>Hora de Início</Table.Th>
                <Table.Th>Hora de Fim</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{videoRows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {videosWaiting.length === 0 && (
          <Center>
            <Text>Nenhum vídeo por aceitar no momento.</Text>
          </Center>
        )}
      </Card>

      <h1>Histórico de Atribuição de Créditos</h1>

      <Card withBorder shadow="md" p={30} mt={10} radius="md" style={{ flex: 1 }}>
        <Box maw={600}>
          <TextInput
            radius="xl"
            size="md"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Pesquisar por nome, email ou telemóvel"
            rightSectionWidth={42}
            leftSection={<IconSearch style={{ width: "18px", height: "18px" }} stroke={1.5} />}
            mb={"lg"}
          />
        </Box>
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
            <Text>linhas</Text>
          </Flex>
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Telemóvel</Table.Th>
                <Table.Th>Créditos Antes</Table.Th>
                <Table.Th>Créditos Depois</Table.Th>
                <Table.Th>Atribuido Por</Table.Th>
                <Table.Th>Data de Atribuição</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{voucherRows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {vouchers.length > 0 && (
          <Flex justify={"space-between"} mt={"lg"}>
            <Text>
              A mostrar {initialIndex + 1} a {Math.min(finalIndex, totalVouchers)} de {totalVouchers} linhas
            </Text>
            <Pagination total={Math.ceil(totalVouchers / elementsPerPage)} onChange={handleVoucherPageChange} />
          </Flex>
        )}
      </Card>
    </>
  );
}

export default VideoCredits;
