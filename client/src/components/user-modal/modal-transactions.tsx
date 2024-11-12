import React, { useState, useEffect } from "react";
import { Modal, Table, Loader, Text, Center, Box, Divider } from "@mantine/core";
import { getVoucherTransactions } from "@/services/vouchers.service";
import dayjs from "dayjs";
import "dayjs/locale/pt";
dayjs.locale("pt");

interface ModalTransactionsProps
{
  opened: boolean;
  onClose: () => void;
  user_voucher_id: number | null;
  isAdmin?: boolean;
}

interface Transaction
{
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

const ModalTransactions: React.FC<ModalTransactionsProps> = ({ opened, onClose, user_voucher_id, isAdmin = false }) =>
{
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async (user_voucher_id: number) =>
  {
    setLoading(true);
    try
    {
      const response = await getVoucherTransactions(user_voucher_id);
      setTransactions(response.data);
    } catch (error)
    {
      console.error("Erro ao buscar transações:", error);
    } finally
    {
      setLoading(false);
    }
  };

  useEffect(() =>
  {
    if (opened && user_voucher_id)
    {
      fetchTransactions(user_voucher_id);
    }
  }, [opened, user_voucher_id]);

  // Função para calcular o montante positivo ou negativo
  const calcularMontante = (index: number): string =>
  {
    if (index === 0) return "0.00 €"; // Primeira transação não tem uma anterior para comparação

    const transacaoAtual = transactions[index];
    const transacaoAnterior = transactions[index - 1];
    const diferenca = transacaoAtual.credits_after - transacaoAnterior.credits_after;

    // Adiciona o sinal adequado e formata o valor
    return diferenca > 0 ? `+${diferenca.toFixed(2)} €` : `${diferenca.toFixed(2)} €`;
  };

  // Obtendo o saldo inicial e o saldo atual
  const saldoInicial = transactions.length > 0 ? transactions[0].credits_before : 0;
  const saldoAtual = transactions.length > 0 ? transactions[transactions.length - 1].credits_after : 0;

  return (
    <Modal opened={opened} onClose={onClose} title={"Histórico de Transações"} size="xl" centered>
      {loading ? (
        <Center mt={20}>
          <Loader color="blue" />
        </Center>
      ) : transactions.length === 0 ? (
        <Box>
          <Center>
            <Text>Nenhuma transação encontrada.</Text>
          </Center>
        </Box>
      ) : (
        <>
          {/* Exibindo o saldo inicial no topo */}
          <Box mb="lg" mt="md">
                <Text component="span" fw={500} bg={"rgb(252 213 146)"} c={"black"} p={2}>Vale {saldoInicial}€</Text>
          </Box>

          {/* Tabela de transações */}
          <Table.ScrollContainer minWidth={200}>
            <Table withRowBorders={false}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Observações</Table.Th>
                  <Table.Th>Montante</Table.Th>
                  {isAdmin && (
                    <>
                      <Table.Th>Email do Responsável</Table.Th>
                      <Table.Th>Nome do Responsável</Table.Th>
                    </>
                  )}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {transactions.map((transaction, index) => (
                  <Table.Tr key={transaction.transaction_id}>
                    <Table.Td>{dayjs(transaction.created_at).format("DD/MM/YYYY")}</Table.Td>
                    <Table.Td>{transaction.obvservation || "-"}</Table.Td>
                    <Table.Td>{calcularMontante(index)}</Table.Td>
                    {isAdmin && (
                      <>
                        <Table.Td>{transaction.changed_by_email || "-"}</Table.Td>
                        <Table.Td>{`${transaction.changed_by_first_name || "-"} ${transaction.changed_by_last_name || "-"}`}</Table.Td>
                      </>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Divider my="md" color="rgb(252 213 146)" size="md" />

          <Box mt="lg">
                <Text fw={500}>Saldo Atual: <b>{saldoAtual}€</b></Text>
          </Box>
        </>
      )}
    </Modal>
  );
};

export default ModalTransactions;
