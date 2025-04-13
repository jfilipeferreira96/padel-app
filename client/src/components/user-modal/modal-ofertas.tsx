import React, { useEffect, useState } from "react";
import { Modal, Center, Loader, Table, Pagination, Box, TableScrollContainer, Card, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { getUserOffers } from "@/services/dashboard.service";
import dayjs from "dayjs";
import "dayjs/locale/pt";
dayjs.locale("pt");

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userId: number | null;
  fetchData: () => Promise<void>;
}

interface CompletedCard {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  last_updated?: string | null;
}

interface CreditVoucherTransaction {
  voucher_name: string;
  user_first_name: string;
  user_last_name: string;
  user_email?: string | null;
  phone?: string | null;
  credits_before: number;
  credits_after: number;
  discount_amount: number;
  admin_first_name?: string | null;
  admin_last_name?: string | null;
  transaction_time?: string | null;
}

interface ActivatedVoucher {
  voucher_name: string;
  user_first_name: string;
  user_last_name: string;
  user_email?: string | null;
  phone?: string | null;
  admin_first_name?: string | null;
  admin_last_name?: string | null;
  activated_at?: string | null;
}

const PAGE_SIZE = 10;

const ModalOfertas: React.FC<Props> = ({ isModalOpen, setIsModalOpen, userId, fetchData }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [completedCards, setCompletedCards] = useState<CompletedCard[]>([]);
  const [creditVoucherTransactions, setCreditVoucherTransactions] = useState<CreditVoucherTransaction[]>([]);
  const [activatedVouchers, setActivatedVouchers] = useState<ActivatedVoucher[]>([]);

  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const [page3, setPage3] = useState(1);

  const [totalCompletedCards, setTotalCompletedCards] = useState(0);
  const [totalCreditVoucherTransactions, setTotalCreditVoucherTransactions] = useState(0);
  const [totalActivatedVouchers, setTotalActivatedVouchers] = useState(0);

  useEffect(() => {
    if (isModalOpen && userId) {
      open();
      setPage1(1);
      setPage2(1);
      setPage3(1);
    } else {
      close();
    }
  }, [isModalOpen, open, close, userId]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
      setLoading(true);
      setCompletedCards([]);
      setCreditVoucherTransactions([]);
      setActivatedVouchers([]);
    }
  }, [opened, setIsModalOpen]);

 useEffect(() => {
   const fetchOffersData = async () => {
     try {
       if (!userId) return;
       setLoading(true);
       const response = await getUserOffers(userId);

       if (response && response.status) {
         setCompletedCards(response.cardsCompleted || []);
         setTotalCompletedCards(response.cardsCompleted?.length || 0); // Assumindo que o array contém todos os itens
         setCreditVoucherTransactions(response.creditVoucherTransactions || []);
         setTotalCreditVoucherTransactions(response.creditVoucherTransactions?.length || 0); // Assumindo que o array contém todos os itens
         setActivatedVouchers(response.activatedVouchers || []);
         setTotalActivatedVouchers(response.activatedVouchers?.length || 0); // Assumindo que o array contém todos os itens
       } else {
         console.error("Erro ao buscar dados: status false ou resposta inválida", response);
         notifications.show({
           title: "Erro",
           message: "Algo correu mal ao buscar o histórico de ofertas.",
           color: "red",
         });
       }

       setLoading(false);
     } catch (error) {
       console.error("Error fetching user offers:", error);
       notifications.show({
         title: "Erro",
         message: "Algo correu mal ao buscar o histórico de ofertas.",
         color: "red",
       });
       setLoading(false);
     }
   };

   if (opened && userId) {
     fetchOffersData();
   }
 }, [opened, userId]);

    const renderTable = (title: string, headers: string[], data: any[], page: number, setPage: (p: number) => void, renderRow: (row: any, i: number) => JSX.Element, totalItems: number) => {
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedData = data.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);

      return (
        <Card withBorder shadow="md" p="lg" mt="xl" radius="md">
          <Text fw={700} size="lg" mb="md">
            {title}
          </Text>
          <TableScrollContainer minWidth={500}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  {headers.map((h, i) => (
                    <Table.Th key={i}>{h}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map(renderRow)
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={headers.length}>Sem dados</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </TableScrollContainer>

          {totalItems > PAGE_SIZE && (
            <Group justify="end" mt="md">
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          )}
        </Card>
      );
    };

  return (
    <Modal opened={opened} onClose={close} title="Ver Histórico de Ofertas" size="xxl">
       <Box miw={1500}></Box>
      {loading ? (
        <Center mt="xl" mih={"40vh"}>
          <Loader />
        </Center>
      ) : (
        <>
          {renderTable(
            "Cartões completados (10 carimbos)",
            ["Nome", "Email", "Telefone", "Data"],
            completedCards,
            page1,
            setPage1,
            (row, i) => (
              <Table.Tr key={i}>
                <Table.Td>
                  {row.first_name} {row.last_name}
                </Table.Td>
                <Table.Td>{row.email ?? "-"}</Table.Td>
                <Table.Td>{row.phone ?? "-"}</Table.Td>
                <Table.Td>{row.last_updated ? dayjs(row.last_updated).format("DD/MM/YYYY HH:mm") : "-"}</Table.Td>
              </Table.Tr>
            ),
            totalCompletedCards
          )}

          {renderTable(
            "Descontos de vouchers monetários",
            ["Voucher", "Utilizador", "Email", "Telemóvel", "Crédito Antes", "Crédito Depois", "Valor Desconto", "Aplicado Por", "Data Transação"],
            creditVoucherTransactions,
            page2,
            setPage2,
            (transaction, i) => (
              <Table.Tr key={i}>
                <Table.Td>{transaction.voucher_name}</Table.Td>
                <Table.Td>
                  {transaction.user_first_name} {transaction.user_last_name}
                </Table.Td>
                <Table.Td>{transaction.user_email ?? "-"}</Table.Td>
                <Table.Td>{transaction.phone ?? "-"}</Table.Td>
                <Table.Td>{transaction.credits_before}€</Table.Td>
                <Table.Td>{transaction.credits_after}€</Table.Td>
                <Table.Td>{transaction.discount_amount}€</Table.Td>
                <Table.Td>{transaction.admin_first_name ? `${transaction.admin_first_name} ${transaction.admin_last_name}` : "Sistema/Não definido"}</Table.Td>
                <Table.Td>{transaction.transaction_time ? dayjs(transaction.transaction_time).format("DD/MM/YYYY HH:mm") : "-"}</Table.Td>
              </Table.Tr>
            ),
            totalCreditVoucherTransactions
          )}

          {renderTable(
            "Vouchers Ativados",
            ["Voucher", "Utilizador", "Email", "Telemóvel", "Ativado Por", "Data de Ativação"],
            activatedVouchers,
            page3,
            setPage3,
            (voucher, i) => (
              <Table.Tr key={i}>
                <Table.Td>{voucher.voucher_name}</Table.Td>
                <Table.Td>
                  {voucher.user_first_name} {voucher.user_last_name}
                </Table.Td>
                <Table.Td>{voucher.user_email ?? "-"}</Table.Td>
                <Table.Td>{voucher.phone ?? "-"}</Table.Td>
                <Table.Td>{voucher.admin_first_name ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "Não definido"}</Table.Td>
                <Table.Td>{voucher.activated_at ? dayjs(voucher.activated_at).format("DD/MM/YYYY HH:mm") : "-"}</Table.Td>
              </Table.Tr>
            ),
            totalActivatedVouchers
          )}
        </>
      )}
    </Modal>
  );
};

export default ModalOfertas;
