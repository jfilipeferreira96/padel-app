"use client";
import { routes } from "@/config/routes";
import { useSession } from "@/providers/SessionProvider";
import { Affix, Button, Group, useMantineColorScheme } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isReady } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(routes.home.url);
      return;
    } else {
      router.push(routes.signin.url);
      return;
    }
  }, [user]);

  return (
    <>
      <title>Pro Padel</title>
    </>
  );
}
