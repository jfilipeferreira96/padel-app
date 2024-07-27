"use client";
import React, { useState, useEffect } from "react";
import { Text, Title, Center, Loader, Box, Image, rem, SegmentedControl, Card, Grid } from "@mantine/core";
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
    }[]
  >([]);

  const fetchData = async () => {
    setIsLoading(true);
    if (!user) return;

    try {
      const response = await getUserVouchers(user.id);
      console.log(response);
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
    fetchData();
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

  return (
    <div>
      <Title mt={15} className="productheader">
        Vouchers
      </Title>
      <SegmentedControl mt={10} radius="md" fullWidth value={selectedTab} onChange={setSelectedTab} data={["Por usar", "Usados"]} />
      <Box mt={20}>
        {vouchers.length === 0 && (
          <Center>
            <Text>Não tem nenhum voucher associado.</Text>
          </Center>
        )}
        {selectedTab === "Por usar" && (
          <>
            {vouchersPorUsar.length === 0 ? (
              <Center>
                <Text>Não tem vouchers por usar.</Text>
              </Center>
            ) : (
              <Grid mb={"lg"}>
                {vouchersPorUsar.map((voucher) => (
                  <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6 }} key={voucher.voucher_id}>
                    <Card p="md" radius="md" className={classes.card}>
                      <Image src={voucher.image_url ?? "./Placeholder.svg"} alt={voucher.name} />
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                        Atribuído em: {dayjs(voucher.assigned_at).format("YYYY-MM-DD hh:mm")}
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
            {vouchersUsados.length === 0 ? (
              <Center>
                <Text>Não tem vouchers usados.</Text>
              </Center>
            ) : (
              <Grid mb={"lg"}>
                {vouchersUsados.map((voucher) => (
                  <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6 }} key={voucher.voucher_id}>
                    <Card p="md" radius="md" className={classes.card}>
                      <Image src={voucher.image_url ?? "./Placeholder.svg"} alt={voucher.name} />
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                        Ativado em: {dayjs(voucher.activated_at).format("YYYY-MM-DD hh:mm")}
                      </Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>
    </div>
  );
}

export default VouchersPage;
