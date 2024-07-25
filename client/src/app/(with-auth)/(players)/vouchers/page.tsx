"use client";
import React, { useState, useEffect } from "react";
import { Text, Title, Center, Loader, UnstyledButton, Box, Image, rem, Tabs, SegmentedControl, AspectRatio, Card, SimpleGrid, Grid } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import "@mantine/carousel/styles.css";

function VouchersPage() {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iconStyle = { width: rem(12), height: rem(12) };
  const [selectedTab, setSelectedTab] = useState<string>('Por usar');
  const [vouchers, setVouchers] = useState<{ status: string; id: number }[]>([]);

  const fetchData = async () => {
    setIsLoading(true);

    try {
     
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    //fetchData();
  }, []);

/*   if (isLoading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  } */

  return (
    <div>
      <Title mt={15} className="productheader">
        Vouchers
      </Title>
      <SegmentedControl mt={10} radius="md" fullWidth value={selectedTab} onChange={setSelectedTab} data={["Por usar", "Usados"]} />
      <Box mt={20}>
        {/*  {vouchers.length === 0 && (
          <Center>
            <Text>Não tem nenhum voucher associado.</Text>
          </Center>
        )}
        {vouchers.length > 0 && selectedTab === "Por usar" && (
          <>
            <Text>Por usar</Text>
          </>
        )}

        {vouchers.length > 0 && selectedTab === "Usados" && (
          <>
            <Text>Por usar</Text>
          </>
        )} */}
        <Grid mb={"lg"}>
          <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6 }}>
            <Card p="md" radius="md" component="a" href="#" className={classes.card}>
              <>
                <Image src={"./vouchers/voucher_1hora_optimized_100.png" /* ?? "./Placeholder.svg" */} alt={"article.title"} />
              </>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700} mt="md">
                {"article.date"}
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6 }}>
            <Image src={"./vouchers/voucher_1hora_optimized_100.png" /* ?? "./Placeholder.svg" */} alt={"article.title"} />
          </Grid.Col>
        </Grid>
      </Box>
    </div>
  );
}

export default VouchersPage;
