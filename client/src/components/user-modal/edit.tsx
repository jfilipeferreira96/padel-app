"use client";
import { useEffect, useCallback, useState } from "react";
import { useForm, zodResolver } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import { Modal, TextInput, PasswordInput, Button, Group, Radio, CheckIcon, MultiSelect, Input } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { z } from "zod";
import { getUser, updateUser, UserData } from "@/services/user.service";
import { UserType } from "@/services/auth.service";
import { useLocation } from "@/providers/LocationProvider";
import ReactInputMask from "react-input-mask";

const schema = z.object({
  first_name: z.string().min(1, { message: "O primeiro nome é obrigatório" }),
  last_name: z.string().min(1, { message: "O apelido é obrigatório" }),
  email: z.string().email({ message: "Endereço de email inválido" }),
  birthdate: z.union([z.date(), z.undefined()]),
  user_type: z.enum(["admin", "player"], {
    required_error: "O tipo de utilizador é obrigatório",
    invalid_type_error: "Tipo de utilizador inválido",
  }),
  phone: z
    .string()
    .regex(/^\d{9}$/, { message: "O número de telemóvel deve ter 9 dígitos" })
    .min(1, { message: "O telemóvel é obrigatório" }),
});

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userId: number | null;
  fetchData: () => Promise<void>;
}

export default function EditUserModal({ isModalOpen, setIsModalOpen, userId, fetchData }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const { location, setLocation, availableLocations } = useLocation();
  const [selectedLocations, setSelectedLocations] = useState<string[] | undefined>([]);
  const [locs, setLocs] = useState<Location[] | any>([]);
  
  useEffect(() => {
    if (isModalOpen && userId) {
      fetchUserData(userId);
      open();
    } else {
      setSelectedLocations([]);
      setLocs([]);
      close();
    }
  }, [isModalOpen, open, close, userId]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
      setSelectedLocations([]);
      setLocs([]);
      form.reset();
    }
  }, [opened, setIsModalOpen]);

  const form = useForm({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
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

      // Verificar se userData.locations está definido
      if (userData.locations && userData.locations.length > 0) {
        const data: any = userData.locations;
        const selectedLocationNames = data.map((loc:any) => loc.location_name);
        const selectedLocationOptions = data.map((loc: any) => ({
          label: loc.location_name,
          value: loc.location_id,
        }));

        setSelectedLocations(selectedLocationNames);
        setLocs(selectedLocationOptions);
      } else {
        setSelectedLocations([]);
        setLocs([]);
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar os dados do utilizador",
        color: "red",
      });
    }
  };

  const handleLocationChange = (values: string[] | null) => {
    if (values === null) {
      return;
    }

    setSelectedLocations(values);
    const selectedLocationObjects = values.map((value) => availableLocations.find((loc) => loc.label === value));
    setLocs(selectedLocationObjects);
  };


  const onSubmitHandler = useCallback(
    async (data: Partial<UserData>) => {
      try {
        if (!userId) return;
        const sendData = { ...data, locations: locs };
        const response = await updateUser(userId, sendData);

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
    [userId, selectedLocations, locs]
  );

  return (
    <Modal opened={opened} onClose={close} title="Editar Utilizador" size="lg">
      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <TextInput className="specialinput" label="Primeiro Nome" placeholder="Insira o seu primeiro nome" required {...form.getInputProps("first_name")} mb={"sm"} />

        <TextInput className="specialinput" label="Último Nome" placeholder="Insira o seu último nome" required {...form.getInputProps("last_name")} mb={"sm"} />

        <DatePickerInput label="Data de Nascimento" placeholder="Selecione a sua data de nascimento" {...form.getInputProps("birthdate")} valueFormat="DD-MM-YYYY" className="specialinput" mb={"sm"} />

        <Input.Wrapper label="Telemóvel" required>
          <Input component={ReactInputMask} mask="999999999" placeholder="Insira o seu telemóvel" {...form.getInputProps("phone")} />
        </Input.Wrapper>

        <TextInput className="specialinput" label="Email" placeholder="exemplo@gmail.com" required {...form.getInputProps("email")} mb={"sm"} />

        <Radio.Group name="user_type" label="Tipo de Utilizador" withAsterisk {...form.getInputProps("user_type")} required mb={"sm"}>
          <Group mt="xs" defaultValue={UserType.ADMIN}>
            <Radio value={UserType.ADMIN} label={UserType.ADMIN} icon={CheckIcon} style={{ textTransform: "capitalize" }} />
            <Radio value={UserType.PLAYER} label={UserType.PLAYER} icon={CheckIcon} style={{ textTransform: "capitalize" }} />
          </Group>
        </Radio.Group>

        {form.values.user_type === UserType.ADMIN && (
          <MultiSelect
            label="Localizações disponíveis"
            placeholder="Selecione uma ou mais localizações"
            data={availableLocations.map((loc) => loc.label)}
            value={selectedLocations}
            onChange={handleLocationChange}
            clearable
            mb={"sm"}
            required
          />
        )}

        <Button fullWidth mt="lg" type="submit">
          Editar
        </Button>
      </form>
    </Modal>
  );
}
