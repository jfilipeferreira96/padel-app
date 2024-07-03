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
  const [active, setActive] = useState<number>(0);
  const pathname = usePathname();
  const router = useRouter();

  const data = [
    {
      icon: <IconHome style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Início",
      url: routes.home.url,
      /* action: () => {
        router.push(routes.home.url);
        closeDrawer();
      }, */
    },
    {
      icon: <IconCalendarTime style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Reservar",
      url: "#",
      //action: () => toggleLinks(),
    },
    {
      icon: <IconTournament style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Torneios",
      //url: config.torneios,
      //action: () => window.open(config.torneios, "_blank"),
    },
    {
      icon: <IconTrophy style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Ligas",
      //url: config.ligas,
      //action: () => window.open(config.ligas, "_blank"),
    },
    {
      icon: <IconCards style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Off Peak",
      url: routes.offpeaks.url,
      /* action: () => {
        router.push(routes.offpeaks.url);
        closeDrawer();
      }, */
    },
  ];

  useEffect(() => {
    const activeIndex = data.findIndex((item) => {
      if (item.url) {
        return pathname.includes(item.url);
      }
      return false;
    });

    if (activeIndex !== -1) {
      setActive(activeIndex);
    }
  }, [pathname]);

  const links = data.map((link, index) => {
    return <NavbarLink {...link} key={link.label} active={index === active} onClick={() => handleNavClick(index)} />;
  });

  const handleNavClick = (index: number) => {
    setActive(index);
    //router.push(`${routes.challenge.url}/${getId(pathname)}/${data[index].url}`);
  };

  return (
    <div className={classes.footer}>
      <Flex gap="md" justify="space-around" align="space-around" direction="row">
        {links}
      </Flex>
    </div>
  );
}
