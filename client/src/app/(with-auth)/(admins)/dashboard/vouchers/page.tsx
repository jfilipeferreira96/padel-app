"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Select, Flex, Tooltip, ActionIcon, TextInput, Box, Text, Group, Pagination, rem, Modal, Center, Button } from "@mantine/core";
import { IconCheck, IconEdit, IconRefresh, IconSearch, IconTrash, IconCurrencyEuro, IconEye } from "@tabler/icons-react";
import { useLocation } from "@/providers/LocationProvider";
import { usePathname } from "next/navigation";
import { getAllVouchersHistory, deleteVoucher, ativarVoucher } from "@/services/vouchers.service";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import EditBalanceModal from "@/components/user-modal/balance-voucher-modal";
import ModalTransactions from "@/components/user-modal/modal-transactions";

function getBadge(activated_by: string | null) {
  if (!activated_by) {
    return { name: "Por Ativar", color: "red" };
  } else {
    return { name: "Ativo", color: "green" };
  }
}

// Interface para os vouchers
interface Voucher {
  user_voucher_id: number;
  voucher_id: number;
  voucher_name: string;
  assigned_at: string;
  assigned_by: number;
  activated_at: string | null;
  activated_by: number | null;
  expires_at?: string | null;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  phone: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  reason: string;
  credit_limit: number;
  credit_balance: number;
  is_active: boolean;
}

function VoucherHistory() {
  const pathname = usePathname();
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(() => {
    const storedValue = localStorage.getItem(pathname);
    return storedValue ? parseInt(storedValue) : 10;
  });
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalVouchers, setTotalVouchers] = useState<number>(0);
  const { location } = useLocation();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterOption, setFilterOption] = useState<string | null>(() => {
    const storedValue = localStorage.getItem("filterVoucher");
    return storedValue ? storedValue : null;
  });
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const [openedTransactions, setOpenedTransactions] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);

  const openTransactionModal = (user_voucher_id: number) => {
    setSelectedVoucherId(user_voucher_id);
    setOpenedTransactions(true);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const pagination = {
        page: activePage,
        limit: elementsPerPage,
        orderBy: "uv.assigned_at",
        order: "DESC",
      };

      const filters: any = {
        email: searchTerm ?? null,
        name: searchTerm ?? null,
        phone: searchTerm ?? null,
      };

      if (filterOption === "Ver ativados") {
        filters.validated_by = false;
      } else if (filterOption === "Ver não ativados") {
        filters.validated_by = true;
      }

      const response = await getAllVouchersHistory(pagination, filters);

      if (response.status) {
        setVouchers(response.data);
        setTotalVouchers(response.pagination.total || 0);
        setActivePage(response.pagination.page || 1);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const onValidate = async (id: number) => {
    try {
      const response = await ativarVoucher(id);

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

      fetchData();
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Algo correu mal",
        color: "red",
      });
    }
  };

  const handleFilterChange = (value: string | null) => {
    setFilterOption(value);
    localStorage.setItem("filterUser", value || "");
  };

  useEffect(() => {
    fetchData();
  }, [activePage, elementsPerPage, searchTerm, filterOption]);

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.currentTarget.value);
  };

  const handleEditBalanceClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setEditModalOpened(true);
  };

  const handleSaveCreditBalance = async () => { };
  
  const onDelete = (id: number) => {
    setDeleteId(id);
    open(); 
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

  const rows = vouchers.map((voucher, index) => (
    <Table.Tr key={index}>
      <Table.Td>
        <Badge variant="filled" size="md" fw={700} color={getBadge(voucher.activated_at).color} style={{ minWidth: "100px" }}>
          {getBadge(voucher.activated_at).name}
        </Badge>
      </Table.Td>
      <Table.Td>{voucher.voucher_name}</Table.Td>
      <Table.Td>
        {voucher.user_first_name} {voucher.user_last_name}
      </Table.Td>
      <Table.Td>{voucher.user_email ?? "-"}</Table.Td>
      <Table.Td>{voucher.phone ?? "-"}</Table.Td>
      <Table.Td>{voucher.assigned_at ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "-"}</Table.Td>
      <Table.Td>{new Date(voucher.assigned_at).toLocaleString()}</Table.Td>
      <Table.Td>{voucher.reason ? voucher.reason : "-"}</Table.Td>
      <Table.Td>{voucher.credit_limit ? voucher.credit_limit + "€" : "-"}</Table.Td>
      <Table.Td>{voucher.credit_limit ? voucher.credit_balance + "€" : "-"}</Table.Td>
      <Table.Td>{voucher.activated_at ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "-"}</Table.Td>
      <Table.Td>{voucher.activated_at ? new Date(voucher.activated_at).toLocaleString() : "-"}</Table.Td>
      <Table.Td>{voucher.expires_at ? new Date(voucher.expires_at).toLocaleString() : "-"}</Table.Td>
      <Table.Td>
        <Group gap={0} justify="center">
          <Tooltip label={"Remover voucher"} withArrow position="top">
            <ActionIcon
              className="action-icon-size"
              variant="filled"
              color="red"
              onClick={() => {
                onDelete(voucher.user_voucher_id);
              }}
            >
              <IconTrash style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          {voucher.activated_at ? (
            <></>
          ) : (
            <Tooltip label={"Ativar voucher"} withArrow position="top">
              <ActionIcon className="action-icon-size" variant="filled" color="green" onClick={() => onValidate(voucher.user_voucher_id)}>
                <IconCheck style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
          {voucher.credit_limit > 0 && (
            <>
              <Tooltip label="Editar Saldo" withArrow position="top">
                <ActionIcon className="action-icon-size" variant="filled" onClick={() => handleEditBalanceClick(voucher)} color="blue">
                  <IconCurrencyEuro style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Ver Transações" withArrow position="top">
                <ActionIcon className="action-icon-size" variant="filled" onClick={() => openTransactionModal(voucher.user_voucher_id)} color="gray">
                  <IconEye style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
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
      <h1>Histórico de Atribuição de Vouchers</h1>

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
            if (deleteId) {
              deleteVoucher(deleteId)
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

      <EditBalanceModal
        isModalOpen={editModalOpened}
        setIsModalOpen={setEditModalOpened}
        fetchData={fetchData}
        voucherId={selectedVoucher?.user_voucher_id || null}
        currentBalance={selectedVoucher?.credit_balance || 0}
      />

      <ModalTransactions
        opened={openedTransactions}
        onClose={() => {
          setOpenedTransactions(false);
          setSelectedVoucherId(null);
        }}
        user_voucher_id={selectedVoucherId ?? null}
        isAdmin
      />

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
            <Text>vouchers</Text>
          </Flex>
          <Group>
            <Select placeholder="Seleciona filtros" data={["Ver ativados", "Ver não ativados"]} value={filterOption} onChange={(value) => handleFilterChange(value)} />
            <Tooltip label={"Atualizar Tabela"} withArrow position="top">
              <ActionIcon className="action-icon-size" variant="filled" color="green" onClick={() => fetchData()} size="lg">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Voucher</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Telemóvel</Table.Th>
                <Table.Th>Atribuido Por</Table.Th>
                <Table.Th>Data de Atribuição</Table.Th>
                <Table.Th>Razão</Table.Th>
                <Table.Th>Créditos Atribuídos</Table.Th>
                <Table.Th>Créditos Disponíveis</Table.Th>
                <Table.Th>Ativado Por</Table.Th>
                <Table.Th>Data de Ativação</Table.Th>
                <Table.Th>Data de Expiração</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {vouchers.length > 0 && (
          <Flex justify={"space-between"} mt={"lg"}>
            <Text>
              A mostrar {initialIndex + 1} a {Math.min(finalIndex, totalVouchers)} de {totalVouchers} vouchers
            </Text>
            <Pagination total={Math.ceil(totalVouchers / elementsPerPage)} onChange={handlePageChange} />
          </Flex>
        )}
      </Card>
    </>
  );
}

export default VoucherHistory;
