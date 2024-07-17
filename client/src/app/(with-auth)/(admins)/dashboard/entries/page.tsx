"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, Badge, SimpleGrid, Skeleton, Grid, Group, Tooltip, ActionIcon, rem, Button } from "@mantine/core";
import { getDashboardEntries } from "@/services/dashboard.service";
import { IconCheck, IconRefresh, IconX } from "@tabler/icons-react";
import { removeEntry, validateEntry, ValidateProps } from "@/services/acessos.service";
import { notifications } from "@mantine/notifications";
import { useLocation } from "@/providers/LocationProvider";
import { usePathname } from "next/navigation";
import QrReader from "@/components/qrcode-reader";

function getBadge(validated_by: number | null){
  if (!validated_by)
  {
    return { name: "Por validar", color: "red" };
  } else
  {
    return { name: "Validado", color: "green" };
  }
}

interface Elemento {
  entry_id: number;
  user_id: number;
  location_id: number;
  location_name: string;
  entry_time: string;
  validated_by: number | null;
  validated_at: string | null;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
}

function Dashboard() {
  const pathname = usePathname();
  const [selectedRows, setSelectedRows] = useState<Elemento[]>([]);
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(() => {
    const storedValue = localStorage.getItem(pathname);
    return storedValue ? parseInt(storedValue) : 10;
  });
  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const { location } = useLocation();

  const fetchData = async () => {
    setLoading(true);
    if (!location || !location.value) return
    try{
      const pagination = {
        page: activePage,
        limit: elementsPerPage,
        orderBy: 'e.entry_time',
        order: 'DESC'
      }

      const response = await getDashboardEntries(pagination, location.value);
      
      if (response){
        setElementos(response.data);
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

  
  const onValidate = async (data: ValidateProps) => {

    try {
        const response = await validateEntry(data);

        if (response.status) {
          notifications.show({
            title: "Sucesso",
            message: "",
            color: "green"
          });
         
        }
        if (response.status === false) {
          notifications.show({
            message: response.message,
            color: "red",
          });
      }
      
        setSelectedRows([]);
        fetchData();
      } catch (error) {
        notifications.show({
          title: "Erro",
          message: "Algo correu mal",
          color: "red",
        });
      }
  };
  
   const onRemoveEntry = async (entryId: number) => {
     try {
       const response = await removeEntry(entryId);

       if (response.status) {
         notifications.show({
           title: "Sucesso",
           message: "",
           color: "green",
         });
       }
       if (response.status === false) {
         notifications.show({
           message: response.message,
           color: "red",
         });
       }

       setSelectedRows([]);
       fetchData();
     } catch (error) {
       notifications.show({
         title: "Erro",
         message: "Algo correu mal",
         color: "red",
       });
     }
   };

  useEffect(() => {
    fetchData();
  }, [activePage, elementsPerPage, location]);

  useEffect(() => {
    const fetchDataInterval = setInterval(() => {
      fetchData();
    }, 60000); // 60000 ms = 1 minuto

    // Limpar o intervalo quando o componente for desmontado ou sempre que o `activePage` ou `elementsPerPage` mudar
    return () => clearInterval(fetchDataInterval);
  }, [activePage, elementsPerPage]);

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleElementsPerPageChange = (value: string | null) => {
    
    if (value)
    {
      setElementsPerPage(parseInt(value));
      setActivePage(1); // Reset to first page whenever elements per page change
      localStorage.setItem(pathname, value);
    }
  };
 
  const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage;

  const rows = elementos?.map((element) => (
    <Table.Tr key={element.entry_id} bg={selectedRows.some((row) => row.entry_id === element.entry_id) ? "var(--mantine-color-blue-light)" : undefined}>
      <Table.Td>
        <Checkbox
          aria-label="Selecionar linha"
          checked={selectedRows.some((row) => row.entry_id === element.entry_id)}
          onChange={(event) => {
            const isChecked = event.currentTarget.checked;
            setSelectedRows((prevSelectedRows) => {
              if (isChecked) {
                return [...prevSelectedRows, element];
              } else {
                return prevSelectedRows.filter((row) => row.entry_id !== element.entry_id);
              }
            });
          }}
          disabled={element.validated_by ? true : false}
        />
      </Table.Td>
      <Table.Td>
        <Badge variant="filled" size="md" fw={700} color={getBadge(element.validated_by).color} style={{ minWidth: "110px" }}>
          {getBadge(element.validated_by).name}
        </Badge>
      </Table.Td>
      <Table.Td>
        {element.user_first_name} {element.user_last_name}
      </Table.Td>
      <Table.Td>{element.user_email}</Table.Td>
      <Table.Td>{element.location_name}</Table.Td>
      <Table.Td>{element.validated_at ? `${element.admin_first_name} ${element.admin_last_name}` : "-"}</Table.Td>
      <Table.Td>{new Date(element.entry_time).toLocaleString()}</Table.Td>
      <Table.Td>
        <Group gap={0} justify="center">
          {element.validated_at ? (
            <>-</>
          ) : (
            <>
              <Tooltip label={"Validar entrada"} withArrow position="top">
                <ActionIcon variant="subtle" color="green" onClick={() => onValidate({ entryIds: [element.entry_id] })}>
                  <IconCheck style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={"Remover entrada"} withArrow position="top">
                <ActionIcon variant="subtle" color="red" onClick={() => onRemoveEntry(element.entry_id)}>
                  <IconX style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <h1>Registo de Entradas</h1>

      <Grid>
        <Grid.Col span={{ base: 0, sm: 0, md: 3, lg: 3 }}></Grid.Col>
        <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6 }}>
          <QrReader biggerInputLength refreshTable={fetchData} />
        </Grid.Col>
      </Grid>

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
          <Group gap={8}>

            <Tooltip label={"Atualizar Tabela"} withArrow position="top">
              <ActionIcon variant="subtle" color="green" onClick={() => fetchData()} size="lg">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>

            <Button
              variant="light"
              color="green"
              rightSection={<IconCheck size={18} />}
              disabled={selectedRows.length === 0}
              onClick={() => {
                onValidate({ entryIds: selectedRows.map((row) => row.entry_id) });
              }}
            >
              Validar entrada
            </Button>
            
          </Group>
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                <Table.Th>Estado</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Local</Table.Th>
                <Table.Th>Validador</Table.Th>
                <Table.Th>Data</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
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
      </Card>
    </>
  );
}

export default Dashboard;
