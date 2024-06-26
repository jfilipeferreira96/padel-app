"use client";
import { redirect, usePathname, useRouter } from "next/navigation";
import { Box, Container, rem } from "@mantine/core";
import { useSession } from "@/providers/SessionProvider";
import { useEffect } from "react";
import { routes } from "@/config/routes";
import styled from "styled-components";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { AppShell, Burger, Group, Skeleton } from "@mantine/core";
import { HeaderMegaMenu } from "@/components/header";
import { FooterSocial } from "@/components/footer";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  //checking session
  const { user, isReady } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [opened, { toggle }] = useDisclosure();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!user?.id && isReady) {
      router.push(routes.signin.url)
    }
  }, [isReady])

  if (!user?.id) {
    return <></>;
  }

  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppShell.Header>
        <HeaderMegaMenu />
      </AppShell.Header>
      <>
        <Container size={"md"} mt={100} mih={760}>
          {children}
        </Container>
      </>
      <FooterSocial />
    </AppShell>
  );
}
