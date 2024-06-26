"use client";
import { useEffect, useCallback, useState } from "react";
import { useForm, zodResolver } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import { Modal, TextInput, PasswordInput, Button, Group, Radio, CheckIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { z } from "zod";
import { getUser, updateUser, UserData } from "@/services/user.service";
import { UserType } from "@/services/auth.service";

const schema = z.object({
  first_name: z.string().min(1, { message: "O primeiro nome é obrigatório" }),
  last_name: z.string().min(1, { message: "O apelido é obrigatório" }),
  email: z.string().email({ message: "Endereço de email inválido" }),
  birthdate: z.union([z.date(), z.undefined()]),
  user_type: z.enum(["admin", "player"], {
    required_error: "O tipo de utilizador é obrigatório",
    invalid_type_error: "Tipo de utilizador inválido",
  }),
});

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userId: number | null;
  fetchData: () => Promise<void>;
}

export default function EditUserModal({ isModalOpen, setIsModalOpen, userId, fetchData }: Props) {
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (isModalOpen && userId) {
      fetchUserData(userId);
      open();
    } else {
      close();
    }
  }, [isModalOpen, open, close, userId]);

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
      birthdate: undefined,
      user_type: UserType.ADMIN,
    },
    validate: zodResolver(schema),
  });

  const fetchUserData = async (userId: number) => {
    if (!userId) return;

    try {
      const userData: UserData = await getUser(userId);

      form.setValues({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        birthdate: userData.birthdate ? new Date(userData.birthdate) : (undefined as any),
        user_type: userData.user_type,
      });
      
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar os dados do utilizador",
        color: "red",
      });
    }
  };

  const onSubmitHandler = useCallback(
    async (data: Partial<UserData>) => {
      try {
        if (!userId) return;
      
        const response = await updateUser(userId, data);
        
        if (response.status) {
          notifications.show({
            title: "Sucesso",
            message: "",
            color: "green",
          });

          fetchData().finally(() => close());
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
    },
    [userId]
  );

  return (
    <Modal opened={opened} onClose={close} title="Editar Utilizador" size="md">
      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <TextInput className="specialinput" label="Primeiro Nome" placeholder="Insira o seu primeiro nome" required {...form.getInputProps("first_name")} mb={"sm"} />

        <TextInput className="specialinput" label="Último Nome" placeholder="Insira o seu último nome" required {...form.getInputProps("last_name")} mb={"sm"} />

        <DatePickerInput label="Data de Nascimento" placeholder="Selecione a sua data de nascimento" {...form.getInputProps("birthdate")} valueFormat="DD-MM-YYYY" className="specialinput" mb={"sm"} />

        <TextInput className="specialinput" label="Email" placeholder="exemplo@gmail.com" required {...form.getInputProps("email")} mb={"sm"} />

        <Radio.Group name="user_type" label="Tipo de Utilizador" withAsterisk {...form.getInputProps("user_type")} required mb={"sm"}>
          <Group mt="xs" defaultValue={UserType.ADMIN}>
            <Radio value={UserType.ADMIN} label={UserType.ADMIN} icon={CheckIcon} style={{ textTransform: "capitalize" }} />
            <Radio value={UserType.PLAYER} label={UserType.PLAYER} icon={CheckIcon} style={{ textTransform: "capitalize" }} />
          </Group>
        </Radio.Group>

        <Button fullWidth mt="lg" type="submit">
          Editar
        </Button>
      </form>
    </Modal>
  );
}
