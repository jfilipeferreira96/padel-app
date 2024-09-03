"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Select, Flex, Tooltip, ActionIcon, TextInput, Box, Text, Group, Pagination, rem, Modal, Center, Button } from "@mantine/core";
import { IconCheck, IconRefresh, IconSearch, IconTrash } from "@tabler/icons-react";
import { useLocation } from "@/providers/LocationProvider";
import { usePathname } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { getCreditsHistory } from "@/services/video.service";

// Interface para os vouchers
interface Voucher {
  user_id: number;
  credits_before: number,
  credits_after :number,
  given_by: string | null;
  created_at: Date;
  phone: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
}

function VideoCredits() {
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

      const response = await getCreditsHistory(pagination, filters);

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

  const handleFilterChange = (value: string | null) => {
      setFilterOption(value);
      localStorage.setItem("filterVoucher", value || "");
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
        {voucher.user_first_name} {voucher.user_last_name}
      </Table.Td>
      <Table.Td>{voucher.user_email}</Table.Td>
      <Table.Td>{voucher.phone}</Table.Td>
      <Table.Td>{voucher.credits_before}</Table.Td>
      <Table.Td>{voucher.credits_after}</Table.Td>
      <Table.Td>{voucher.given_by ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "-"}</Table.Td>
      <Table.Td>{new Date(voucher.created_at).toLocaleString()}</Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <h1>Histórico de Atribuição de Créditos</h1>

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
            <Text>linhas</Text>
          </Flex>
          {/* <Group>
            <Select placeholder="Seleciona filtros" data={["Ver ativados", "Ver não ativados"]} value={filterOption} onChange={(value) => handleFilterChange(value)} />
            <Tooltip label={"Atualizar Tabela"} withArrow position="top">
              <ActionIcon variant="subtle" color="green" onClick={() => fetchData()} size="lg">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group> */}
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Telefone</Table.Th>
                <Table.Th>Créditos Antes</Table.Th>
                <Table.Th>Créditos Depois</Table.Th>
                <Table.Th>Atribuido Por</Table.Th>
                <Table.Th>Data de Atribuição</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {vouchers.length > 0 && (
          <Flex justify={"space-between"} mt={"lg"}>
            <Text>
              A mostrar {initialIndex + 1} a {Math.min(finalIndex, totalVouchers)} de {totalVouchers} linhas
            </Text>
            <Pagination total={Math.ceil(totalVouchers / elementsPerPage)} onChange={handlePageChange} />
          </Flex>
        )}
      </Card>
    </>
  );
}

export default VideoCredits;
