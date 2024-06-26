"use client";
import { usePathname, useRouter } from "next/navigation";
import { Container } from "@mantine/core";
import { useSession } from "@/providers/SessionProvider";
import { routes } from "@/config/routes";
import { useEffect, useState } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  //checking session
  const { user } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "success">("loading");

  useEffect(() => {
    if (user && (pathname === routes.register.url || pathname === routes.signin.url)) {
      router.push(routes.home.url);
      return;
    }
    if (!user || pathname === routes.landingpage.url) {
      setState("success");
      return;
    }
  }, [user]);

  if (state === "loading") {
    return <></>;
  }

  return (
    <>
      {children}
    </>
  );
}
