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
import { MobileFooter } from "@/components/footer/mobile";
import 'dayjs/locale/pt'; // Importa a localidade do dayjs para PT-PT
import { DatesProvider } from '@mantine/dates'; // Importa o DatesProvider do Mantine

export default function AppLayout({ children }: { children: React.ReactNode })
{
  //checking session
  const { user, isReady } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [opened, { toggle }] = useDisclosure();
  const isMobile = useMediaQuery("(max-width: 481px)");

  useEffect(() => {
    if (!isReady) return;

    if (!user?.id && isReady) {
      router.push(routes.signin.url);
    }
    
  }, [user, isReady]);

  if (!user?.id) {
    return <></>;
  }

  return (
    <DatesProvider settings={{ locale: 'pt' }}>
      <AppShell header={{ height: 70 }} padding="md">
        <AppShell.Header>
          <HeaderMegaMenu />
        </AppShell.Header>
        <>
          <Container size={"md"} mt={100} mih={isMobile ? 670 : 800} mb={isMobile ? 100 : 0}>
            {children}
          </Container>
        </>
        {isMobile ? <MobileFooter /> : <FooterSocial />}
      </AppShell>
    </DatesProvider>
  );
}
