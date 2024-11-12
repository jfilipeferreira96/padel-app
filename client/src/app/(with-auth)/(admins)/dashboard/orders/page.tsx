"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, Badge, SimpleGrid, Skeleton, Grid, Group, Tooltip, ActionIcon, rem, Modal, Button } from "@mantine/core";
import { getDashboardEntries } from "@/services/dashboard.service";
import { getAllOrders, OrderStatus } from "@/services/orders.service";
import { IconCheck, IconEye } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { usePathname } from "next/navigation";

function getBadge(status: string | null) {
  if (status === "pending") {
    return { name: "Pendente", color: "blue" };
  }

  if (status === "completed") {
    return { name: "Concluída", color: "green" };
  }

  if (status === "cancelled") {
    return { name: "Cancelada", color: "red" };
  }

  if (status === "shipped") {
    return { name: "Enviada", color: "yellow" };
  }
}

interface Order {
  order_id: number;
  user_id: number;
  total_price: number;
  status: string;
  created_at: string;
  user_email: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  products: Array<{
    product_id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
}

function Orders() {
  const pathname = usePathname();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(() => {
    const storedValue = localStorage.getItem(pathname);
    return storedValue ? parseInt(storedValue) : 10;
  });
  const [elementos, setElementos] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [opened, { open, close }] = useDisclosure(false);
  const [clickedOrder, setClickedOrder] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pagination = {
        page: activePage,
        limit: elementsPerPage,
        orderBy: "o.order_id",
        order: "DESC",
      };

      const response = await getAllOrders(pagination);
      if (response) {
        setElementos(response.data);
        setTotalElements(response.pagination.total || 0);
        setActivePage(response.pagination.page || 1);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activePage, elementsPerPage]);

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleElementsPerPageChange = (value: string | null) => {
    if (value) {
      setElementsPerPage(parseInt(value));
      setActivePage(1); // Reset to first page whenever elements per page change
      localStorage.setItem(pathname, value);
    }
  };

    const handleClick = (orderId: number) => {
      setClickedOrder(orderId);
      open();
    };

  
  const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage;

  const rows = elementos?.map((element) => (
    <Table.Tr key={element.order_id}>
      <Table.Td>
        <Badge variant="filled" size="md" fw={700} color={getBadge(element.status)?.color} style={{ minWidth: "110px" }}>
          {getBadge(element.status)?.name}
        </Badge>
      </Table.Td>
      <Table.Td>
        {element.first_name} {element.last_name}
      </Table.Td>
      <Table.Td>{element.user_email}</Table.Td>
      <Table.Td>{element.total_price} €</Table.Td>
      <Table.Td>{element.products.length}</Table.Td>
      <Table.Td>{new Date(element.created_at).toLocaleString()}</Table.Td>
      <Table.Td>
        <Group gap={0} justify="center">
          <Tooltip label={"Ver encomenda"} withArrow position="top">
            <ActionIcon variant="filled" className="action-icon-size" onClick={() => handleClick(element.order_id)}>
              <IconEye style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <h1>Vendas</h1>

      {/*  <Grid>
        <Grid.Col span={6}>
          <Card withBorder shadow="md" p={30} mt={10} radius="md" style={{ flex: 1 }}>
            
          </Card>
        </Grid.Col>
        <Grid.Col span={6}>
          <Card withBorder shadow="md" p={30} mt={10} radius="md" style={{ flex: 1 }}>
         
          </Card>
        </Grid.Col>
      </Grid> */}

      <Modal opened={opened} onClose={close} title={`Encomenda Nº ${clickedOrder}`} size="lg">
        <>
          {clickedOrder && elementos.find((elem) => elem.order_id === clickedOrder)?.products?.length ? (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Descrição</Table.Th>
                  <Table.Th>Preço</Table.Th>
                  <Table.Th>Quantidade</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {elementos
                  .find((elem) => elem.order_id === clickedOrder)
                  ?.products?.map((product) => (
                    <Table.Tr key={product.product_id}>
                      <Table.Td>{product.name}</Table.Td>
                      <Table.Td>{product.description}</Table.Td>
                      <Table.Td>{product.price} €</Table.Td>
                      <Table.Td>{product.quantity}</Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text>Não há produtos disponíveis para esta encomenda.</Text>
          )}

          <Select
            mt={20}
            className="specialinput"
            label="Altere o estado da encomenda"
            placeholder="Selecione um estado"
            allowDeselect={false}
            data={OrderStatus.map((status) => status.label)}
            defaultValue={(clickedOrder && OrderStatus.find((status) => status.value === elementos.find((elem) => elem.order_id === clickedOrder)?.status)?.label) || ""}
          />

          <Button fullWidth mt="lg" type="submit" onClick={() => console.log("mudar o estado da encomenda")}>
            Guardar
          </Button>
        </>
      </Modal>

      <Card withBorder shadow="md" p={30} mt={10} radius="md" style={{ flex: 1 }}>
        <Flex mb={"lg"} align={"center"}>
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
        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Preço Total</Table.Th>
                <Table.Th>Nº Produtos</Table.Th>
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

export default Orders;
