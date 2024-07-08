import { useEffect, useCallback } from "react";
import { useForm, zodResolver } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import { Modal, TextInput, Button, Center, Radio, CheckIcon, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { z } from "zod";
import { getNews, NewsData, updateNews } from "@/services/news.service";

const schema = z.object({
  title: z.string().min(1, { message: "O título da notícia é obrigatório" }),
  content: z.string(),
  author: z.string().min(1, { message: "O autor é obrigatório" }),
  is_active: z.string(),
});

interface Props
{
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newsId: number | null;
  fetchData: () => Promise<void>;
}

export default function EditNewsModal({ isModalOpen, setIsModalOpen, newsId, fetchData }: Props)
{
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() =>
  {
    if (isModalOpen && newsId)
    {
      fetchNewsData(newsId);
      open();
    } else
    {
      close();
    }
  }, [isModalOpen, open, close, newsId]);

  useEffect(() =>
  {
    if (!opened)
    {
      setIsModalOpen(false);
      form.reset();
    }
  }, [opened, setIsModalOpen]);

  const form = useForm({
    initialValues: {
      title: "",
      content: "",
      author: "",
      is_active: "1",
    },
    validate: zodResolver(schema),
  });

  const fetchNewsData = async (newsId: number) =>
  {
    if (!newsId) return;

    try
    {
      const response = await getNews(newsId);

      if (response.status)
      {
        const data: NewsData = response.data;
        form.setValues({
          title: data.title,
          content: data.content,
          author: data.author,
          is_active: data.is_active.toString(),
        });
      }

    } catch (error)
    {
      notifications.show({
        title: "Erro",
        message: "Falha ao carregar os dados da notícia",
        color: "red",
      });
    }
  };

  const onSubmitHandler = useCallback(
    async (data: Partial<NewsData>) =>
    {
      try
      {
        if (!newsId) return;

        const response = await updateNews(newsId, data);

        if (response.status)
        {
          notifications.show({
            title: "Sucesso",
            message: "Notícia atualizada com sucesso",
            color: "green",
          });

          fetchData().finally(() => close());
        } else
        {
          notifications.show({
            title: "Erro",
            message: response.message,
            color: "red",
          });
        }
      } catch (error)
      {
        notifications.show({
          title: "Erro",
          message: "Ocorreu um erro",
          color: "red",
        });
      }
    },
    [newsId, fetchData, close]
  );

  return (
    <Modal opened={opened} onClose={close} title="Editar Notícia" size="md">
      <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
        <TextInput label="Título" placeholder="Insira o título da notícia" required {...form.getInputProps("title")} mb={"sm"} />

        <TextInput label="Conteúdo" placeholder="Insira o conteúdo da notícia" {...form.getInputProps("content")} mb={"sm"} />

        <TextInput label="Autor" placeholder="Insira o autor da notícia" required {...form.getInputProps("author")} mb={"sm"} />

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
