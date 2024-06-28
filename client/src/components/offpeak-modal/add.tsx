import { TextInput, Paper, Text, Button, Center, Radio, Group, NumberInput, Modal, Select } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useDisclosure } from "@mantine/hooks";
import { addOffpeakCard, monthOptions, OffpeakCardData } from "@/services/offpeak.service";

const schema = z.object({
  name: z.string().min(1, { message: "O nome do cartão é obrigatório" }),
  month: z.number().min(1, { message: "O mês deve estar entre 1 e 12" }).max(12, { message: "O mês deve estar entre 1 e 12" }),
  year: z.number().min(new Date().getFullYear(), { message: "O ano deve ser atual ou futuro" }),
  is_active: z.string(),
});

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
}

export default function AddOffpeakModal(props: Props) {
  const { isModalOpen, setIsModalOpen, fetchData } = props;
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
      name: "Cartão Off Peak - ",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      is_active: "1",
    },
    validate: zodResolver(schema),
  });

  const onSubmitHandler = useCallback(async (data: Partial<OffpeakCardData>) => {
    try {
      const response = await addOffpeakCard(data);
      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "Cartão de offpeak adicionado com sucesso",
          color: "green",
        });
        fetchData().finally(close);
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
        message: "Ocorreu um erro ao adicionar o cartão de offpeak",
        color: "red",
      });
    }
  }, []);

  const handleMonthChange = (value: string | null) => {
    const month = monthOptions.find((option) => option.label === value)?.value;
    if (month) {
      form.setFieldValue("month", month);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Adicionar Cartão de Offpeak" size="md">
      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <TextInput className="specialinput" label="Nome" placeholder="Insira o nome do cartão" required {...form.getInputProps("name")} mb={"sm"} />

        <Select
          className="specialinput"
          label="Mês"
          placeholder="Escolha o mês"
          required
          data={monthOptions.map((option) => option.label)}
          defaultValue={monthOptions[new Date().getMonth()].label}
          onChange={handleMonthChange}
          mb={"sm"}
        />

        <NumberInput className="specialinput" label="Ano" placeholder="Insira o ano do cartão" required {...form.getInputProps("year")} min={new Date().getFullYear()} mb={"sm"} />

        <Radio.Group name="is_active" label="Ativo" withAsterisk {...form.getInputProps("is_active")} required mb={"sm"}>
          <Group mt="xs">
            <Radio value={"1"} label="Sim" />
            <Radio value={"0"} label="Não" />
          </Group>
        </Radio.Group>

        <Button fullWidth mt="lg" type="submit">
          Adicionar
        </Button>
      </form>
    </Modal>
  );
}
