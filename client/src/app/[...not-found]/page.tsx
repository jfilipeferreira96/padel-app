"use client";
import { Title, Text, Button, Container, Group } from "@mantine/core";
import classes from "./classes.module.css";
import Link from "next/link";
import { routes } from "@/config/routes";
import { useSession } from "@/providers/SessionProvider";

export default function NotFound() {
  const { user } = useSession();

  return (
    <div className={classes.root}>
      <Container my={100}>
        <div className={classes.label}>404</div>
        <Title className={classes.title}>Nada para ver aqui</Title>
        <Text size="lg" ta="center" className={classes.description}>
          Infelizmente, esta é apenas uma página 404. Pode ter digitado o endereço incorretamente ou a página foi movida para outro URL.
        </Text>
        <Group justify="center">
          <Link href={user?._id ? routes.home.url : routes.signin.url}>
            <Button variant="white" size="md">
              Leve-me de volta para a página inicial
            </Button>
          </Link>
        </Group>
      </Container>
    </div>
  );
}
