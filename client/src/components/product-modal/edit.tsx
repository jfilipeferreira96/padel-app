import { useEffect, useCallback } from "react";
import { useForm, zodResolver } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import { Modal, TextInput, Button, CheckboxGroup, Center, Radio, CheckIcon, Group, NumberInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { z } from "zod";
import { getProduct, updateProduct, ProductData } from "@/services/product.service";

const schema = z.object({
  name: z.string().min(1, { message: "O nome do produto é obrigatório" }),
  description: z.string(),
  price: z.number().min(0, { message: "O preço não pode ser negativo" }),
  is_active: z.string(),
  /*   stock: z.number().int().positive({ message: "O stock deve ser um número inteiro positivo" }),
  category: z.string().nullable(),
  url_image_1: z.string().nullable(),
  url_image_2: z.string().nullable(), */
});

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  productId: number | null;
  fetchData: () => Promise<void>;
}

export default function EditProductModal({ isModalOpen, setIsModalOpen, productId, fetchData }: Props) {
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (isModalOpen && productId) {
      fetchProductData(productId);
      open();
    } else {
      close();
    }
  }, [isModalOpen, open, close, productId]);

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

  const fetchProductData = async (productId: number) => {
    if (!productId) return;

    try {
      const response = await getProduct(productId);
   
      if (response.status) {
        const data: ProductData = response.data;
        form.setValues({
          name: data.name,
          description: data.description,
          price: parseFloat(data.price as any),
          is_active: data.is_active.toString(),
          stock: data.stock,
          category: data.category ? data.category : (null as any),
          url_image_1: data.url_image_1 ? data.url_image_1 : (null as any),
          url_image_2: data.url_image_2 ? data.url_image_2 : (null as any),
        });
      } 
      
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Falha ao carregar os dados do produto",
        color: "red",
      });
    }
  };

  const onSubmitHandler = useCallback(
    async (data: Partial<ProductData>) => {
      try {
        if (!productId) return;

        const response = await updateProduct(productId, data);

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
          message: "Ocorreu um erro",
          color: "red",
        });
      }
    },
    [productId]
  );

  return (
    <Modal opened={opened} onClose={close} title="Editar Produto" size="md">
      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <TextInput label="Nome" placeholder="Insira o nome do produto" required {...form.getInputProps("name")} mb={"sm"} />

        <TextInput label="Descrição" placeholder="Insira a descrição do produto" {...form.getInputProps("description")} mb={"sm"} />

        <NumberInput label="Preço" placeholder="Insira o preço do produto" suffix="€" mb={"sm"} required {...form.getInputProps("price")} min={0} />

        <Radio.Group name="is_active" label="Ativo" withAsterisk {...form.getInputProps("is_active")} required mb={"sm"}>
          <Group mt="xs" defaultValue={"1"}>
            <Radio value={"1"} label="Sim" icon={CheckIcon} />
            <Radio value={"2"} label="Não" icon={CheckIcon} />
          </Group>
        </Radio.Group>

        <Button fullWidth mt="lg" type="submit">
          Editar
        </Button>
      </form>
    </Modal>
  );
}
