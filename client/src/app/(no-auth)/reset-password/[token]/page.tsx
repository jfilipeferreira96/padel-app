"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, zodResolver } from "@mantine/form";
import { Container, Title, Text, Paper, TextInput, Button, Group, Center, Flex, Loader, useComputedColorScheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { z } from "zod";
import styled from "styled-components";
import { checkToken, resetPassword } from "@/services/auth.service"; // Certifique-se de ter esses serviços configurados
import Image from "next/image";
import { routes } from "@/config/routes";

const StyledPaper = styled(Paper)`
  width: 500px;
  @media (max-width: 600px) {
    width: 94vw;
  }
`;

const schema = z.object({
  newPassword: z.string().min(8, { message: "A nova palavra-passe deve ter pelo menos 8 caracteres" }),
});

export default function ResetPasswordPage({ params: { token } }: { params: { token: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });

  const form = useForm<{ newPassword: string }>({
    initialValues: {
      newPassword: "",
    },
    validate: zodResolver(schema),
  });

  const checkTokenValidity = useCallback(async () => {
    if (!token) {
      notifications.show({
        title: "Erro",
        message: "Token não fornecido",
        color: "red",
      });

      router.push(routes.signin.url)
      return;
    }

    try {
      const response = await checkToken(token);
      if (response.status) {
        setTokenValid(true);
      } else {
        notifications.show({
          title: "Erro",
          message: "Token inválido",
          color: "red",
        });

        router.push(routes.signin.url)
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Erro",
        color: "red",
      });
      
      router.push(routes.signin.url)

    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  const onSubmitHandler = useCallback(
    async (data: { newPassword: string }) => {
      if (!token) {
        notifications.show({
          title: "Erro",
          message: "Token não encontrado.",
          color: "red",
        });
        return;
      }

      setIsLoading(true);
      try {
        const response = await resetPassword({ token, newPassword: data.newPassword });

        if (response.status) {
          notifications.show({
            title: "Sucesso",
            message: "Palavra-passe redefinida com sucesso.",
            color: "green",
          });

          setTimeout(() => {
            router.push(routes.signin.url); 
          }, 4000);
          
        } else {
          notifications.show({
            message: response.message,
            color: "red",
          });
        }
      } catch (error) {
        notifications.show({
          title: "Erro",
          message: "Algo correu mal",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [token, router]
  );

  if (isLoading || tokenValid === false) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <Container>
      <Center>
        <title>Redefinir Palavra-passe</title>

        <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
          <Flex align={"center"} justify={"center"} mt={100}>
            <Image src={computedColorScheme === "light" ? "/logos/logo-propadel-1.svg" : "/logos/logo-propadel-2.svg"} alt="Logo" width={120} height={90} />
          </Flex>

          <Title ta="center" size="h2" className="specialheader">
            Redefinir Palavra-passe
          </Title>

          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Introduza a nova palavra-passe abaixo.
          </Text>

          <StyledPaper withBorder shadow="md" p={30} mt={30} radius="md">
            <TextInput className="specialinput" label="Nova Palavra-passe" placeholder="Nova Palavra-passe" required type="password" {...form.getInputProps("newPassword")} />

            <Button fullWidth type="submit" disabled={isLoading} mt="md">
              Redefinir Palavra-passe
            </Button>
          </StyledPaper>
        </form>
      </Center>
    </Container>
  );
}
