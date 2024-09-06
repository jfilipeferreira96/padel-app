"use client";
import React, { useState, useRef, useEffect } from "react";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import { IconGitBranch, IconGitPullRequest, IconGitCommit, IconMessageDots, IconEye, IconNumber1, IconNumber2, IconNumber3, IconNumber4, IconClock } from "@tabler/icons-react";
import {
  Timeline,
  Table,
  Checkbox,
  Pagination as MantinePagination,
  Center,
  Text,
  Select,
  Flex,
  Tooltip,
  ActionIcon,
  rem,
  Group,
  Button,
  Modal,
  Title,
  Badge,
  Mark,
  Loader,
  Paper,
} from "@mantine/core";
import { getCreditsVideoPage, getVideosProcessed } from "@/services/video.service";
import { DateInput, TimeInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import dayjs from "dayjs"; 
import { routes } from "@/config/routes";
import { useRouter } from "next/navigation";

function getBadge(status: string | null) {
  if (status === "processing") {
    return { name: "Em Processamento", color: "blue" };
  }

  if (status === "completed") {
    return { name: "Pronto", color: "green" };
  }

  if (status === "failed") {
    return { name: "Falha", color: "red" };
  }

  if (status === "error") {
    return { name: "Erro", color: "red" };
  }
}

// Função para obter a data mínima permitida (14 dias atrás)
const getMinDate = () => dayjs().subtract(14, 'day').toDate();

// Função para obter a data máxima permitida (hoje)
const getMaxDate = () => dayjs().endOf('day').toDate();

interface Elemento {
  created_at: string;
  email: string;
  error_message: string | null;
  first_name: string;
  id: number;
  last_name: string;
  location: string;
  phone: string;
  status: string;
  updated_at: string;
  user_id: number;
  start_time: string;
  end_time: string;
}

function ReviewVideos() {
  const { user } = useSession();
  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [creditos, setCreditos] = useState<number>(0);
  const [campos, setCampos] = useState<{ id: number; name: string }[]>();
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(15);
  const refInicio = useRef<HTMLInputElement>(null);
  const refFim = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [horaInicio, setHoraInicio] = useState(null);
  const [horaFim, setHoraFim] = useState(null);
  const [error, setError] = useState("");
  const router  = useRouter();

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleElementsPerPageChange = (value: string | null) => {
    if (value) {
      setElementsPerPage(parseInt(value));
      setActivePage(1);
    }
  };

  const fetchParams = async () => {
    try {
      const response = await getCreditsVideoPage();
      if (response) {
        return response;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Erro ao fazer o fetch dos parâmetros:", error);
      return null;
    }
  };

  const handleHoraInicioChange = (value: React.SetStateAction<null>) => {
      console.log(value)
      setHoraInicio(value);
    };

    const handleHoraFimChange = (value: React.SetStateAction<null>) => {
      setHoraFim(value);
    };

  const fetchData = async () => {
    try {
      const pagination = {
        page: activePage,
        limit: 10,
        orderBy: "vp.id",
        order: "DESC",
      };

      const response = await getVideosProcessed(pagination, user?.id);

      if (response) {
        return response;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Erro ao fazer o fetch dos dados:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchDataConcurrently = async () => {
      setLoading(true);

      const [paramsData, fetchDataResponse] = await Promise.all([fetchParams(), fetchData()]);

      if (paramsData) {
        setCreditos(paramsData.data.credits);
        setCampos(paramsData.data.campos);
      }

      if (fetchDataResponse) {
        setElementos(fetchDataResponse.data);
        setTotalElements(fetchDataResponse.pagination.total || 0);
        setActivePage(fetchDataResponse.pagination.page || 1);
      }

      setLoading(false);
    };

    fetchDataConcurrently();
  }, []);

  /* const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage; */
  const pickerControl1 = (
    <ActionIcon variant="subtle" color="gray" onClick={() => refInicio.current?.showPicker()}>
      <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
    </ActionIcon>
  );

   const pickerControl2 = (
     <ActionIcon variant="subtle" color="gray" onClick={() => refFim.current?.showPicker()}>
       <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
     </ActionIcon>
   );
  
  const rows = elementos?.map((element, index) => (
    <Table.Tr key={element.id}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{element.location}</Table.Td>
      <Table.Td>{element.start_time.slice(0, -3)}</Table.Td>
      <Table.Td>{element.end_time.slice(0, -3)}</Table.Td>
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
              color="gray"
              onClick={() => {
                router.push(`${routes.stream.url}/${element.id}`)
              }}
            >
              <IconEye style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  if (!user || loading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <div>
      <Group justify="space-between" align="center" mt={15}>
        <Title className="productheader">Rever Jogos</Title>
        <Badge size="lg">{`${creditos ?? 0} créditos disponiveis`}</Badge>
      </Group>

      <>
        <Text mt={"md"} fw={600}>
          Como funciona?
        </Text>
        <Timeline active={3} bulletSize={24} lineWidth={2} mt={"lg"} mb={"lg"}>
          <Timeline.Item bullet={<IconNumber1 size={16} />} title="Adquira Créditos">
            <Text c="dimmed" size="sm">
              Dirija-se à recepção para adquirir créditos.
            </Text>
          </Timeline.Item>

          <Timeline.Item bullet={<IconNumber2 size={16} />} title="Selecione o horário do jogo">
            <Text c="dimmed" size="sm">
              Escolha o campo e o horário em que a sua partida ocorreu.
            </Text>
          </Timeline.Item>

          <Timeline.Item title="Processamento" bullet={<IconNumber3 size={16} />}>
            <Text c="dimmed" size="sm">
              O vídeo será processado e estará disponível em breve.
            </Text>
          </Timeline.Item>

          <Timeline.Item title="Edite e guarde o vídeo" bullet={<IconNumber4 size={16} />}>
            <Text c="dimmed" size="sm">
              <Text variant="link" component="span" inherit>
                Edite o vídeo final e guarde os seus melhores momentos!
              </Text>
            </Text>
          </Timeline.Item>
        </Timeline>
      </>

      <>
        <Paper shadow="xs" p="sm" withBorder mt="lg">
          <Text fw={600}>Requisitar vídeo</Text>
          <Text size="sm" c="dimmed">
            Para requisitar um vídeo, é necessário ter créditos disponíveis. Por favor, obtenha-os na recepção.
          </Text>
          <Flex align="center" justify="center" mb="md" mt="md" direction={{ base: "column", sm: "row" }} className={classes.flex}>
            <DateInput
              minDate={getMinDate()}
              maxDate={getMaxDate()}
              valueFormat="DD-MM-YYYY"
              value={date}
              withAsterisk
              onChange={setDate}
              label="Selecione uma data"
              placeholder="DD-MM-YYYY"
              mr={{ sm: "lg" }}
              mb={{ base: "sm", sm: 0 }}
            />
            <TimeInput onChange={(e) => console.log(e.target.value)} withAsterisk label="Hora de Ínicio" ref={refInicio} mr={{ sm: "lg" }} mb={{ base: "sm", sm: 0 }} disabled={!creditos} rightSection={pickerControl1} />
            <TimeInput withAsterisk label="Hora de Fim" ref={refFim} mr={{ sm: "lg" }} mb={{ base: "sm", sm: 0 }} disabled={!creditos} onChange={(e) => console.log(e.target.value)} rightSection={pickerControl2} />
            <Select withAsterisk label="Selecione o campo" placeholder="Campo" data={["Ver por validar", "Ver validados"]} value="Ver por validar" onChange={(value) => console.log(value)} disabled={!creditos} />
            
          </Flex>

          <Center>
            <Button variant="light" size="sm" disabled={!creditos}>
              Requisitar
            </Button>
          </Center>
        </Paper>
      </>

      {elementos.length > 0 && (
        <>
          <>
            <Table.ScrollContainer minWidth={500} mt={"lg"}>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Campo</Table.Th>
                    <Table.Th>Ínicio</Table.Th>
                    <Table.Th>Fim</Table.Th>
                    <Table.Th>Data de Requisição</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {/* {elementos.length > 0 && (
              <Flex justify={"space-between"} mt={"lg"}>
                <Text>
                  A mostrar {initialIndex + 1} a {Math.min(finalIndex, totalElements)} de {totalElements} elementos
                </Text>
                <MantinePagination total={Math.ceil(totalElements / elementsPerPage)} onChange={handlePageChange} />
              </Flex>
            )} */}
          </>
          <Text mt="md" size="sm" c="dimmed">
            <Mark color="red" p={2} mr={4} c={"white"}>
              Atenção:
            </Mark>
            Não se esqueça de descarregar os seus vídeos. Estes serão eliminados após 48 horas.
          </Text>
        </>
      )}
    </div>
  );
}

export default ReviewVideos;
