import { TextInput, Paper, Text, Button, Center, Radio, CheckIcon, CheckboxGroup, Modal, Group, NumberInput } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useDisclosure } from "@mantine/hooks";
import { addProduct, ProductData } from "@/services/product.service";

const schema = z.object({
  name: z.string().min(1, { message: "O nome do produto é obrigatório" }),
  description: z.string(),
  price: z.number().min(0, { message: "O preço não pode ser negativo" }),
  is_active: z.string(),
  /* stock: z.number().int().positive({ message: "O stock deve ser um número inteiro positivo" }),
  category: z.string().nullable(),
  url_image_1: z.string().nullable(),
  url_image_2: z.string().nullable(), */
});

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
}

export default function AddProductModal(props: Props) {
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
      name: "",
      description: "",
      price: 0,
      is_active: "1",
      stock: 0,
      category: null,
      url_image_1: null,
      url_image_2: null,
    },
    validate: zodResolver(schema),
  });

  const onSubmitHandler = useCallback(async (data: Partial<ProductData>) => {
    try {
     
      const response = await addProduct(data);
      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "",
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
        message: "Ocorreu um erro",
        color: "red",
      });
    }
  }, []);

  return (
    <Modal opened={opened} onClose={close} title="Adicionar Produto" size="md">
      <>
        <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
          <TextInput label="Nome" placeholder="Insira o nome do produto" required {...form.getInputProps("name")} mb={"sm"} />

          <TextInput label="Descrição" placeholder="Insira a descrição do produto" {...form.getInputProps("description")} mb={"sm"} />

          <NumberInput label="Preço" placeholder="Insira o preço do produto" suffix="€" mb={"sm"} required {...form.getInputProps("price")} min={0} />

          <Radio.Group name="is_active" label="Ativo" withAsterisk {...form.getInputProps("is_active")} required mb={"sm"}>
            <Group mt="xs" defaultValue={"1"}>
              <Radio value={"1"} label="Sim" checked icon={CheckIcon} />
              <Radio value={"0"} label="Não" icon={CheckIcon} />
            </Group>
          </Radio.Group>

          <Button fullWidth mt="lg" type="submit">
            Adicionar
          </Button>
        </form>
      </>
    </Modal>
  );
}
