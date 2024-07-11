import { TextInput, Paper, Text, Button, Center, Radio, CheckIcon, CheckboxGroup, Modal, Group, NumberInput, FileInput } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useDisclosure } from "@mantine/hooks";
import { addNews, NewsData } from "@/services/news.service";
import { IconFile } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import "@mantine/dates/styles.css";

const schema = z.object({
  title: z.string().min(1, { message: "O título é obrigatório" }),
  is_active: z.string(),
  date: z.date(),
});

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
}

export default function AddNewsModal(props: Props) {
  const { isModalOpen, setIsModalOpen, fetchData } = props;
  const [opened, { open, close }] = useDisclosure(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      form.reset();
      setImageFile(null);
      setPdfFile(null);
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
      title: "",
      is_active: "1",
      date: new Date(),
    },
    validate: zodResolver(schema),
  });

  const onSubmitHandler = useCallback(
    async (data: Partial<NewsData>) => {
      try {
        const payload = {
          ...data,
          image_path: imageFile ? imageFile.name : null,
          download_path: pdfFile ? pdfFile.name : null,
        };
      
        const response = await addNews(payload);
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
    },
    [imageFile, pdfFile, fetchData, close]
  );

  return (
    <Modal opened={opened} onClose={close} title="Adicionar Produto" size="lg">
      <>
        <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
          <TextInput label="Título" placeholder="Insira o título" required {...form.getInputProps("title")} mb={"sm"} />

          <FileInput
            className="specialinput"
            rightSection={<IconFile />}
            label="Imagem de capa"
            placeholder="Imagem"
            rightSectionPointerEvents="none"
            mt={10}
            radius="lg"
            clearable
            onChange={(file) => {
              form.setFieldValue("image", file);
              setImageFile(file);
            }}
          />

          <FileInput
            className="specialinput"
            rightSection={<IconFile />}
            label="Ficheiro para download"
            placeholder="Exemplo - PDF"
            rightSectionPointerEvents="none"
            mt={10}
            radius="lg"
            onChange={(file) => {
              form.setFieldValue("pdf", file);
              setPdfFile(file);
            }}
            clearable
          />

          <DateInput valueFormat="YYYY-MM-DD" required {...form.getInputProps("date")} mb={"sm"} label="Data" placeholder="Data" />

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
