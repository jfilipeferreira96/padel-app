"use client";
import { routes } from "@/config/routes";
import { useSession } from "@/providers/SessionProvider";
import { getUser, updateAccount, UserData } from "@/services/user.service";
import { TextInput, PasswordInput, Anchor, Paper, Title, Text, Container, Group, Button, Input, Center, Radio, CheckIcon, CheckboxGroup, Loader } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { z } from "zod";
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";

const StyledPaper = styled(Paper)`
  width: 500px;
  @media (max-width: 600px) {
    width: 94vw;
  }
`;

const schema = z.object({
  first_name: z.string().min(1, { message: "O primeiro nome é obrigatório" }),
  last_name: z.string().min(1, { message: "O apelido é obrigatório" }),
  password: z
    .string()
    .optional()
    .or(z.string().min(4, { message: "A palavra-passe deve ter pelo menos 4 caracteres" })),
  birthdate: z.union([z.date(), z.undefined()]),
  user_type: z.enum(["admin", "player"], {
    required_error: "O tipo de utilizador é obrigatório",
    invalid_type_error: "Tipo de utilizador inválido",
  }),
});

export default function ConfiguracoesConta() {
  const router = useRouter();
  const { user, updateUser } = useSession();
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar o carregamento
  const form = useForm({
    validate: zodResolver(schema),
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        return;
      }

      try {
        const userData = await getUser(user.id);

        form.setValues({
          first_name: userData.first_name,
          last_name: userData.last_name,
          birthdate: userData.birthdate ? new Date(userData.birthdate) : undefined,
          user_type: userData.user_type,
        });
      } catch (error) {
        notifications.show({
          title: "Erro",
          message: "Não foi possível carregar os dados do utilizador",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [user]);

  const onSubmitHandler = useCallback(async (data: Partial<UserData>) => {
    if (!data.password) {
      delete data.password;
    }

    try {
      const response = await updateAccount(user.id, data);

      if (response.status) {
        updateUser(data as any);
        notifications.show({
          title: "Sucesso",
          message: "Dados da conta atualizados com sucesso",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Erro",
          message: response.message || "Erro ao atualizar os dados da conta",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Algo correu mal ao tentar atualizar os dados da conta",
        color: "red",
      });
    }
  }, []);

  if (isLoading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <Center>
      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <title>Configurações da Conta</title>
        <Title ta="center" mt={20} className="specialheader">
          Configurações da Conta
        </Title>

        <StyledPaper withBorder shadow="md" p={30} mt={30} radius="md">
          <TextInput className="specialinput" label="Primeiro Nome" placeholder="Insira o seu primeiro nome" required {...form.getInputProps("first_name")} />

          <TextInput className="specialinput" label="Último Nome" placeholder="Insira o seu último nome" required {...form.getInputProps("last_name")} />

          <DatePickerInput label="Data de Nascimento" placeholder="Selecione a sua data de nascimento" {...form.getInputProps("birthdate")} valueFormat="DD-MM-YYYY" className="specialinput" />

          <TextInput disabled label="Email" placeholder="exemplo@gmail.com" value={user.email} readOnly />

          <PasswordInput className="specialinput" label="Nova Palavra-passe" placeholder="Insira a sua nova palavra-passe (opcional)" {...form.getInputProps("password")} />

          <Button fullWidth mt="lg" type="submit">
            Atualizar Dados
          </Button>
        </StyledPaper>
      </form>
    </Center>
  );
}
