"use client";
import React, { useEffect, useState } from "react";
import { Card, TextInput,  Center, rem, Avatar, Text, Grid, ActionIcon, Divider, Loader, ThemeIcon, List } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconScan, IconSearch, IconArrowRight, IconAt, IconCheck } from "@tabler/icons-react";
import { z } from "zod";
import { registerEntry } from "@/services/acessos.service";
import { useLocation } from "@/providers/LocationProvider";

const schema = z.object({
  email: z.string().email({ message: "Endereço de email inválido" }),
});

interface FormValues {
  email: string;
}

interface Props {
  biggerInputLength?: boolean;
  refreshTable?: () => Promise<void>;
}

function QrReader(props: Props) {
  const { biggerInputLength, refreshTable } = props;
  const [email, setEmail] = useState<string>("");
  const [buffer, setBuffer] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { location } = useLocation();
 
  const form = useForm<FormValues>({
    initialValues: {
      email: "",
    },
    validate: zodResolver(schema),
  });

  const onSubmitHandler = async (values: FormValues) => {
    if (isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    values.email = values.email.trim();
    
    try {
      if (!location?.value || !values?.email) {
        return;
      }
      const response = await registerEntry({ userEmail: values?.email, locationId: location?.value });
      
      if (response.status) {
        setEmail(values.email);
        if (refreshTable) {
          refreshTable();
        }
      } else {
        notifications.show({
          message: response.message,
          color: "red",
        });
        setEmail("");
      }
    } catch (error) {
      console.log(error)
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
        // Substitui aspas duplas por @ e atualiza o estado do QR code
        const sanitizedData = buffer.replace(/"/g, "@");
        
         try {
           // Valida o email usando o schema do Zod
           schema.parse({ email: sanitizedData });
           form.setFieldValue("email", sanitizedData);
           onSubmitHandler(form.getValues());
         } catch (error) {
         }
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
          {email && (
            <Center mb="md">
              <Avatar color="teal" radius="xl" variant="filled" mr={"sm"} size="sm" >
                <IconCheck style={{ width: rem(20), height: rem(20) }} />
              </Avatar>
              <Text size="sm">Última entrada: {email}</Text>
            </Center>
          )}

          <Center>
            <Avatar color="blue" radius="xl" variant="filled" mr={"sm"}>
              <IconScan style={{ width: rem(20), height: rem(20) }} />
            </Avatar>
            <Text size="lg">A aguardar leitura do código QR.</Text>
          </Center>

          <Divider my="xl" label={<Text size="sm">Ou insira o e-mail manualmente</Text>} labelPosition="center" />

          <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
            <Center>
              <Grid style={{ width: biggerInputLength ? "60%" : "40%" }}>
                <Grid.Col span={12}>
                  <TextInput
                    radius="xl"
                    size="md"
                    placeholder="exemplo@mail.com"
                    rightSectionWidth={42}
                    leftSection={<IconAt style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
                    rightSection={
                      <ActionIcon size={32} radius="xl" variant="filled" type="submit">
                        <IconArrowRight style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                      </ActionIcon>
                    }
                    {...form.getInputProps("email")}
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
