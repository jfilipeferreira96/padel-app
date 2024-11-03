"use client";
import React, { useState, useEffect } from "react";
import { Text, Title, Center, Loader, Box, Image, rem, SegmentedControl, Card, Grid, Pagination, Flex } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import "@mantine/carousel/styles.css";
import { getUserVouchers } from "@/services/vouchers.service";
import dayjs from "dayjs";
import "dayjs/locale/pt";
dayjs.locale("pt");

function VouchersPage() {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iconStyle = { width: rem(12), height: rem(12) };
  const [selectedTab, setSelectedTab] = useState<string>("Por usar");
  const [vouchers, setVouchers] = useState<
    {
      activated_at: string | null;
      activated_by: number;
      assigned_at: string;
      assigned_by: number;
      created_at: string;
      image_url: string;
      name: string;
      voucher_id: number;
      credit_limit: number;
      credit_balance: number;
    }[]
  >([]);
  const [page, setPage] = useState(1);
  const elementsPerPage = 4;

  const fetchData = async () => {
    setIsLoading(true);
    if (!user) return;

    try {
      const response = await getUserVouchers(user.id);
      if (response.status) {
        setVouchers(response.data);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch data initially

    const intervalId = setInterval(fetchData, 30000); // Fetch data every 30 seconds

    // Cleanup function to clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, [user]);

  if (isLoading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  const vouchersPorUsar = vouchers.filter((voucher) => !voucher.activated_at);
  const vouchersUsados = vouchers.filter((voucher) => voucher.activated_at);

  const paginatedVouchersPorUsar = vouchersPorUsar.slice((page - 1) * elementsPerPage, page * elementsPerPage);
  const paginatedVouchersUsados = vouchersUsados.slice((page - 1) * elementsPerPage, page * elementsPerPage);

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  return (
    <div>
      <Title mt={15} className="productheader">
        Vouchers
      </Title>
      <SegmentedControl mt={10} radius="md" fullWidth value={selectedTab} onChange={setSelectedTab} data={["Por usar", "Usados"]} />
      <Box mt={20}>
        {selectedTab === "Por usar" && (
          <>
            {paginatedVouchersPorUsar.length === 0 ? (
              <Center>
                <Text>Não tem vouchers por usar.</Text>
              </Center>
            ) : (
              <Grid mb={"lg"}>
                {paginatedVouchersPorUsar.map((voucher, index) => (
                  <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6 }} key={index}>
                    <Card p="md" radius="md" className={classes.card}>
                      <Image src={voucher.image_url ?? "./Placeholder.svg"} alt={voucher.name} />
                      <Flex>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                          Créditos: 0 €
                        </Text>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                          Balanço: 0 €
                        </Text>
                      </Flex>
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                        Atribuído em: {dayjs(voucher.assigned_at).format("YYYY-MM-DD HH:MM")}
                      </Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </>
        )}

        {selectedTab === "Usados" && (
          <>
            {paginatedVouchersUsados.length === 0 ? (
              <Center>
                <Text>Não tem vouchers usados.</Text>
              </Center>
            ) : (
              <Grid mb={"lg"}>
                {paginatedVouchersUsados.map((voucher, index) => (
                  <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6 }} key={index}>
                    <Card p="md" radius="md" className={classes.card}>
                      <Image src={voucher.image_url ?? "./Placeholder.svg"} alt={voucher.name} />
                      <Flex justify={'space-between'}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                          Total de Créditos: 0 €
                        </Text>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                          Balanço: 0 €
                        </Text>
                      </Flex>
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                        Ativado em: {dayjs(voucher.activated_at).format("YYYY-MM-DD HH:MM")}
                      </Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>
      {selectedTab === "Por usar" && vouchersPorUsar.length > elementsPerPage && (
        <Center mt={"lg"}>
          <Pagination total={Math.ceil(vouchersPorUsar.length / elementsPerPage)} onChange={handlePageChange} />
        </Center>
      )}
      {selectedTab === "Usados" && vouchersUsados.length > elementsPerPage && (
        <Center mt={"lg"}>
          <Pagination total={Math.ceil(vouchersUsados.length / elementsPerPage)} onChange={handlePageChange} />
        </Center>
      )}
    </div>
  );
}

export default VouchersPage;
