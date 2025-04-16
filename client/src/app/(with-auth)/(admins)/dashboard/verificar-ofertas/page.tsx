"use client";
import { routes } from "@/config/routes";
import { Card, Table, Group, Text, ActionIcon, Tooltip, TableScrollContainer, Pagination, Center, Title, Loader } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import "@mantine/dates/styles.css";
import { getDailyOffersData } from "@/services/dashboard.service";

function VerificarOfertas() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [completedCards, setCompletedCards] = useState<any[]>([]);
  const [creditVoucherTransactions, setCreditVoucherTransactions] = useState<any[]>([]);
  const [activatedVouchers, setActivatedVouchers] = useState<any[]>([]);

  // Paginação individual
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const [page3, setPage3] = useState(1);
  const perPage = 10;

  const fetchData = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const dateStr = dayjs(selectedDate).format("YYYY-MM-DD");
      const response = await getDailyOffersData(dateStr);
      console.log(response);
      if (response.status) {
        setCompletedCards(response.cardsCompleted);
        setCreditVoucherTransactions(response.creditVoucherTransactions);
        setActivatedVouchers(response.activatedVouchers);
        setPage1(1);
        setPage2(1);
        setPage3(1);
      }
    } catch (err) {
      console.error("Erro ao buscar ofertas:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const paginate = (data: any[], page: number) => {
    const start = (page - 1) * perPage;
    return data.slice(start, start + perPage);
  };

  const renderTable = (title: string, headers: string[], data: any[], page: number, setPage: (p: number) => void, renderRow: (row: any, i: number) => JSX.Element) => (
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
            {data.length ? (
              paginate(data, page).map(renderRow)
            ) : (
              <Table.Tr>
                <Table.Td colSpan={headers.length}>Sem dados</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </TableScrollContainer>

      {data.length > perPage && (
        <Group justify="end" mt="md">
          <Pagination value={page} onChange={setPage} total={Math.ceil(data.length / perPage)} />
        </Group>
      )}
    </Card>
  );

  return (
    <>
      <h1>{`Verificar Ofertas - ${dayjs(selectedDate).format("DD/MM/YYYY")}`}</h1>

      <>
        <Group align="center">
          <ActionIcon
            variant="light"
            color="blue"
            onClick={() => setSelectedDate(prev => dayjs(prev).subtract(1, 'day').toDate())}
            size="lg"
            style={{ position: "relative", top: "12px" }}
          >
            ←
          </ActionIcon>

          <DatePickerInput
            value={selectedDate}
            onChange={setSelectedDate}
            label="Alterar data"
            placeholder="Dia"
            valueFormat="DD/MM/YYYY"
            w={150}
          />

          <ActionIcon
            variant="light"
            color="blue"
            onClick={() => setSelectedDate(prev => dayjs(prev).add(1, 'day').toDate())}
            size="lg"
            style={{ position: "relative", top: "12px" }}
          >
            →
          </ActionIcon>

          <Tooltip label="Atualizar" withArrow position="top">
            <ActionIcon
              variant="filled"
              color="green"
              onClick={fetchData}
              size="lg"
              style={{ position: "relative", top: "12px" }}
            >
              <IconRefresh />
            </ActionIcon>
          </Tooltip>
        </Group>
      </>

      {loading ? (
        <Center mt="xl">
          <Loader />
        </Center>
      ) : (
        <>
          {/* Tabela 1 - Cartões com 10 carimbos */}
          {renderTable("Cartões completados (10 carimbos)", ["Nome", "Email", "Telefone", "Data"], completedCards, page1, setPage1, (row, i) => (
            <Table.Tr key={i}>
              <Table.Td>
                {row.first_name} {row.last_name}
              </Table.Td>
              <Table.Td>{row.email ?? "-"}</Table.Td>
              <Table.Td>{row.phone ?? "-"}</Table.Td>
              <Table.Td>{row.last_updated ? dayjs(row.last_updated).format("DD/MM/YYYY HH:mm") : "-"}</Table.Td>
            </Table.Tr>
          ))}

          {/* Tabela 2 - Descontos de vouchers monetários */}
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
                <Table.Td>{transaction?.obvservation ?? "-"}</Table.Td>
                <Table.Td>{transaction.admin_first_name ? `${transaction.admin_first_name} ${transaction.admin_last_name}` : "Sistema/Não definido"}</Table.Td>
                <Table.Td>{transaction.transaction_time ? dayjs(transaction.transaction_time).format("DD/MM/YYYY HH:mm") : "-"}</Table.Td>
              </Table.Tr>
            )
          )}

          {/* Tabela 3 - Vouchers Ativados */}
          {renderTable("Vouchers Ativados", ["Voucher", "Utilizador", "Email", "Telemóvel", "Ativado Por", "Data de Ativação"], activatedVouchers, page3, setPage3, (voucher, i) => (
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
          ))}
        </>
      )}
    </>
  );
}

export default VerificarOfertas;
