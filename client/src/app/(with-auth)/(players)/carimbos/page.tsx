"use client";
import React, { useState, useRef, useEffect } from "react";
import { Title, Text,  Center, SimpleGrid, Image, Card, Loader } from "@mantine/core";
import { useSession } from "@/providers/SessionProvider";
import Carimbos from "@/components/carimbos";

function CarimbosPage() {
  const { user } = useSession();
  
  if (!user) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <>
      <Title mt={15} className="productheader">
        Carimbos
      </Title>
      <Carimbos userId={user?.id as number} />
    </>
  );
}

export default CarimbosPage;
