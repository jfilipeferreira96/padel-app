"use client";
import React, { useState, useRef, useEffect } from "react";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import { IconGitBranch, IconGitPullRequest, IconGitCommit, IconMessageDots, IconEye } from '@tabler/icons-react';
import { Timeline, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, SimpleGrid, Skeleton, Grid, Tooltip, ActionIcon, rem, Group, Button, Modal, Title, Badge, Mark } from "@mantine/core";
import { getVideosProcessed } from "@/services/video.service";

function getBadge(status: string | null)
{
  if (status === "processing")
  {
    return { name: "Em Processamento", color: "blue" };
  }

  if (status === "completed")
  {
    return { name: "Pronto", color: "green" };
  }

  if (status === "failed")
  {
    return { name: "Falha", color: "red" };
  }

  if (status === "error")
  {
    return { name: "Erro", color: "red" };
  }

}

const data = [
  {
    title: 'Page views',
    stats: '456,133',
    description: '24% more than in the same month last year, 33% more that two years ago',
  },
  {
    title: 'New users',
    stats: '2,175',
    description: '13% less compared to last month, new user engagement up by 6%',
  },
  {
    title: 'Completed orders',
    stats: '1,994',
    description: '1994 orders were completed this month, 97% satisfaction rate',
  },
];

function ReviewVideos() {
  const { user } = useSession();
  const [elementos, setElementos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(15);

  const fetchData = async () => {
    setLoading(true);
    try
    {
      const pagination = {
        page: activePage,
        limit: elementsPerPage,
        orderBy: "o.order_id",
        order: "DESC",
      };

      const response = await getVideosProcessed(pagination);
      if (response){
        setElementos(response.data);
        setTotalElements(response.pagination.total || 0);
        setActivePage(response.pagination.page || 1);
      }

      setLoading(false);
    }
    catch (error)
    {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleElementsPerPageChange = (value: string | null) => {
    if (value)
    {
      setElementsPerPage(parseInt(value));
      setActivePage(1);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = data.map((stat) => (
    <div key={stat.title} className={classes.stat}>
      <Text className={classes.count}>{stat.stats}</Text>
      <Text className={classes.title}>{stat.title}</Text>
      <Text className={classes.description}>{stat.description}</Text>
    </div>
  ));

  const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage;

  const rows = elementos?.map((element, index) => (
    <Table.Tr key={element.id}>
      <Table.Td>
        {index + 1}
      </Table.Td>
      <Table.Td>{new Date(element.created_at).toLocaleString()}</Table.Td>
      <Table.Td>
        <Badge variant="filled" size="md" fw={700} color={getBadge(element.status)?.color} style={{ minWidth: "110px" }}>
          {getBadge(element.status)?.name}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap={0} justify="center">
          <Tooltip label={"Consultar vídeo"} withArrow position="top">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => {
                /* ABRIR NOVA PAGINA */
              }}
            >
              <IconEye style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div>
      <Title mt={15} className="productheader">
        Rever Jogos
      </Title>
      <Group justify="space-between">
        <Title mt={15} className="productheader">
          Rever Jogos
        </Title>
        <Badge>{`${user.video_credits ?? 0} créditos disponiveis`}</Badge>
      </Group>
      <>
        <div className={classes.root}>{stats}</div>
      </>
      <>
        Como funciona?
        <Timeline active={1} bulletSize={24} lineWidth={2}>
          <Timeline.Item bullet={<IconGitBranch size={12} />} title="Carregue créditos">
            <Text c="dimmed" size="sm">Carregue créditos na recepção<Text variant="link" component="span" inherit>fix-notifications</Text> from master</Text>
          </Timeline.Item>

          <Timeline.Item bullet={<IconGitCommit size={12} />} title="Escolha o horário">
            <Text c="dimmed" size="sm">Selecione a data e hora em que jogou<Text variant="link" component="span" inherit>fix-notifications branch</Text></Text>
          </Timeline.Item>

          <Timeline.Item title="Processamento do vídeo" bullet={<IconGitPullRequest size={12} />} lineVariant="dashed">
            <Text c="dimmed" size="sm">Espere pelo processemaento do vídeo<Text variant="link" component="span" inherit>Fix incorrect notification message (#187)</Text></Text>
      
          </Timeline.Item>

          <Timeline.Item title="Guarda a tua jogada!" bullet={<IconMessageDots size={12} />}>
            <Text c="dimmed" size="sm"><Text variant="link" component="span" inherit>Edita o vídeo final</Text> e guarde a sua jogada!</Text>
        
          </Timeline.Item>
        </Timeline>
        `
      </>

      {!user.video_credits ? (
        <>
          Não pode pedir porque não tem acesso a esta funcionalidade devido à créditos. Por favor, fale com alguém na recepção.
        </>
      ) : (
        <>
            <>Input data e hora; + botão submit</>
            <>
              Tabela

              <Table.ScrollContainer minWidth={500}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Data de Requisição</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Ações</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  {/* <Table.Tbody>{rows}</Table.Tbody> */}
                </Table>
              </Table.ScrollContainer>
              {elementos.length > 0 && (
                <Flex justify={"space-between"} mt={"lg"}>
                  <Text>
                    A mostrar {initialIndex + 1} a {Math.min(finalIndex, totalElements)} de {totalElements} elementos
                  </Text>
                  <MantinePagination total={Math.ceil(totalElements / elementsPerPage)} onChange={handlePageChange} />
                </Flex>
              )}
            </>
            <Text>
              <Mark>Aviso:</Mark> Descarregue os vídeos e clipes cortados para os seus devices. Após 48h estes serão eliminados. 
            </Text>
        </>
        )
      }
    </div>
  );
}

export default ReviewVideos;
