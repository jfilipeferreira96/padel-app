"use client";
import React, { useState, useEffect } from "react";
import { Text, Title, Center, Loader, Box, Image, rem, SegmentedControl, Card, Grid, Pagination, Flex, Badge } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import "@mantine/carousel/styles.css";
import { getUserVouchers } from "@/services/vouchers.service";
import dayjs from "dayjs";
import "dayjs/locale/pt";
import ModalTransactions from "@/components/user-modal/modal-transactions";
dayjs.locale("pt");

function VouchersPage() {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iconStyle = { width: rem(12), height: rem(12) };
  const [selectedTab, setSelectedTab] = useState<string>("Por usar");
  const [vouchers, setVouchers] = useState<
    {
      user_voucher_id: number;
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
      voucher_type: string;
      is_active: number;
    }[]
  >([]);
  const [page, setPage] = useState(1);
  const elementsPerPage = 4;
  
  const [opened, setOpened] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);

  const openTransactionModal = (user_voucher_id: number) => {
    setSelectedVoucherId(user_voucher_id);
    setOpened(true);
  };

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

  // Filtering vouchers based on their status
  const vouchersPorUsar = vouchers.filter((voucher) => !voucher.activated_at && voucher.voucher_type !== "credito");
  const vouchersUsados = vouchers.filter((voucher) => voucher.activated_at && voucher.voucher_type !== "credito");
  const vouchersCreditos = vouchers.filter((voucher) => voucher.voucher_type === "credito" && voucher.is_active == 1);

  // Paginate results
  const paginatedVouchersPorUsar = vouchersPorUsar.slice((page - 1) * elementsPerPage, page * elementsPerPage);
  const paginatedVouchersUsados = vouchersUsados.slice((page - 1) * elementsPerPage, page * elementsPerPage);
  const paginatedVouchersCreditos = vouchersCreditos.slice((page - 1) * elementsPerPage, page * elementsPerPage);

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  return (
    <div>
      <Title mt={15} className="productheader">
        Vouchers
      </Title>
      <SegmentedControl mt={10} radius="md" fullWidth value={selectedTab} onChange={setSelectedTab} data={["Por usar", "Usados", "Créditos"]} />
      <Box mt={20}>
        {/* Tab for "Por usar" vouchers */}
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
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                        Atribuído em: {dayjs(voucher.assigned_at).format("YYYY-MM-DD HH:mm")}
                      </Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* Tab for "Usados" vouchers */}
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
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                        Ativado em: {dayjs(voucher.activated_at).format("YYYY-MM-DD HH:mm")}
                      </Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* Tab for "Créditos" vouchers */}
        {selectedTab === "Créditos" && (
          <>
            {paginatedVouchersCreditos.length === 0 ? (
              <Center>
                <Text>Não tem créditos disponíveis.</Text>
              </Center>
            ) : (
              <Grid mb={"lg"}>
                  {paginatedVouchersCreditos.map((voucher, index) => (
                  <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6 }} key={index}>
                      <Card p="md" radius="md" className={classes.card} onClick={() => openTransactionModal(voucher.user_voucher_id)} style={{"cursor":"pointer"}}>
                      <Flex justify={"flex-end"}>
                        {voucher.activated_at ? <Badge color="green" variant="filled">Ativo</Badge> : <Badge color="gray" variant="filled">Por ativar</Badge>}
                      </Flex>
                      <Image src={"./vouchers/123.png"} alt={voucher.name} />
                      <Flex justify={"space-between"}>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                          Saldo: <Text span fw={700} c="green">{voucher.credit_balance} €</Text>
                        </Text>
                        <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                          Atribuído em: {dayjs(voucher.assigned_at).format("YYYY-MM-DD HH:mm")}
                        </Text>
                      </Flex>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>

      <ModalTransactions
        opened={opened}
        onClose={() => { setOpened(false); setSelectedVoucherId(null)}}
        user_voucher_id={selectedVoucherId ?? null}
      />

      {/* Pagination */}
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
      {selectedTab === "Créditos" && vouchersCreditos.length > elementsPerPage && (
        <Center mt={"lg"}>
          <Pagination total={Math.ceil(vouchersCreditos.length / elementsPerPage)} onChange={handlePageChange} />
        </Center>
      )}
    </div>
  );
}

export default VouchersPage;
