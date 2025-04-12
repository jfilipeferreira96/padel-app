"use client";
import { routes } from "@/config/routes";
import { Card, Table, Group, Text, ActionIcon, Tooltip, TableScrollContainer, Pagination, Center, Title, Loader } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useState } from "react";
/* import { getDailyOffersData } from "@/api/ofertas";
 */
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import "@mantine/dates/styles.css";

function VerificarOfertas() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [completedCards, setCompletedCards] = useState<any[]>([]);
  const [usedOffers, setUsedOffers] = useState<any[]>([]);
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
      /*  const dateStr = dayjs(selectedDate).format("YYYY-MM-DD");
      const response = await getDailyOffersData(dateStr);

      if (response.status) {
        setCompletedCards(response.completed_cards);
        setUsedOffers(response.used_offers);
        setActivatedVouchers(response.activated_vouchers);
        setPage1(1);
        setPage2(1);
        setPage3(1);
      } */
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
          <DatePickerInput value={selectedDate} onChange={setSelectedDate} label="Alterar data" placeholder="Dia" valueFormat="DD/MM/YYYY" w={150} />
          <Tooltip label="Atualizar" withArrow position="top">
            <ActionIcon variant="filled" color="green" onClick={fetchData} size="lg" style={{ position: "relative", top: "12px" }}>
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
          {renderTable("Cartões completados (10 carimbos)", ["Nome", "Email", "Telefone", "Data Completo"], completedCards, page1, setPage1, (row, i) => (
            <Table.Tr key={i}>
              <Table.Td>{row.user_name}</Table.Td>
              <Table.Td>{row.email}</Table.Td>
              <Table.Td>{row.phone}</Table.Td>
              <Table.Td>{dayjs(row.reached_on).format("DD/MM/YYYY HH:mm")}</Table.Td>
            </Table.Tr>
          ))}

          {/* Tabela 2 - Descontos de ofertas */}
          {renderTable("Ofertas Descontadas (Carimbos Usados)", ["Nome", "Email", "Desconto", "Data"], usedOffers, page2, setPage2, (row, i) => (
            <Table.Tr key={i}>
              <Table.Td>{row.user_name}</Table.Td>
              <Table.Td>{row.email}</Table.Td>
              <Table.Td>{row.discount_amount}€</Table.Td>
              <Table.Td>{dayjs(row.used_on).format("DD/MM/YYYY HH:mm")}</Table.Td>
            </Table.Tr>
          ))}

          {/* Tabela 3 - Vouchers ativados */}
          {renderTable("Vouchers Ativados", ["Nome", "Voucher", "Email", "Data Ativação"], activatedVouchers, page3, setPage3, (row, i) => (
            <Table.Tr key={i}>
              <Table.Td>{row.user_name}</Table.Td>
              <Table.Td>{row.voucher_name}</Table.Td>
              <Table.Td>{row.email}</Table.Td>
              <Table.Td>{dayjs(row.activated_at).format("DD/MM/YYYY HH:mm")}</Table.Td>
            </Table.Tr>
          ))}
        </>
      )}
    </>
  );
}

export default VerificarOfertas;
