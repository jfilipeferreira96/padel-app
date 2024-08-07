"use client";
import { login, LoginData } from "@/services/auth.service";
import { TextInput, PasswordInput, Checkbox, Anchor, Paper, Title, Text, Container, Group, Button, Center, Flex, useComputedColorScheme, UnstyledButton } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { notifications } from "@mantine/notifications";
import { routes } from "@/config/routes";
import styled from "styled-components";
import { useSession } from "@/providers/SessionProvider";
import { z } from "zod";
import Image from "next/image";

const StyledPaper = styled(Paper)`
  width: 500px;
  @media (max-width: 600px) {
    width: 94vw;
  }
`;

const schema = z.object({
  email: z.string().email({ message: "Endereço de email inválido" }),
  password: z.string().min(4, { message: "A palavra-passe deve ter pelo menos 4 caracteres" }),
});

export default function IniciarSessao() {
  const { sessionLogin } = useSession();
  const router = useRouter();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmitHandler = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await login(data);

      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "",
          color: "green",
        });
        sessionLogin(response.user, response.accessToken, response.refreshToken);
      }
      else {
        notifications.show({
          message: response.message,
          color: "red",
        });
      }
    }
    catch (error){
      notifications.show({
        title: "Erro",
        message: "Algo correu mal",
        color: "red",
      });
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  const form = useForm<LoginData>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: zodResolver(schema),
  });

  return (
    <Center>
      <title>Iniciar Sessão</title>

      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <Flex align={"center"} justify={"center"} mt={100}>
          <Image src={computedColorScheme === "light" ? "/logos/logo-propadel-1.svg" : "/logos/logo-propadel-2.svg"} alt="Logo" width={120} height={90} />
        </Flex>

        <Title ta="center" size="h1" className="specialheader">
          Bem-vindo!
        </Title>

        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Ainda não tem uma conta?
          <UnstyledButton size="sm" onClick={() => router.push(routes.register.url)} className="logbtn">
            Criar conta
          </UnstyledButton>
        </Text>

        <StyledPaper withBorder shadow="md" p={30} mt={30} radius="md">
          <TextInput className="specialinput" label="Email" placeholder="you@gmail.com" required {...form.getInputProps("email")} />
          <PasswordInput className="specialinput" label="Palavra-passe" placeholder="A sua palavra-passe" required mt="md" {...form.getInputProps("password")} />
          <Group justify={"flex-end"} mt="sm" mb={"sm"}>
            <Text style={{ cursor: "pointer" }} component="a" size="sm" c="dimmed" onClick={() => router.push(routes.forgotpassword.url)}>
              Esqueceu-se da palavra-passe?
            </Text>
          </Group>
          <Button fullWidth type="submit" disabled={isLoading}>
            Iniciar sessão
          </Button>
        </StyledPaper>
      </form>
    </Center>
  );
}
