"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Select, Flex, Tooltip, ActionIcon, TextInput, Box, Text, Group, Pagination, rem } from "@mantine/core";
import { IconCheck, IconRefresh, IconSearch } from "@tabler/icons-react";
import { useLocation } from "@/providers/LocationProvider";
import { usePathname } from "next/navigation";
import { getAllVouchersHistory } from "@/services/vouchers.service";

function getBadge(activated_by: number | null)
{
    if (!activated_by)
    {
        return { name: "Não ativado", color: "red" };
    } else
    {
        return { name: "Ativado", color: "green" };
    }
}

// Interface para os vouchers
interface Voucher {
  id: number;
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
}

function VoucherHistory()
{
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

    // Função para buscar dados (simulação)

    const fetchData = async () => {
          setLoading(true);
          try {
            const pagination = {
              page: activePage,
              limit: elementsPerPage,
              orderBy: "v.voucher_id",
              order: "DESC",
            };

            const response = await getAllVouchersHistory(pagination);
            console.log(response);
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

    useEffect(() => {
        fetchData();
    }, [activePage, elementsPerPage, location, searchTerm]);

    const handlePageChange = (page: number) =>
    {
        setActivePage(page);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) =>
    {
        setSearchTerm(event.currentTarget.value);
    };

    const handleElementsPerPageChange = (value: string | null) =>
    {
        if (value)
        {
            setElementsPerPage(parseInt(value));
            setActivePage(1); // Reset to first page whenever elements per page change
            localStorage.setItem(pathname, value);
        }
    };

    const initialIndex = (activePage - 1) * elementsPerPage;
    const finalIndex = initialIndex + elementsPerPage;

    const rows = vouchers.map((voucher) => (
      <Table.Tr key={voucher.id}>
        <Table.Td>
          <Badge variant="filled" size="md" fw={700} color={getBadge(voucher.activated_by).color} style={{ minWidth: "110px" }}>
            {getBadge(voucher.activated_by).name}
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
        <Table.Td>{voucher.activated_at ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "-"}</Table.Td>
        <Table.Td>{voucher.activated_at ? new Date(voucher.activated_at).toLocaleString() : "-"}</Table.Td>
        <Table.Td>
          <Group gap={0} justify="center">
            {voucher.activated_at ? (
              <>-</>
            ) : (
              <>
                <Tooltip label={"Ativar voucher"} withArrow position="top">
                  <ActionIcon variant="subtle" color="green" onClick={() => console.log("123")}>
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
      <>
        <h1>Histórico de Atribuição de Vouchers</h1>
        <Card withBorder shadow="md" p={30} mt={10} radius="md" style={{ flex: 1 }}>
          <Box maw={600}>
            <TextInput
              radius="xl"
              size="md"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Pesquisar por nome ou email"
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
            <Tooltip label={"Atualizar Tabela"} withArrow position="top">
              <ActionIcon variant="subtle" color="green" onClick={() => fetchData()} size="lg">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Table.ScrollContainer minWidth={500}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Voucher</Table.Th>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Telefone</Table.Th>
                  <Table.Th>Atribuido Por</Table.Th>
                  <Table.Th>Data de Atribuição</Table.Th>
                  <Table.Th>Razão</Table.Th>
                  <Table.Th>Ativado Por</Table.Th>
                  <Table.Th>Data de Ativação</Table.Th>
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
