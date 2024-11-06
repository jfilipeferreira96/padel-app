import React, { useState, useEffect } from "react";
import { Modal, Table, Loader, Text, Center, Box } from "@mantine/core";
import { getVoucherTransactions } from "@/services/vouchers.service";
import dayjs from "dayjs";
import "dayjs/locale/pt";
dayjs.locale("pt");

interface ModalTransactionsProps {
  opened: boolean;
  onClose: () => void;
  user_voucher_id: number | null;
  isAdmin?: boolean;
}

interface Transaction {
  transaction_id: number;
  user_voucher_id: number;
  credits_before: number;
  credits_after: number;
  created_at: string;
  obvservation: string | null;

  changed_by_email: string | null;
  changed_by_first_name: string | null;
  changed_by_last_name: string | null;

  owner_email: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_phone: string | null;
}

const ModalTransactions: React.FC<ModalTransactionsProps> = ({ opened, onClose, user_voucher_id, isAdmin = false }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async (user_voucher_id: number) => {
    setLoading(true);
    try {
      const response = await getVoucherTransactions(user_voucher_id);
      setTransactions(response.data);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opened && user_voucher_id) {
      fetchTransactions(user_voucher_id);
    }
  }, [opened, user_voucher_id]);

  return (
    <Modal opened={opened} onClose={onClose} title="Histórico de Transações" size="xl" centered>
      {loading ? (
        <Center mt={20}>
          <Loader color="blue" />
        </Center>
      ) : transactions.length === 0 ? (
        <>
          <Box>
            <Center>
              <Text>Nenhuma transação encontrada.</Text>
            </Center>
          </Box>
        </>
      ) : (
        <Table.ScrollContainer minWidth={600}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>

                <Table.Th>Saldo</Table.Th>
                <Table.Th>Observações</Table.Th>
                <Table.Th>Data</Table.Th>
                {isAdmin && (
                  <>
                    <Table.Th>Email do Responsável</Table.Th>
                    <Table.Th>Nome do Responsável</Table.Th>
                  </>
                )}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {transactions.map((transaction, idx) => (
                <Table.Tr key={transaction.transaction_id}>
                  <Table.Td>{idx + 1}</Table.Td>

                  <Table.Td>{transaction.credits_after} €</Table.Td>
                  <Table.Td>{transaction.obvservation || "-"}</Table.Td>
                  <Table.Td>{dayjs(transaction.created_at).format("YYYY-MM-DD HH:mm")}</Table.Td>
                  {isAdmin && (
                    <>
                      <Table.Td>{transaction.changed_by_email || "-"}</Table.Td>
                      <Table.Td>{transaction.changed_by_first_name + " " + transaction.changed_by_last_name}</Table.Td>
                    </>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Modal>
  );
};

export default ModalTransactions;
