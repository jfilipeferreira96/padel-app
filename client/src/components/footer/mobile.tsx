import { Container, Group, ActionIcon, rem, Flex, useComputedColorScheme, Tooltip } from "@mantine/core";
import { IconBrandTwitter, IconBrandYoutube, IconBrandInstagram, IconCards, IconTournament, IconCalendarTime, IconHome, IconUser } from "@tabler/icons-react";
import classes from "./MobileFooter.module.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { IconTrophy } from "@tabler/icons-react";
import { IconChevronDown } from "@tabler/icons-react";

interface NavbarLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?(): void;
}

function NavbarLink({ icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="top" transitionProps={{ duration: 0 }}>
      <div onClick={onClick} data-active={active || undefined} className={active ? classes.linkSelected : classes.link}>
        {icon}
        <div className={classes.text}>{label}</div>
      </div>
    </Tooltip>
  );
}

export function MobileFooter() {
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const [active, setActive] = useState<number>(-1); // Inicializado como -1 para nenhum item ativo
  const pathname = usePathname();
  const router = useRouter();

  const data = [
    {
      icon: <IconHome style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Início",
      url: routes.home.url,
      onClick: () => {
        router.push(routes.home.url);
      },
    },
    {
      icon: <IconCalendarTime style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Reservar",
      url: "#",
      onClick: () => {
        // abrir div
      },
    },
    {
      icon: <IconTournament style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Torneios",
      onClick: () => window.open("http://www.google.pt", "_blank"),
    },
    {
      icon: <IconTrophy style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Ligas",
      onClick: () => window.open("http://www.google.pt", "_blank"),
    },
    {
      icon: <IconCards style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Off Peak",
      url: routes.offpeaks.url,
      onClick: () => {
        router.push(routes.offpeaks.url);
      },
    },
  ];

  useEffect(() => {
    const activeIndex = data.findIndex((item) => {
      if (item.url && !["Torneios", "Ligas"].includes(item.label)) {
        return pathname.includes(item.url);
      }
      return false;
    });

    if (activeIndex !== -1) {
      setActive(activeIndex);
    } else {
      setActive(-1); // Define como -1 se nenhum item do array data corresponde ao pathname atual
    }
  }, [pathname]);

  const handleNavClick = (index: number) => {
    if (!["Torneios", "Ligas"].includes(data[index].label)) {
      setActive(index);
    }
    if (data[index].url) {
      router.push(data[index].url);
    } else {
      data[index].onClick();
    }
  };

  const links = data.map((link, index) => {
    return <NavbarLink {...link} key={link.label} active={index === active} onClick={() => handleNavClick(index)} />;
  });

  return (
    <div className={classes.footer}>
      <Flex gap="md" justify="space-around" align="space-around" direction="row">
        {links}
      </Flex>
    </div>
  );
}
