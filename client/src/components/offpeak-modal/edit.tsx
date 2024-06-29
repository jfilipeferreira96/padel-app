"use client";
import { useEffect, useCallback, useState } from "react";
import { useForm, zodResolver } from "@mantine/form";
import { Modal, TextInput, Button, Group, Radio, Select, NumberInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { z } from "zod";
import { getOffpeakCard, updateOffpeakCard, OffpeakCardData, monthOptions } from "@/services/offpeak.service";

const schema = z.object({
  name: z.string().min(1, { message: "O nome do cartão é obrigatório" }),
  month: z.number().min(1, { message: "O mês deve estar entre 1 e 12" }).max(12, { message: "O mês deve estar entre 1 e 12" }),
  year: z.number().min(new Date().getFullYear(), { message: "O ano deve ser atual ou futuro" }),
  is_active: z.string(),
});

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cardId: number | null;
  fetchData: () => Promise<void>;
}

export default function EditOffpeakModal({ isModalOpen, setIsModalOpen, cardId, fetchData }: Props) {
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (isModalOpen && cardId) {
      fetchCardData(cardId);
      open();
    } else {
      close();
    }
  }, [isModalOpen, open, close, cardId]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
      form.reset();
    }
  }, [opened, setIsModalOpen]);

  const form = useForm({
    initialValues: {
      name: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      is_active: "1",
    },
    validate: zodResolver(schema),
  });

  const fetchCardData = async (cardId: number) => {
    if (!cardId) return;

    try {
      const response = await getOffpeakCard(cardId);
      
      if (response.status) {
        const cardData: OffpeakCardData = response.data;
        form.setValues({
          name: cardData.name,
          month: cardData.month,
          year: cardData.year,
          is_active: cardData.is_active.toString(),
        });
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar os dados do cartão",
        color: "red",
      });
    }
  };

  const onSubmitHandler = useCallback(
    async (data: Partial<OffpeakCardData>) => {
      try {
        if (!cardId) return;

        const response = await updateOffpeakCard(cardId, data);

        if (response.status) {
          notifications.show({
            title: "Sucesso",
            message: "Cartão de offpeak atualizado com sucesso",
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
          message: "Ocorreu um erro ao atualizar o cartão de offpeak",
          color: "red",
        });
      }
    },
    [cardId]
  );

  const handleMonthChange = (value: string | null) => {
    const month = monthOptions.find((option) => option.label === value)?.value;
    if (month !== undefined) {
      form.setFieldValue("month", month);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Editar Cartão de Off Peak" size="md">
      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <TextInput className="specialinput" label="Nome" placeholder="Insira o nome do cartão" required {...form.getInputProps("name")} mb={"sm"} />

        <Select
          className="specialinput"
          label="Mês"
          placeholder="Escolha o mês"
          required
          value={monthOptions.find((option) => option.value === form.values.month)?.label || ""}
          onChange={handleMonthChange}
          data={monthOptions.map((option) => option.label)}
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
          Editar
        </Button>
      </form>
    </Modal>
  );
}
