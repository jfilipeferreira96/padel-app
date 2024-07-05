import { Container, Group, ActionIcon, rem, Flex, useComputedColorScheme,} from "@mantine/core";
import { IconBrandInstagram, IconBrandFacebook } from "@tabler/icons-react";
import classes from "./FooterSocial.module.css";
import Image from "next/image";

export function FooterSocial() {
    const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });

  return (
    <div className={classes.footer}>
      <Container className={classes.inner} size="md">
        <Flex align={"center"}>
          <Image src={computedColorScheme === "light" ? "/logos/logo-propadel-1.png" : "/logos/logo-propadel-2.png"} alt="Logo" width={100} height={80} />
        </Flex>
        <Group gap={0} className={classes.links} justify="flex-end" wrap="nowrap">
          <a href="https://www.facebook.com/propadel.sports/" target="_blank" rel="noopener noreferrer">
            <ActionIcon size="lg" variant="subtle" color="gray" style={{ cursor: "pointer" }}>
              <IconBrandFacebook style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
            </ActionIcon>
          </a>
          <a href="https://www.instagram.com/propadel_sports/" target="_blank" rel="noopener noreferrer">
            <ActionIcon size="lg" variant="subtle" color="gray" style={{ cursor: "pointer" }}>
              <IconBrandInstagram style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
            </ActionIcon>
          </a>
        </Group>
      </Container>
    </div>
  );
}
