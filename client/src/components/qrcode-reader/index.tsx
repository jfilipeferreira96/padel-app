"use client";
import React, { useEffect, useState } from "react";
import { Card, TextInput, Center, rem, Avatar, Text, Grid, ActionIcon, Divider } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconScan, IconArrowRight, IconAt, IconCheck } from "@tabler/icons-react";
import { z } from "zod";
import { registerEntry } from "@/services/acessos.service";
import { useLocation } from "@/providers/LocationProvider";

const emailSchema = z.string().email({ message: "Endereço de email inválido" });
const phoneSchema = z.string().regex(/^\d{9}$/, { message: "O número de telemóvel deve ter 9 dígitos" });

const schema = z.object({
  contact: z.string().refine((value) => emailSchema.safeParse(value).success || phoneSchema.safeParse(value).success, {
    message: "Por favor, insira um e-mail válido ou um número de telemóvel com 9 dígitos",
  }),
});

interface FormValues {
  contact: string;
}

interface Props {
  biggerInputLength?: boolean;
  refreshTable?: () => Promise<void>;
}

function QrReader(props: Props) {
  const { biggerInputLength, refreshTable } = props;
  const [contact, setContact] = useState<string>("");
  const [buffer, setBuffer] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { location } = useLocation();

  const form = useForm<FormValues>({
    initialValues: {
      contact: "",
    },
    validate: zodResolver(schema),
  });

  const onSubmitHandler = async (values: FormValues) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    values.contact = values.contact.trim();

    try {
      if (!location?.value || !values?.contact) {
        return;
      }

      const isEmail = /\S+@\S+\.\S+/.test(values.contact);
      const payload = isEmail ? { userEmail: values.contact } : { userPhone: values.contact };
      const response = await registerEntry({ ...payload, locationId: location?.value });

      if (response.status) {
        setContact(values.contact);
        if (refreshTable) {
          refreshTable();
        }
      } else {
        notifications.show({
          message: response.message,
          color: "red",
        });
        setContact("");
      }
    } catch (error) {
    
      notifications.show({
        title: "Erro",
        message: "Algo correu mal",
        color: "red",
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        form.reset();
      }, 1000); // 1 segundo de atraso antes de limpar
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Verifica se a tecla pressionada é "Enter"
      if (event.key === "Enter") {
        const sanitizedData = buffer.replace(/"/g, "@");

        try {
          // Valida o contato usando o schema do Zod
          schema.parse({ contact: sanitizedData });
          form.setFieldValue("contact", sanitizedData);
          onSubmitHandler(form.getValues());
        } catch (error) {}
        setBuffer("");
      } else {
        // Adiciona a tecla pressionada ao buffer
        setBuffer((prevBuffer) => prevBuffer + event.key);
      }
    };

    // Adiciona o evento keypress globalmente
    window.addEventListener("keypress", handleKeyPress);

    // Remove o evento quando o componente é desmontado
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, [buffer]);

  return (
    <Card shadow="sm" padding="lg" radius="md" mt={20} withBorder p={20}>
      <>
        {contact && (
          <Center mb="md">
            <Avatar color="teal" radius="xl" variant="filled" mr={"sm"} size="sm">
              <IconCheck style={{ width: rem(20), height: rem(20) }} />
            </Avatar>
            <Text size="sm">Última entrada: {contact}</Text>
          </Center>
        )}

        <Center>
          <Avatar color="blue" radius="xl" variant="filled" mr={"sm"}>
            <IconScan style={{ width: rem(20), height: rem(20) }} />
          </Avatar>
          <Text size="lg">A aguardar leitura do código QR.</Text>
        </Center>

        <Divider my="xl" label={<Text size="sm">Ou insira o e-mail ou número de telemóvel manualmente</Text>} labelPosition="center" />

        <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
          <Center>
            <Grid style={{ width: biggerInputLength ? "60%" : "40%" }}>
              <Grid.Col span={12}>
                <TextInput
                  radius="xl"
                  size="md"
                  placeholder="exemplo@mail.com ou 912345678"
                  rightSectionWidth={42}
                  leftSection={<IconAt style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
                  rightSection={
                    <ActionIcon size={32} radius="xl" variant="filled" type="submit">
                      <IconArrowRight style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                    </ActionIcon>
                  }
                  {...form.getInputProps("contact")}
                />
              </Grid.Col>
            </Grid>
          </Center>
        </form>
      </>
    </Card>
  );
}

export default QrReader;
