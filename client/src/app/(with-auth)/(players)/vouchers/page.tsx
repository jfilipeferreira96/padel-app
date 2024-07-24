"use client";
import React, { useState, useEffect } from "react";
import { Text, Title, Center, Loader, UnstyledButton, Box, Image, rem, Tabs } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import "@mantine/carousel/styles.css";
import { IconPhoto, IconMessageCircle, IconSettings } from "@tabler/icons-react";

function VouchersPage() {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
    const iconStyle = { width: rem(12), height: rem(12) };


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
      <Tabs defaultValue="gallery">
        <Tabs.List>
          <Tabs.Tab value="gallery" leftSection={<IconPhoto style={iconStyle} />}>
            Gallery
          </Tabs.Tab>
          <Tabs.Tab value="messages" leftSection={<IconMessageCircle style={iconStyle} />}>
            Messages
          </Tabs.Tab>

        </Tabs.List>

        <Tabs.Panel value="gallery">Gallery tab content</Tabs.Panel>

        <Tabs.Panel value="messages">Messages tab content</Tabs.Panel>

      </Tabs>
      <Title mt={15} className="productheader">
        Vouchers - Por 
      </Title>
      <Box mt={20}></Box>
    </div>
  );
}

export default VouchersPage;
