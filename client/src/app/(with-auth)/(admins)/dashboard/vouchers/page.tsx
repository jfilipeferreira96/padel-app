"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, Badge, Skeleton, Grid, Group, Tooltip, ActionIcon, rem, Button, TextInput, Box } from "@mantine/core";
/* import { getUserVouchers } from "@/services/voucher.service";
 */
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useLocation } from "@/providers/LocationProvider";
import { usePathname } from "next/navigation";

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

interface Voucher
{
    id: number;
    name: string;
    image_url: string;
    assigned_at: string;
    assigned_by: number;
    activated_at: string | null;
    activated_by: number | null;
    user_email: string;
    user_first_name: string;
    user_last_name: string;
    admin_email: string;
    admin_first_name: string;
    admin_last_name: string;
}

function VoucherHistory()
{
    const pathname = usePathname();
    const [activePage, setActivePage] = useState<number>(1);
    const [elementsPerPage, setElementsPerPage] = useState<number>(() =>
    {
        const storedValue = localStorage.getItem(pathname);
        return storedValue ? parseInt(storedValue) : 10;
    });
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [totalVouchers, setTotalVouchers] = useState<number>(0);
    const { location } = useLocation();
    const [searchTerm, setSearchTerm] = useState<string>("");

    const fetchData = async () => {
        setLoading(true);
        if (!location || !location.value) return;
        try
        {
          /*   const response = await getUserVouchers(location.value, searchTerm, activePage, elementsPerPage);
            if (response)
            {
                setVouchers(response.data);
                setTotalVouchers(response.pagination.total || 0);
                setActivePage(response.pagination.page || 1);
            } */
            setLoading(false);
        } catch (error)
        {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    useEffect(() =>
    {
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
            <Table.Td>
                {voucher.user_first_name} {voucher.user_last_name}
            </Table.Td>
            <Table.Td>{voucher.user_email}</Table.Td>
            <Table.Td>{voucher.name}</Table.Td>
            <Table.Td>{voucher.activated_at ? `${voucher.admin_first_name} ${voucher.admin_last_name}` : "-"}</Table.Td>
            <Table.Td>{new Date(voucher.assigned_at).toLocaleString()}</Table.Td>
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
                        leftSection={<IconSearch style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
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
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Email</Table.Th>
                                <Table.Th>Voucher</Table.Th>
                                <Table.Th>Validador</Table.Th>
                                <Table.Th>Data de Atribuição</Table.Th>
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
                        <MantinePagination total={Math.ceil(totalVouchers / elementsPerPage)} onChange={handlePageChange} />
                    </Flex>
                )}
            </Card>
        </>
    );
}

export default VoucherHistory;
