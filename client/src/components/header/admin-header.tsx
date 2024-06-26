import { HoverCard, Group, Button, UnstyledButton, Text, SimpleGrid, ThemeIcon, Anchor, Divider, Center, Box, Burger, Drawer, Collapse, ScrollArea, rem, useMantineTheme, Flex, Avatar, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSquareRoundedNumber1, IconSquareRoundedNumber2, IconChevronDown, IconSwitchHorizontal, IconLogout, IconShoppingCart, IconSettings, IconUser } from "@tabler/icons-react";
import classes from "./HeaderAdmin.module.css";
import cx from "clsx";
import { useState } from "react";
import Image from "next/image";

interface Props {
  opened: boolean;
  toggle: () => void;
}

export function AdminHeader(props: Props) {
  const { opened, toggle } = props;
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);

  const theme = useMantineTheme();

  return (
    <Box pb={4} pt={10}>
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          <Flex align={"center"}>
            <Image src="/logo-propadel-340x346-1.png" alt="Logo" width={80} height={72} className={classes.logo} />
          </Flex>

          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
        </Group>
      </header>
    </Box>
  );
}
