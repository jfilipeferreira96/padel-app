"use client";
import { routes } from "@/config/routes";
import { useSession } from "@/providers/SessionProvider";
import { register, RegisterData, UserType } from "@/services/auth.service";
import { TextInput, PasswordInput, Anchor, Paper, Title, Text, Container, Group, Button, Input, Center, Radio, CheckIcon, CheckboxGroup, Flex, useComputedColorScheme, UnstyledButton } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { z } from "zod";
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import Image from "next/image";

const StyledPaper = styled(Paper)`
  width: 500px;
  @media (max-width: 600px) {
    width: 94vw;
  }
`;

const schema = z.object({
  first_name: z.string().min(1, { message: "O primeiro nome é obrigatório" }),
  last_name: z.string().min(1, { message: "O apelido é obrigatório" }),
  email: z.string().email({ message: "Endereço de email inválido" }),
  password: z.string().min(4, { message: "A palavra-passe deve ter pelo menos 4 caracteres" }),
  birthdate: z.union([z.date(), z.undefined()]),
  user_type: z.enum(["admin", "player"], {
    required_error: "O tipo de utilizador é obrigatório",
    invalid_type_error: "Tipo de utilizador inválido",
  }),
});

export default function Registar() {
  const router = useRouter();
  const { sessionLogin } = useSession();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      birthdate: undefined,
      user_type: "player",
    },
    validate: zodResolver(schema),
  });

  const onSubmitHandler = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await register(data);
      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "",
          color: "green",
        });

        sessionLogin(response.user, response.accessToken, response.refreshToken);
      } else {
        notifications.show({
          title: "Erro",
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
  }, []);

  return (
    <Center>
      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <title>Registo</title>
        <Flex align={"center"} justify={"center"} mt={100}>
          <Image src={computedColorScheme === "light" ? "/logos/logo-propadel-1.svg" : "/logos/logo-propadel-2.svg"} alt="Logo" width={120} height={90} />
        </Flex>

        <Title ta="center" className="specialheader">
          Crie uma conta!
        </Title>

        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Já tem uma conta?
          <UnstyledButton size="sm" onClick={() => router.push(routes.signin.url)} className="logbtn">
            Iniciar Sessão
          </UnstyledButton>
        </Text>

        <StyledPaper withBorder shadow="md" p={30} mt={30} radius="md">
          <TextInput className="specialinput" label="Primeiro Nome" placeholder="Insira o seu primeiro nome" required {...form.getInputProps("first_name")} />

          <TextInput className="specialinput" label="Último Nome" placeholder="Insira o seu último nome" required {...form.getInputProps("last_name")} />

          <DatePickerInput label="Data de Nascimento" placeholder="Selecione a sua data de nascimento" {...form.getInputProps("birthdate")} valueFormat="DD-MM-YYYY" className="specialinput" />

          <TextInput className="specialinput" label="Email" placeholder="exemplo@gmail.com" required {...form.getInputProps("email")} />

          <PasswordInput className="specialinput" label="Palavra-passe" placeholder="Insira a sua palavra-passe" required {...form.getInputProps("password")} />

          <Button fullWidth mt="lg" type="submit" disabled={isLoading}>
            Criar Conta
          </Button>
        </StyledPaper>
      </form>
    </Center>
  );
}
