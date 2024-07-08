import {
  HoverCard,
  Group,
  Button,
  UnstyledButton,
  Text,
  SimpleGrid,
  ThemeIcon,
  Anchor,
  Divider,
  Center,
  Box,
  Burger,
  Drawer,
  Collapse,
  ScrollArea,
  rem,
  useMantineTheme,
  Flex,
  Avatar,
  Menu,
  Container,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Badge,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  IconSquareRoundedNumber1,
  IconSquareRoundedNumber2,
  IconChevronDown,
  IconSwitchHorizontal,
  IconLogout,
  IconShoppingCart,
  IconSettings,
  IconUser,
  IconLayoutDashboard,
  IconSun,
  IconMoon,
  IconCalendarTime,
  IconTrophy,
  IconTournament,
  IconGiftCard,
  IconCards,
  IconHome,
  IconQrcode,
  IconSticker,
  IconX,
} from "@tabler/icons-react";
import classes from "./HeaderMegaMenu.module.css";
import cx from "clsx";
import { useState, useEffect } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import Image from "next/image";
import { useCart } from "@/providers/CartProvider";

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
    description: "Travessa da Salgueirinha, Nº 64, 4535-416 St. M. de Lamas",
    href: "https://playtomic.io/propadel-smlamas/5bd70b05-a3a3-4bab-9cd1-a6e4bdc046e7",
  },
];

export function HeaderMegaMenu() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const { user, logout, config } = useSession();
  const theme = useMantineTheme();
  const router = useRouter();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const { cart } = useCart();
  const isMobile = useMediaQuery("(max-width: 481px)");


  const links = mockdata.map((item) => (
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
  ));

  if (config.isReady === false) {
    return <></>;
  }

  return (
    <Box pb={4} pt={10}>
      <header className={classes.header}>
        <Container className={classes.inner} size="md">
          <Group justify="space-between" h="100%" className={classes.groupfix}>
            <Flex align={"center"}>
              <Image
                src={computedColorScheme === "light" ? "/logos/logo-propadel-1.svg" : "/logos/logo-propadel-2.svg"}
                alt="Logo"
                width={80}
                height={60}
                className={classes.logo}
                onClick={() => router.push(routes.home.url)}
              />
            </Flex>
            <Group h="100%" gap={0} visibleFrom="sm">
              <HoverCard width={600} position="bottom" radius="md" shadow="md" withinPortal>
                <HoverCard.Target>
                  <a href="#" className={classes.link}>
                    <Center inline>
                      <Box component="span" mr={5}>
                        Reservar
                      </Box>
                      <IconChevronDown style={{ width: rem(16), height: rem(16) }} color={theme.colors.blue[6]} />
                    </Center>
                  </a>
                </HoverCard.Target>

                <HoverCard.Dropdown style={{ overflow: "hidden" }}>
                  <Group justify="space-between" px="md">
                    <Text fw={500}>Faça agora a sua reserva</Text>
                  </Group>

                  <Divider my="sm" />

                  <SimpleGrid cols={2} spacing={0}>
                    {links}
                  </SimpleGrid>
                </HoverCard.Dropdown>
              </HoverCard>

              <div className={classes.link} onClick={() => router.push(routes.qrcode.url)}>
                QR Code
              </div>
              <div className={classes.link} onClick={() => router.push(routes.carimbos.url)}>
                Carimbos
              </div>
              {config.torneios && config.torneios !== "" && (
                <a href={config.torneios} target="_blank" className={classes.link}>
                  Torneios
                </a>
              )}
              {config.ligas && config.ligas !== "" && (
                <a href={config.ligas} target="_blank" className={classes.link}>
                  Ligas
                </a>
              )}
              <div className={classes.link} onClick={() => router.push(routes.offpeaks.url)}>
                Cartões Off Peak
              </div>
            </Group>

            <Group visibleFrom="sm" gap={2}>
              <Menu width={260} position="bottom-end" transitionProps={{ transition: "pop-top-right" }} onClose={() => setUserMenuOpened(false)} onOpen={() => setUserMenuOpened(true)} withinPortal>
                <Menu.Target>
                  <UnstyledButton className={cx(classes.user, { [classes.userActive]: userMenuOpened })}>
                    <Group gap={7}>
                      <IconUser size={20} />
                      <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  {user && user.user_type === "admin" && (
                    <>
                      <Menu.Label>Aplicação</Menu.Label>
                      <Menu.Item leftSection={<IconLayoutDashboard style={{ width: rem(16), height: rem(16) }} />} onClick={() => router.push(routes.dashboard.url)}>
                        Dashboard
                      </Menu.Item>
                      <Menu.Divider />
                    </>
                  )}

                  <Menu.Label>Configurações</Menu.Label>

                  <Menu.Item
                    leftSection={computedColorScheme === "light" ? <IconMoon style={{ width: rem(16), height: rem(16) }} stroke={1.5} /> : <IconSun style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
                    onClick={() => setColorScheme(computedColorScheme === "light" ? "dark" : "light")}
                  >
                    {computedColorScheme === "light" ? "Modo noturno" : "Modo diurno"}
                  </Menu.Item>
                  <Menu.Item leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} stroke={1.5} />} onClick={() => router.push(routes.account.url)}>
                    Configurações da conta
                  </Menu.Item>
                  <Menu.Item leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />} onClick={logout}>
                    Terminar sessão
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
          </Group>
        </Container>
      </header>

      <Drawer className={classes.drawer}
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%" padding="md"
        hiddenFrom="sm"
        zIndex={1000000}
        closeButtonProps={{
          icon: <IconX size={30} stroke={1.5} color="light-dark(var(--mantine-color-black), var(--mantine-color-white))" />
        }}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />

          <div
            className={classes.link}
            onClick={() => {
              router.push(routes.home.url), closeDrawer();
            }}
          >
            <IconHome style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} /> Início
          </div>

          <UnstyledButton className={classes.link} onClick={toggleLinks}>
            <Center inline>
              <IconCalendarTime style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} /> Reservar
              <IconChevronDown style={{ width: rem(16), height: rem(16), marginLeft: "5px" }} color={theme.colors.blue[6]} />
            </Center>
          </UnstyledButton>
          <Collapse in={linksOpened}>{links}</Collapse>

          <div
            className={classes.link}
            onClick={() => {
              router.push(routes.qrcode.url), closeDrawer();
            }}
          >
            <IconQrcode style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} /> QR Code
          </div>
          <div
            className={classes.link}
            onClick={() => {
              router.push(routes.carimbos.url), closeDrawer();
            }}
          >
            <IconSticker style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} /> Carimbos
          </div>

          {config.torneios && config.torneios !== "" && (
            <div /* onClick={() => closeDrawer()} */>
              <a href={config.torneios} target="_blank" className={classes.link}>
                <IconTournament style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} /> Torneios
              </a>
            </div>
          )}
          {config.ligas && config.ligas !== "" && (
            <div /* onClick={() => closeDrawer()} */>
              <a href={config.ligas} target="_blank" className={classes.link}>
                <IconTrophy style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} /> Ligas
              </a>
            </div>
          )}
          <div
            className={classes.link}
            onClick={() => {
              router.push(routes.offpeaks.url), closeDrawer();
            }}
          >
            <IconCards style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} /> Cartões Off Peak
          </div>

          <Divider my="sm" />

          {user && user.user_type === "admin" && (
            <>
              <Text c="dimmed" fw={500} p={"xs"} size="md" ml={2}>
                Aplicação
              </Text>
              <div
                className={classes.link}
                onClick={() => {
                  router.push(routes.dashboard.url), closeDrawer();
                }}
              >
                <IconLayoutDashboard style={{ width: rem(30), height: rem(25), marginRight: "8px" }} /> Dashboard
              </div>
            </>
          )}

          <Text c="dimmed" fw={500} p={"xs"} size="md" ml={2}>
            Configurações
          </Text>
          <div
            className={classes.link}
            onClick={() => {
              setColorScheme(computedColorScheme === "light" ? "dark" : "light");
            }}
          >
            <Flex>
              {computedColorScheme === "light" ? (
                <>
                  <IconMoon style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} /> Modo noturno
                </>
              ) : (
                <>
                  <IconSun style={{ width: rem(30), height: rem(25), marginRight: "8px" }} stroke={1.5} />
                  Modo diurno
                </>
              )}
            </Flex>
          </div>
          <div
            className={classes.link}
            onClick={() => {
              router.push(routes.account.url), closeDrawer();
            }}
          >
            <IconSettings style={{ width: rem(30), height: rem(25), marginRight: "8px" }} /> Configurações da conta
          </div>
          <Group justify="center" grow pb="xl" px="md" mt={"md"}>
            <Button variant="default" color="gray" leftSection={<IconLogout style={{ width: rem(30), height: rem(25) }} stroke={1.5} />} onClick={logout}>
              Terminar sessão
            </Button>
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
