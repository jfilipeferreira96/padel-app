import { useEffect, useState } from "react";
import { Group, Code, Text, Select, Modal, Button } from "@mantine/core";
import { IconFingerprint, IconLicense, IconShoppingCart, IconUser, IconSettings, IconSwitchHorizontal, IconLogout, IconHome, IconBrandProducthunt, IconCards, IconNews, IconGift } from "@tabler/icons-react";
import classes from "./NavbarSimpleColored.module.css";
import { useSession } from "@/providers/SessionProvider";
import { useLocation } from "@/providers/LocationProvider";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/config/routes";

const data = [
  { label: "Validações de Entradas", icon: IconFingerprint, url: routes.dashboard.validations },
  { label: "Registo de Entradas", icon: IconLicense, url: routes.dashboard.entries },
  { label: "Cartões Off Peak", icon: IconCards, url: routes.dashboard.offpeak },
  { label: "Vouchers", icon: IconGift, url: routes.dashboard.vouchers },
  { label: "Noticias", icon: IconNews, url: routes.dashboard.articles },
  /*   { label: "Vendas", icon: IconShoppingCart, url: routes.dashboard.orders }, */
  { label: "Utilizadores do Sistema", icon: IconUser, url: routes.dashboard.users },
  { label: "Outras Configurações", icon: IconSettings, url: routes.dashboard.configurations },
];

interface Props {
  close: () => void;
}

export function NavbarSimpleColored(props: Props) {
  const { close: closeNavbar } = props;
  const { logout } = useSession();
  const { location, setLocation, availableLocations } = useLocation();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedLocation, setSelectedLocation] = useState(location);
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
 
  const links = data.map((item, index) => (
    <div
      className={classes.link}
      data-active={index === active || undefined}
      key={item.label}
      onClick={() => {
        if (isMobile) {
          closeNavbar(); 
        }
        setActive(index);
        router.push(item.url);
      }}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </div>
  ));

  const handleLocationChange = (value: string | null) => {
    const location = availableLocations.find((loc) => loc.label === value);
    if (location) {
      setSelectedLocation(location);
    }
  };

  const handleSave = () => {
    if (selectedLocation) {
      setLocation(selectedLocation);
    }
    close();
  };

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

  return (
    <>
      <Modal opened={opened} onClose={close} title="Mudar de localização" centered>
        <Select
          className="specialinput"
          label="Localizações disponíveis"
          placeholder="Selecione uma localização"
          data={availableLocations.map((loc) => loc.label)}
          defaultValue={location?.label}
          onChange={handleLocationChange}
        />
        <Button fullWidth mt="sm" onClick={handleSave}>
          Guardar
        </Button>
      </Modal>
    
      <nav className={classes.navbar}>
        <Group className={classes.header} justify="space-between">
          <Text fw={700} size="sm" className={classes.title}>
            Localização:
          </Text>
          <Code fw={700} className={classes.version}>
            {location?.label}
          </Code>
        </Group>
        <div className={classes.navbarMain}>{links}</div>

        <div className={classes.footer}>
          <div className={classes.link} onClick={() => router.push(routes.home.url)}>
            <IconHome className={classes.linkIcon} stroke={1.5} />
            <span>Sair do Dashboard</span>
          </div>

          <div className={classes.link} onClick={open}>
            <IconSwitchHorizontal className={classes.linkIcon} stroke={1.5} />
            <span>Mudar de localização</span>
          </div>

          <div className={classes.link} onClick={logout}>
            <IconLogout className={classes.linkIcon} stroke={1.5} />
            <span>Terminar sessão</span>
          </div>
        </div>
      </nav>
    </>
  );
}
