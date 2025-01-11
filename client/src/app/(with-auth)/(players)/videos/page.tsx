"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import { IconGitBranch, IconGitPullRequest, IconGitCommit, IconMessageDots, IconEye, IconNumber1, IconNumber2, IconNumber3, IconNumber4, IconClock } from "@tabler/icons-react";
import { Timeline, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, Tooltip, ActionIcon, rem, Group, Button, Modal, Title, Badge, Mark, Loader, Paper } from "@mantine/core";
import { addVideoProcessed, getCreditsVideoPage, getVideosProcessed } from "@/services/video.service";
import { DateInput, TimeInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import dayjs from "dayjs";
import { routes } from "@/config/routes";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { notifications } from "@mantine/notifications";
import { useForm, zodResolver } from "@mantine/form";
import { useDisclosure, useMediaQuery } from '@mantine/hooks';

function getBadge(status: string | null) {
  if (status === "waiting") {
    return { name: "Em Avaliação", color: "blue" };
  }
  
  if (status === "processing") {
    return { name: "Em Processamento", color: "blue" };
  }

  if (status === "completed") {
    return { name: "Pronto", color: "green" };
  }

  if (status === "failed") {
    return { name: "Falha", color: "red" };
  }

  if (status === "rejected") {
    return { name: "Rejeitado", color: "red" };
  }
  
  if (status === "error") {
    return { name: "Erro", color: "red" };
  }
}

// Função para obter a data mínima permitida (14 dias atrás)
const getMinDate = () => dayjs().subtract(14, "day").toDate();

// Função para obter a data máxima permitida (hoje)
const getMaxDate = () => dayjs().endOf("day").toDate();

interface Elemento {
  created_at: string;
  email: string;
  error_message: string | null;
  first_name: string;
  id: number;
  last_name: string;
  campo: string;
  phone: string;
  status: string;
  updated_at: string;
  user_id: number;
  start_time: string;
  end_time: string;
  date: string;
}

const schema = z
  .object({
    date: z
      .date({
        required_error: "A data é obrigatória",
      })
      .refine((date) => date <= new Date(), "A data deve ser no passado ou presente"),
    timeInicio: z.string().nonempty({ message: "Hora de Início é obrigatória" }),
    timeFim: z.string().nonempty({ message: "Hora de Fim é obrigatória" }),
    campo: z.string().nonempty({ message: "Campo é obrigatório" }),
  })
  // Verifica se a data e hora de fim não são maiores que o momento atual
  .refine(
    (data) => {
      const currentTime = new Date();
      const [hoursFim, minutesFim] = data.timeFim.split(":").map(Number);
      const combinedDate = new Date(data.date);
      combinedDate.setHours(hoursFim, minutesFim);

      return combinedDate <= currentTime;
    },
    {
      message: "A data e hora final devem ser menores ou iguais ao momento atual",
      path: ["manual"],
    }
  )
  // Verifica se o timeFim é maior que o timeInicio
  .refine(
    (data) => {
      const [hoursInicio, minutesInicio] = data.timeInicio.split(":").map(Number);
      const [hoursFim, minutesFim] = data.timeFim.split(":").map(Number);

      const inicioDate = new Date(data.date);
      inicioDate.setHours(hoursInicio, minutesInicio);

      const fimDate = new Date(data.date);
      fimDate.setHours(hoursFim, minutesFim);

      // Verificar se Hora de Fim é maior que Hora de Início
      return fimDate > inicioDate;
    },
    {
      message: "A Hora de Fim deve ser maior que a Hora de Início",
      path: ["timeFim"], 
    }
  )
  // Verifica se a diferença entre timeInicio e timeFim é de pelo menos 30 minutos
  .refine(
    (data) => {
      const [hoursInicio, minutesInicio] = data.timeInicio.split(":").map(Number);
      const [hoursFim, minutesFim] = data.timeFim.split(":").map(Number);

      const inicioDate = new Date(data.date);
      inicioDate.setHours(hoursInicio, minutesInicio);

      const fimDate = new Date(data.date);
      fimDate.setHours(hoursFim, minutesFim);

      // Diferença de tempo em milissegundos
      const diffInMs: number = Number(fimDate) - Number(inicioDate);

      // 30 minutos em milissegundos
      const minDiffInMs = 30 * 60 * 1000;

      return diffInMs >= minDiffInMs;
    },
    {
      message: "A diferença entre Hora de Início e Hora de Fim deve ser positiva e de pelo menos 30 minutos",
      path: ["manual"],
    }
  )
  // Verifica se a diferença entre timeInicio e timeFim não é superior a 90m
  .refine(
    (data) => {
      const [hoursInicio, minutesInicio] = data.timeInicio.split(":").map(Number);
      const [hoursFim, minutesFim] = data.timeFim.split(":").map(Number);

      const inicioDate = new Date(data.date);
      inicioDate.setHours(hoursInicio, minutesInicio);

      const fimDate = new Date(data.date);
      fimDate.setHours(hoursFim, minutesFim);

      // Diferença de tempo em milissegundos
      const diffInMs: number = Number(fimDate) - Number(inicioDate);

      // 90m em milissegundos
      const maxDiffInMs = 1 * 90 * 60 * 1000;

      return diffInMs <= maxDiffInMs;
    },
    {
      message: "A diferença entre Hora de Início e Hora de Fim não pode ser superior a 90 minutos",
      path: ["manual"],
    }
  );

function ReviewVideos() {
  const { user } = useSession();
  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [creditos, setCreditos] = useState<number>(0);
  const [campos, setCampos] = useState<{ id: number; label: string; value: string }[]>([]);
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(10);
  const refInicio = useRef<HTMLInputElement>(null);
  const refFim = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const [resetKey, setResetKey] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const form = useForm({
    initialValues: {
      date: undefined,
      timeInicio: "",
      timeFim: "",
      campo: "",
    },
    validate: zodResolver(schema),
  });

  const onSubmitHandler = useCallback(async (data: any) => {
    setIsSubmiting(true);
    

    const payload = {
      ...data,
      date: dayjs(data.date).format("YYYY-MM-DD"),
      campo: campos.find(c => c.label === data.campo)?.value
    };

 
    try {
      const response = await addVideoProcessed(payload);
       if (response.status) {
         notifications.show({
           title: "Sucesso",
           message: "",
           color: "green",
         });
         fetchDataConcurrently();

         form.reset();
         setResetKey((prev) => prev + 1); // Força o Select a re-renderizar

         //OPEN MODAL
         open();

         //Fechar a modal automaticamente após 20 segundos
         setTimeout(() => {
           close();
         }, 20000); 

       } else {
        notifications.show({
          title: "Erro",
          message: response.message,
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Algo correu mal",
        color: "red",
      });
    } finally {
      setIsSubmiting(false);
    } 
  }, [campos]);

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = Math.min(initialIndex + elementsPerPage, totalElements);
  
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

  const fetchData = async () => {
    try {
      const pagination = {
        page: activePage,
        limit: 10,
        orderBy: "vp.id",
        order: "ASC",
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

  const fetchDataConcurrently = async () => {
    const [paramsData, fetchDataResponse] = await Promise.all([fetchParams(), fetchData()]);

    if (paramsData) {
      setCreditos(paramsData.data.credits);
      const camposFormatados = paramsData.data.campos.map((campo: any) => ({
        id: campo.id,
        label: campo.name,
        value: campo.value,
      }));
      setCampos(camposFormatados);
    }

    if (fetchDataResponse) {
      setElementos(fetchDataResponse.data);
      setTotalElements(fetchDataResponse.pagination.total || 0);
      setActivePage(fetchDataResponse.pagination.page || 1);
    }

    setLoading(false);
    setFirstLoad(false);
  };

  useEffect(() => {
    fetchDataConcurrently();

    // Configura um intervalo de 30 segundos
    const interval = setInterval(() => {
      fetchDataConcurrently();
    }, 30000); // 30 segundos em milissegundos

    return () => clearInterval(interval);
  }, []);

  /* const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage; */
  const pickerControl1 = (
    <ActionIcon disabled={!creditos} variant="subtle" color="gray" onClick={() => refInicio.current?.showPicker()}>
      <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
    </ActionIcon>
  );

  const pickerControl2 = (
    <ActionIcon disabled={!creditos} variant="subtle" color="gray" onClick={() => refFim.current?.showPicker()}>
      <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
    </ActionIcon>
  );

  const handleCampoChange = (value: string | null) => {
    const campo = campos.find((option) => option.label === value)?.value;
    if (campo) {
      form.setFieldValue("campo", campo);
    }
  };

  const rows = elementos?.slice(initialIndex, finalIndex).map((element, index) => (
    <Table.Tr key={element.id}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{campos.find((c) => c.value === element.campo)?.label}</Table.Td>
      <Table.Td>{dayjs(element.date).format("YYYY-MM-DD")}</Table.Td>
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
          {element.status === 'completed' ? (
            <Tooltip label={"Consultar vídeo"} withArrow position="top">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => {
                  router.push(`${routes.stream.url}/${element.id}`);
                }}
              >
                <IconEye style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          ) : "-"}
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

            <Text size="sm" mt={4} ml={4}>
              1 crédito = 2€
            </Text>
            <Text size="sm" mt={4} ml={4}>
              7 créditos = 10€
            </Text>
          </Timeline.Item>
          <Timeline.Item bullet={<IconNumber2 size={16} />} title="Selecione o horário do jogo">
            <Text c="dimmed" size="sm">
              Escolha o campo e o horário em que a sua partida ocorreu.
            </Text>
          </Timeline.Item>

          <Timeline.Item title="Processamento" bullet={<IconNumber3 size={16} />}>
            <Text c="dimmed" size="sm">
              O vídeo será avaliado e, caso seja aprovado, será processado.
            </Text>
          </Timeline.Item>

          <Timeline.Item title="Corte e guarde o vídeo" bullet={<IconNumber4 size={16} />}>
            <Text c="dimmed" size="sm">
              <Text variant="link" component="span" inherit>
                Corte o vídeo final e guarde os seus melhores momentos!
              </Text>
            </Text>
          </Timeline.Item>
        </Timeline>
      </>

      <>
        <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
          <Paper shadow="xs" p="sm" withBorder mt="lg" mb="lg">
            <Text fw={600}>Requisitar vídeo</Text>
            <Text size="sm" c={creditos ? "dimmed" : "red"} fw={creditos ? 500 : 600}>
              Para requisitar um vídeo, é necessário ter créditos disponíveis. Por favor, obtenha-os na recepção.
            </Text>

            <Flex align="center" justify="center" mb="md" mt="md" direction={{ base: "column", sm: "row" }}>
              <DateInput
                key={form.values.date}
                minDate={getMinDate()}
                maxDate={getMaxDate()}
                disabled={!creditos}
                valueFormat="DD-MM-YYYY"
                label="Selecione uma data"
                placeholder="DD-MM-YYYY"
                mr={{ sm: "lg" }}
                mb={{ base: "sm", sm: 0 }}
                withAsterisk
                w={{ base: "100%", sm: "auto" }}
                {...form.getInputProps("date")}
              />

              <TimeInput
                label="Hora de Ínicio"
                mr={{ sm: "lg" }}
                mb={{ base: "sm", sm: 0 }}
                disabled={!creditos}
                withAsterisk
                w={{ base: "100%", sm: "auto" }}
                ref={refInicio}
                rightSection={pickerControl1}
                {...form.getInputProps("timeInicio")}
              />

              <TimeInput
                label="Hora de Fim"
                mr={{ sm: "lg" }}
                mb={{ base: "sm", sm: 0 }}
                disabled={!creditos}
                withAsterisk
                w={{ base: "100%", sm: "auto" }}
                ref={refFim}
                rightSection={pickerControl2}
                {...form.getInputProps("timeFim")}
              />

              <Select
                label="Selecione o campo"
                placeholder="Campo"
                key={resetKey}
                data={campos?.length > 0 ? campos.map((option) => option.label) : undefined}
                //onChange={handleCampoChange}
                disabled={!creditos}
                withAsterisk
                w={{ base: "100%", sm: "auto" }}
                {...form.getInputProps("campo")}
              />
            </Flex>
            {/* Exibir erros globais abaixo dos inputs */}
            {form.errors && (
              <Center>
                <Text color="red" mt="sm" size="sm" style={{ position: "relative", top: "-10px" }}>
                  {form.errors.manual}
                </Text>
              </Center>
            )}
            <Center>
              <Button variant="light" size="sm" disabled={!creditos} type="submit">
                Requisitar
              </Button>
            </Center>

            <Modal opened={opened} onClose={close} size="auto" title="Aviso" centered>
              Obrigado pela requisição.
              <br />
              Este terá de ser aprovado pela gerência, ficando posteriormente disponível.
              <br />
              Este processo poderá demorar até 60 minutos após validação.
              <Center>
                <Button mt={"md"} variant="light" size="sm" onClick={close}>
                  Compreendido
                </Button>
              </Center>
            </Modal>
          </Paper>
        </form>
      </>

      {elementos.length > 0 && (
        <>
          <Paper shadow="xs" p="sm" withBorder>
            <Text mt={"md"} fw={600}>
              Os seus vídeos
            </Text>
            <Text mt="md" size="sm" c="dimmed">
              <Mark color="red" p={2} mr={4} c={"white"}>
                Atenção:
              </Mark>
              Não se esqueça de descarregar os seus vídeos. Estes serão eliminados após 48 horas.
            </Text>
            <Table.ScrollContainer minWidth={500} mt={"lg"}>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Campo</Table.Th>
                    <Table.Th>Data</Table.Th>
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

            {!isMobile && (
              <Flex justify={"space-between"} mt={"lg"}>
                <Text>
                  A mostrar {initialIndex + 1} a {finalIndex} de {totalElements} elementos
                </Text>
                <MantinePagination total={Math.ceil(totalElements / elementsPerPage)} onChange={handlePageChange} />
              </Flex>
            )}
            
            {isMobile && (
              <Flex direction="column" align="center" mt={"lg"}>
                <Text>
                  A mostrar {initialIndex + 1} a {finalIndex} de {totalElements} elementos
                </Text>
                <MantinePagination total={Math.ceil(totalElements / elementsPerPage)} onChange={handlePageChange} mt={"md"} />
              </Flex>
            )}
          </Paper>
        </>
      )}
    </div>
  );
}

export default ReviewVideos;
