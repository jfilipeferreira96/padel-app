"use client";
import { routes } from "@/config/routes";
import { useSession } from "@/providers/SessionProvider";
import { register, RegisterData, UserType } from "@/services/auth.service";
import { TextInput, PasswordInput, Anchor, Paper, Title, Text, Container, Group, Button, Input, Center, Radio, CheckIcon, CheckboxGroup, Modal } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { z } from "zod";
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { useDisclosure } from "@mantine/hooks";

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

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
}

export default function AddUserModal(props: Props) {
  const { isModalOpen, setIsModalOpen, fetchData } = props;
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (isModalOpen) {
      form.reset();

      open();
    } else {
      close();
    }
  }, [isModalOpen, open, close]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
      form.reset();
    }
  }, [opened, setIsModalOpen]);

  const form = useForm({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      birthdate: undefined,
      user_type: UserType.ADMIN,
    },
    validate: zodResolver(schema),
  });

  const onSubmitHandler = useCallback(async (data: RegisterData) => {
    try {
  
      const response = await register(data);
      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "",
          color: "green",
        });

        fetchData().finally(() => close())
        
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
    }
  }, []);

  return (
    <Modal opened={opened} onClose={close} title="Adicionar Utilizador" size="md">
      <>
        <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
          <TextInput className="specialinput" label="Primeiro Nome" placeholder="Insira o seu primeiro nome" required {...form.getInputProps("first_name")} mb={"sm"} />

          <TextInput className="specialinput" label="Último Nome" placeholder="Insira o seu último nome" required {...form.getInputProps("last_name")} mb={"sm"} />

          <DatePickerInput label="Data de Nascimento" placeholder="Selecione a sua data de nascimento" {...form.getInputProps("birthdate")} valueFormat="DD-MM-YYYY" className="specialinput" mb={"sm"} />

          <TextInput className="specialinput" label="Email" placeholder="exemplo@gmail.com" required {...form.getInputProps("email")} mb={"sm"} />

          <Radio.Group name="user_ype" label="Tipo de Utilizador" withAsterisk {...form.getInputProps("user_type")} required mb={"sm"}>
            <Group mt="xs" defaultValue={UserType.ADMIN}>
              <Radio value={UserType.ADMIN} label={"Administrador"} checked icon={CheckIcon} style={{ textTransform: "capitalize" }} />
              <Radio value={UserType.PLAYER} label={"Jogador"} icon={CheckIcon} style={{ textTransform: "capitalize" }} />
            </Group>
          </Radio.Group>

          <PasswordInput className="specialinput" label="Palavra-passe" placeholder="Insira a sua palavra-passe" required {...form.getInputProps("password")} />

          <Button fullWidth mt="lg" type="submit">
            Adicionar
          </Button>
        </form>
      </>
    </Modal>
  );
}
