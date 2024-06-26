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
import { useDisclosure } from "@mantine/hooks";
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
} from "@tabler/icons-react";
import classes from "./HeaderMegaMenu.module.css";
import cx from "clsx";
import { useState, useEffect } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import Image from "next/image";
import { useCart } from "@/providers/CartProvider";
import { getConfig } from "@/services/dashboard.service";
import { notifications } from "@mantine/notifications";

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

export function HeaderMegaMenu() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useSession();
  const theme = useMantineTheme();
  const router = useRouter();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const { cart } = useCart();

  const [config, setConfig] = useState({ torneios: "", ligas: "" });

  useEffect(() => {
    getConfig()
      .then((configResponse) => {
        if (configResponse.status) {
          setConfig({
            torneios: configResponse.data.torneios || "",
            ligas: configResponse.data.ligas || "",
          });
        } else {
          notifications.show({
            title: "Erro",
            message: "Não foi possível carregar as configurações",
            color: "red",
          });
        }
      })
      .catch((error) => {
        notifications.show({
          title: "Erro",
          message: "Não foi possível carregar as configurações",
          color: "red",
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

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

  if (isLoading) {
    return <></>;
  }

  return (
    <Box pb={4} pt={10}>
      <header className={classes.header}>
        <Container className={classes.inner} size="md">
          <Group justify="space-between" h="100%" className={classes.groupfix}>
            <Flex align={"center"}>
              <Image
                src={computedColorScheme === "light" ? "/logos/logo-propadel-1.png" : "/logos/logo-propadel-2.png"}
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
              {config.torneios && config.torneios !== "" && (
                <a href="https://www.padelteams.pt/info/competition?k=Y2lkPTM3NTY%3D" target="_blank" className={classes.link}>
                  Torneios
                </a>
              )}
              {config.ligas && config.ligas !== "" && (
                <a href="#" target="_blank" className={classes.link}>
                  Ligas
                </a>
              )}
              <div className={classes.link} onClick={() => router.push(routes.offpeaks.url)}>
                Cartões
              </div>
              {/*     <div className={classes.link} onClick={() => router.push(routes.store.url)}>
                Loja
              </div> */}
            </Group>

            <Group visibleFrom="sm" gap={2}>
              {/* <div className={classes.shoppingcart} onClick={() => router.push(routes.cart.url)}>
                <IconShoppingCart size={20} />
                {cart && cart.length > 0 && (
                  <Badge size="xs" style={{ position: "absolute", top: "10px", right: "60px", height: "20px" }}>
                    {cart.length}
                  </Badge>
                )}
              </div> */}

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

      <Drawer className={classes.drawer} opened={drawerOpened} onClose={closeDrawer} size="100%" padding="md" hiddenFrom="sm" zIndex={1000000}>
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />
          <UnstyledButton className={classes.link} onClick={toggleLinks}>
            <Center inline>
              <Box component="span" mr={5}>
                Reservar
              </Box>
              <IconChevronDown style={{ width: rem(16), height: rem(16) }} color={theme.colors.blue[6]} />
            </Center>
          </UnstyledButton>
          <Collapse in={linksOpened}>{links}</Collapse>
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
            Cartões
          </div>
          {/*  <div className={classes.link} onClick={() => router.push(routes.store.url)}>
            Loja
          </div> */}
          {/*           <div className={classes.link}>Carrinho de compras</div>
           */}{" "}
          <Divider my="sm" />
          <Text c="dimmed" fw={500} p={"xs"} size="md" ml={2}>
            Configurações
          </Text>
          <div className={classes.link} onClick={() => router.push(routes.account.url)}>
            Configurações da conta
          </div>
          <Group justify="center" grow pb="xl" px="md" mt={"md"}>
            <Button variant="default" color="gray" leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />} onClick={logout}>
              Terminar sessão
            </Button>
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
