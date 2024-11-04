"use client";
import { useEffect, useState, useCallback } from "react";
import { Modal, Table, Text, Button, Center, Loader, Paper, Divider, Badge, Tooltip, ActionIcon, Group, TextInput, Box, Flex, Select, rem, Card, Pagination, Radio, CheckIcon, NumberInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { getUser, UserData } from "@/services/user.service";
import { getAllVouchersHistory, assignVoucher, getAllVouchers, ativarVoucher, deleteVoucher } from "@/services/vouchers.service";
import { IconCheck, IconCurrencyEuro, IconRefresh, IconSearch, IconTrash } from "@tabler/icons-react";
import { useSession } from "@/providers/SessionProvider";
import { usePathname } from "next/navigation";
import EditBalanceModal from "./balance-voucher-modal";

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userId: number | null;
  fetchData: () => Promise<void>;
}

function getBadge(activated_by: string | null) {
  if (!activated_by) {
    return { name: "Não ativado", color: "red" };
  } else {
    return { name: "Ativado", color: "green" };
  }
}

interface Voucher {
  user_voucher_id: number;
  voucher_id: number;
  voucher_name: string;
  assigned_at: string;
  assigned_by: number;
  activated_at: string | null;
  activated_by: number | null;
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

export default function ModalVoucher({ isModalOpen, setIsModalOpen, userId, fetchData }: Props) {
  const { user } = useSession();
  const pathname = usePathname();
  const [opened, { open, close }] = useDisclosure(false);
  const [voucherData, setVouchersData] = useState<{ created_at: string; image_url: string; name: string; voucher_id: number; voucher_type: string }[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userVouchers, setUserVouchers] = useState<Voucher[]>([]);
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(() => {
    const storedValue = localStorage.getItem(pathname);
    return storedValue ? parseInt(storedValue) : 10;
  });
  const [totalVouchers, setTotalVouchers] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isActive, setIsActive] = useState<string>("0");
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<number | null>(null);
  const [editModalOpened, setEditModalOpened] = useState(false);
   const [clickedVoucher, setClickedVoucher] = useState<Voucher | null>(null);

  const onDelete = async (id: number) => {
    try {
      deleteVoucher(id).then((res) => {
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
      });
      if (userId) {
        fetchUserData(userId);
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Algo correu mal",
        color: "red",
      });
    }
  }
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
        if (userId) {
          fetchUserData(userId);
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
  
  useEffect(() => {
    if (isModalOpen && userId) {
      fetchUserData(userId);
      open();
    } else {
      close();
    }
  }, [isModalOpen, open, close, userId]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
      setVouchersData(null);
      setUserVouchers([]);
      setIsLoading(true);
      setIsActive("0");
      setSelectedVoucher(null);
      setReason("");
      setCreditLimit(null);
    }
  }, [opened, setIsModalOpen]);

  const fetchUserData = async (userId: number) => {
    if (!userId) return;

    try {
      const pagination = {
        page: activePage,
        limit: elementsPerPage,
        orderBy: "v.voucher_id",
        order: "DESC",
      };

       const filters: any = {
         email: searchTerm ?? null,
         name: searchTerm ?? null,
         phone: searchTerm ?? null,
         assigned_to: userId,
       };

      const [vouchers, vouchersResponse] = await Promise.all([getAllVouchers(), getAllVouchersHistory(pagination, filters)]);
      
      if (vouchers.status) {
        setVouchersData(vouchers.data);
      }
      if (vouchersResponse.status) {
        setUserVouchers(vouchersResponse.data);
        setTotalVouchers(vouchersResponse.pagination.total || 0);
        setActivePage(vouchersResponse.pagination.page || 1);
      }
      setIsLoading(false);
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar os dados",
        color: "red",
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchUserData(userId);
  }, [userId, activePage, elementsPerPage, searchTerm]);

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.currentTarget.value);
  };

  const handleElementsPerPageChange = (value: string | null) => {
    if (value) {
      setElementsPerPage(parseInt(value));
      setActivePage(1);
      localStorage.setItem(pathname, value);
    }
  };

    const handleEditBalanceClick = (voucher: Voucher) => {
      setClickedVoucher(voucher);
      setEditModalOpened(true);
    };

   const onSubmit = async () => {
     if (!selectedVoucher || !reason || !userId) {
       notifications.show({
         title: "Erro",
         message: "Por favor, preencha todos os campos obrigatórios.",
         color: "red",
       });
       return;
     }

     const hasCredit = Number(selectedVoucher) == voucherData?.find((v) => v.voucher_type === "credito")?.voucher_id;
     if (hasCredit && Number(creditLimit) <= 0)
     {
       notifications.show({
         title: "Erro",
         message: "Crédito tem de ser maior que 0€.",
         color: "red",
       });
       return;
     }

     try {
       const response = await assignVoucher({
         voucher_id: Number(selectedVoucher),
         is_active: Number(isActive),
         reason,
         assigned_to: userId,
         credit_limit: Number(selectedVoucher) == voucherData?.find((v) => v.voucher_type === "credito")?.voucher_id ? Number(creditLimit) : undefined,
       });

       if (response.status) {
         notifications.show({ title: "Sucesso", message: response.message, color: "green" });
         fetchData();
         close();
       } else {
         notifications.show({ title: "Erro", message: response.message, color: "red" });
       }
     } catch (error) {
       notifications.show({ title: "Erro", message: "Algo correu mal", color: "red" });
     }
   };

  const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage;
  
  const rows = userVouchers.map((voucher, idx) => (
    <Table.Tr key={idx}>
      <Table.Td>
        <Badge variant="filled" size="md" fw={700} color={getBadge(voucher.activated_at).color} style={{ minWidth: "110px" }}>
          {getBadge(voucher.activated_at).name}
        </Badge>
      </Table.Td>
      <Table.Td>{voucher.voucher_name}</Table.Td>
      <Table.Td>
        {voucher.user_first_name} {voucher.user_last_name}
      </Table.Td>
      <Table.Td>{voucher.user_email}</Table.Td>
      <Table.Td>{voucher.phone}</Table.Td>
      <Table.Td>{voucher.assigned_at ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "-"}</Table.Td>
      <Table.Td>{new Date(voucher.assigned_at).toLocaleString()}</Table.Td>
      <Table.Td>{voucher.reason ? voucher.reason : "-"}</Table.Td>
      <Table.Td>{voucher.credit_limit ? voucher.credit_limit + "€" : "-"}</Table.Td>
      <Table.Td>{voucher.credit_limit ? voucher.credit_balance + "€" : "-"}</Table.Td>
      <Table.Td>{voucher.activated_at ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "-"}</Table.Td>
      <Table.Td>{voucher.activated_at ? new Date(voucher.activated_at).toLocaleString() : "-"}</Table.Td>
      <Table.Td>
    
          <Group gap={0} justify="center">
            {voucher.activated_at ? (
              <>
                {/* Exibe o hífen caso o voucher esteja ativado, mas o limite de crédito seja 0 */}
                {voucher.credit_limit > 0 ? (
                  <Tooltip label="Editar Saldo" withArrow position="top">
                    <ActionIcon variant="subtle" onClick={() => handleEditBalanceClick(voucher)} color="blue">
                      <IconCurrencyEuro style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <span>-</span>
                )}
              </>
            ) : (
              <>
                {voucher.credit_limit > 0 && (
                  <Tooltip label="Editar Saldo" withArrow position="top">
                    <ActionIcon variant="subtle" onClick={() => handleEditBalanceClick(voucher)} color="blue">
                      <IconCurrencyEuro style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                    </ActionIcon>
                  </Tooltip>
                )}
                <Tooltip label={"Remover voucher"} withArrow position="top">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => {
                      onDelete(voucher.user_voucher_id);
                    }}
                  >
                    <IconTrash style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={"Ativar voucher"} withArrow position="top">
                  <ActionIcon variant="subtle" color="green" onClick={() => onValidate(voucher.user_voucher_id)}>
                    <IconCheck style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Group>
      </Table.Td>
    </Table.Tr>
  ));
  
  return (
    <Modal opened={opened} onClose={close} title="Ver/atribuir vouchers" size="xxl">
      {isLoading ? (
        <Center mt={50} mih={"40vh"}>
          <Loader color="blue" />
        </Center>
      ) : (
        <>
          <Card>
            <Center>
              <h3>Histórico de vouchers</h3>
            </Center>

            <EditBalanceModal
              isModalOpen={editModalOpened}
              setIsModalOpen={setEditModalOpened}
              fetchData={() => (userId !== null ? fetchUserData(userId) : Promise.resolve())}
              voucherId={clickedVoucher?.user_voucher_id || null}
              currentBalance={clickedVoucher?.credit_balance || 0}
            />

            {userVouchers.length === 0 && (
              <>
                <Box miw={600}>
                  <Center>
                    <Text>Este utilizador não tem vouchers atribuídos.</Text>
                  </Center>
                </Box>
              </>
            )}
            {userVouchers.length > 0 && (
              <>
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
                        <Table.Th>Ações</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                  </Table>
                </Table.ScrollContainer>

                <Flex justify={"space-between"} mt={"lg"}>
                  <Text>
                    A mostrar {initialIndex + 1} a {Math.min(finalIndex, totalVouchers)} de {totalVouchers} vouchers
                  </Text>
                  <Pagination total={Math.ceil(totalVouchers / elementsPerPage)} onChange={handlePageChange} />
                </Flex>
              </>
            )}
          </Card>
          <Divider my="md" mt={"lg"} />
          <Card>
            <Center>
              <h3>Adicionar vouchers</h3>
            </Center>
            <Select
              className="specialinput"
              label="Vouchers disponíveis"
              placeholder="Selecione um voucher"
              data={voucherData ? voucherData.map((v) => ({ value: v.voucher_id.toString(), label: v.name })) : []}
              value={selectedVoucher}
              onChange={setSelectedVoucher}
              name="selected_voucher"
              required
            />

            {Number(selectedVoucher) === voucherData?.find((v) => v.voucher_type === "credito")?.voucher_id && (
              <NumberInput
                className="specialinput"
                label="Crédito em €"
                placeholder="50 €"
                value={creditLimit ?? undefined}
                onChange={(event) => {
                  const value = Number(event);
                  setCreditLimit(isNaN(value) ? null : value);
                }}
                name="credit_limit"
                required
                min={0.5}
              />
            )}
            <TextInput className="specialinput" label="Razão de atruibir" placeholder="Digite a razão" value={reason} onChange={(event) => setReason(event.currentTarget.value)} name="reason" required />

            <Radio.Group name="is_active" label="Desejar ativar este voucher?" mb={"sm"} value={isActive} onChange={setIsActive} mt={"lg"}>
              <Group mt="xs">
                <Radio value={"1"} label="Sim" icon={CheckIcon} />
                <Radio value={"0"} label="Não" icon={CheckIcon} />
              </Group>
            </Radio.Group>

            <Button fullWidth mt="lg" type="submit" onClick={() => onSubmit()}>
              Guardar
            </Button>
          </Card>
        </>
      )}
    </Modal>
  );
}
