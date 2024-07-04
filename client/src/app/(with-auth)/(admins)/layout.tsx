"use client";
import { redirect, usePathname, useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";
import { useEffect } from "react";
import { routes } from "@/config/routes";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { AppShell, Burger } from "@mantine/core";
import { AdminHeader } from "@/components/header/admin-header";
import { NavbarSimpleColored } from "@/components/sidebar";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  //checking session
  const { user, isReady } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [opened, { open, close, toggle }] = useDisclosure();
  const isSmallScreen = useMediaQuery("(max-width: 768px)"); 
  
  useEffect(() => {
    if (!user?.id) {
      router.push(routes.signin.url);
    }

    if (user && user.user_type !== "admin") {
      router.push(routes.home.url);
    }
  }, [isReady]);

  if (!user?.id || user.user_type !== "admin") {
    return <></>;
  }

  return (
    <AppShell header={{ height: 70, collapsed: isSmallScreen ? false : true }} navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }} padding="md">
      <AppShell.Header>
        <AdminHeader opened={opened} toggle={toggle} />
      </AppShell.Header>
      <AppShell.Navbar>
        <NavbarSimpleColored close={close} />
      </AppShell.Navbar>
      <AppShell.Main mb={40}>{children}</AppShell.Main>
    </AppShell>
  );
}
