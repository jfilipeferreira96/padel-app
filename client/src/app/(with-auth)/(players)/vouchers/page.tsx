"use client";
import React, { useState, useEffect } from "react";
import { Text, Title, Center, Loader, UnstyledButton, Box, Image, rem, Tabs, SegmentedControl } from "@mantine/core";
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
      <SegmentedControl
        mt={10}
        radius="md"
        fullWidth
        value={selectedTab}
        onChange={setSelectedTab}
        data={['Por usar', 'Usados']}
      />
      <Box mt={20}>
        {vouchers.length === 0 && <Text>Nenhum voucher encontrado</Text>}
        {vouchers.length > 0 && selectedTab === 'Por usar' &&
          <>
          <Text>Por usar</Text>
          </>
        }

        {vouchers.length > 0 && selectedTab === 'Usados' &&
          <>
            <Text>Por usar</Text>
          </>
        }
      </Box>
    </div>
  );
}

export default VouchersPage;
