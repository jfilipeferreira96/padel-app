import { rem, Flex, useComputedColorScheme, Tooltip, Menu, Group, HoverCard, Center, Text, Divider, SimpleGrid, Box, Button, UnstyledButton, ThemeIcon, useMantineTheme } from "@mantine/core";
import {  IconCards, IconTournament, IconCalendarTime, IconHome, IconChevronDown, IconSquareRoundedNumber1, IconSquareRoundedNumber2 } from "@tabler/icons-react";
import classes from "./MobileFooter.module.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { IconTrophy } from "@tabler/icons-react";
import { useSession } from "@/providers/SessionProvider";

const mockdata = [
  {
    icon: IconSquareRoundedNumber1,
    title: "Pro Padel - Mozelos",
    description: "R. Ronocar 49 fração B, 4535-367 Mozelos",
    href: "https://playtomic.io/propadel/218f0732-34ed-48c1-a6bc-0d4edad92da8",
  },
  {
    icon: IconSquareRoundedNumber2,
    title: "Pro Padel - Lamas",
    description: "Brevemente",
    href: "https://playtomic.io/propadel/218f0732-34ed-48c1-a6bc-0d4edad92da8",
  },
];

interface NavbarLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?(): void;
  hide?: boolean;
  isReservar?: boolean
}

function NavbarLink({ icon, label, active, onClick, hide, isReservar }: NavbarLinkProps) {
  const theme = useMantineTheme();

  if (hide) return;

  if (isReservar) {
    return (
      <>
        <HoverCard position="bottom" radius="md" shadow="md" withinPortal closeOnClickOutside closeOnEscape>
          <HoverCard.Target>
            <div onClick={onClick} className={classes.reservar}>
              {icon}
              <div className={classes.text}>{label}</div>
            </div>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Group justify="space-between" px="md">
              <Text fw={500}>Faça agora a sua reserva</Text>
            </Group>

            <Divider my="sm" />

            <SimpleGrid cols={1} spacing={15}>
              {mockdata.map((item) => (
                <UnstyledButton className={classes.subLink} key={item.title} onClick={() => window.open(item.href, "_blank")}>
                  <Group wrap="nowrap" align="flex-start">
                    <ThemeIcon size={34} variant="default" radius="md">
                      <item.icon style={{ width: rem(22), height: rem(22) }} color={theme.colors.blue[6]} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={500}>
                        {item.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.description}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              ))}
            </SimpleGrid>
          </HoverCard.Dropdown>
        </HoverCard>
      </>
    );
  }
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
  const { config } = useSession();

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
      onClick: () => { },
      isReservar: true
    },
    {
      icon: <IconTournament style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Torneios",
      onClick: () => window.open("http://www.google.pt", "_blank"),
      hide: config.torneios ? true : false,
    },
    {
      icon: <IconTrophy style={{ width: "100%", height: rem(25) }} stroke={1.5} />,
      label: "Ligas",
      onClick: () => window.open("http://www.google.pt", "_blank"),
      hide: config.ligas ? true : false,
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
    if (!["Torneios", "Ligas", "Reservar"].includes(data[index].label)) {
      setActive(index);
    }
    if (data[index].url) {
      router.push(data[index].url as string);
    } else {
      data[index]?.onClick();
    }
  };

  const links = data.map((link, index) => {
    return <NavbarLink {...link} key={link.label} active={index === active} onClick={() => handleNavClick(index)} />;
  });

  if (config.isReady === false) {
    return <></>;
  }

  return (
    <div className={classes.footer}>
      <Flex gap="md" justify="space-around" align="space-around" direction="row">
        {links}
      </Flex>
    </div>
  );
}
