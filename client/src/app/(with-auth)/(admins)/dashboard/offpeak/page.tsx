"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, Badge, SimpleGrid, Skeleton, Grid, Tooltip, ActionIcon, rem, Group, Button, Modal } from "@mantine/core";
import { IconEye, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { deleteOffpeakCard, getAllOffpeakCards, monthOptions } from "@/services/offpeak.service";
import { useDisclosure } from "@mantine/hooks";
import { usePathname } from "next/navigation";
import EditOffpeakModal from "@/components/offpeak-modal/edit";
import AddOffpeakModal from "@/components/offpeak-modal/add";

function getBadge(isActive: number) {
  return isActive === 1 ? { name: "Ativo", color: "blue" } : { name: "Inativo", color: "gray" };
}

interface OffpeakCard {
  offpeak_card_id: number;
  name: string;
  month: number;
  year: number;
  is_active: number;
  created_at: string;
}

function CardsOffpeak() {
  const pathname = usePathname();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(() => {
    const storedValue = localStorage.getItem(pathname);
    return storedValue ? parseInt(storedValue) : 10;
  });
  const [offpeakCards, setOffpeakCards] = useState<OffpeakCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isModalOpenAdd, setIsModalOpenAdd] = useState<boolean>(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState<boolean>(false);
  const [editCardId, setEditCardId] = useState<number | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<number | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pagination = {
        page: activePage,
        limit: elementsPerPage,
        orderBy: "year",
        order: "DESC",
      };

      const response = await getAllOffpeakCards(pagination);
     
      if (response.status) {
        // Sort the data by year and then by month
        const sortedCards = response.data.sort((a: any, b: any) => {
          if (a.year === b.year) {
            return a.month - b.month;
          }
          return b.year - a.year;
        });
        setOffpeakCards(sortedCards);
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

  const handleEditCleak = (productId: number) => {
    setEditCardId(productId);
    setIsModalOpenEdit(true);
  };

  const handleElementsPerPageChange = (value: string | null) => {
    if (value) {
      setElementsPerPage(parseInt(value));
      setActivePage(1); // Reset to first page whenever elements per page change
      localStorage.setItem(pathname, value);
    }
  };

  const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage;

  const rows = offpeakCards?.map((card) => (
    <Table.Tr key={card.offpeak_card_id} bg={selectedRows.includes(card.offpeak_card_id) ? "var(--mantine-color-blue-light)" : undefined}>
      <Table.Td>
        <Badge variant="filled" size="md" fw={700} color={getBadge(card.is_active).color} style={{ minWidth: "110px" }}>
          {getBadge(card.is_active).name}
        </Badge>
      </Table.Td>
      <Table.Td>{card.name}</Table.Td>
      <Table.Td>{monthOptions.find((month) => month.value === card.month)?.label}</Table.Td>
      <Table.Td>{card.year}</Table.Td>
      <Table.Td>
        <Group gap={0} justify="center">
          <Tooltip label={"Eliminar Cartão Offpeak"} withArrow position="top">
            <ActionIcon
              variant="filled" className="action-icon-size" 
              color="red"
              onClick={() => {
                setDeleteCardId(card.offpeak_card_id);
                open();
              }}
            >
              <IconTrash style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={"Editar Cartão Offpeak"} withArrow position="top">
            <ActionIcon variant="filled" className="action-icon-size"  onClick={() => handleEditCleak(card.offpeak_card_id)}>
              <IconPencil size={20} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <h1>Cartões Off Peak</h1>
      <AddOffpeakModal isModalOpen={isModalOpenAdd} setIsModalOpen={setIsModalOpenAdd} fetchData={fetchData} />
      <EditOffpeakModal isModalOpen={isModalOpenEdit} setIsModalOpen={setIsModalOpenEdit} fetchData={fetchData} cardId={editCardId} />

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
            if (deleteCardId) {
              deleteOffpeakCard(deleteCardId)
                .then((res: any) => {
                  if (res.status === true) {
                    notifications.show({
                      message: res.message,
                      color: "green",
                    });
                  } else {
                    notifications.show({
                      title: "Erro",
                      message: "Ocorreu um erro",
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
            Adicionar Cartão Offpeak
          </Button>
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Mês</Table.Th>
                <Table.Th>Ano</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {offpeakCards.length > 0 && (
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

export default CardsOffpeak;
