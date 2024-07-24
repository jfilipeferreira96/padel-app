"use client";
import { forgotPassword } from "@/services/auth.service"; // Certifique-se de ter um serviço para resetar a palavra-passe
import { TextInput, Paper, Title, Text, Container, Group, Button, Center, Flex, useComputedColorScheme, UnstyledButton, Anchor, rem, Box } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { notifications } from "@mantine/notifications";
import styled from "styled-components";
import { z } from "zod";
import Image from "next/image";
import { routes } from "@/config/routes";

const StyledPaper = styled(Paper)`
  width: 500px;
  @media (max-width: 600px) {
    width: 94vw;
  }
`;

const schema = z.object({
  email: z.string().email({ message: "Endereço de email inválido" }),
});

export default function EsqueceuPassword() {
  const router = useRouter();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmitHandler = useCallback(async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const response = await forgotPassword(data);

      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "Verifique o seu email para instruções de redefinição de palavra-passe.",
          color: "green",
        });

        setTimeout(() => {
          router.push(routes.signin.url); // Redireciona para a página de login após o atraso
        }, 4000);
        
      } else {
        notifications.show({
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const form = useForm<{ email: string }>({
    initialValues: {
      email: "",
    },
    validate: zodResolver(schema),
  });

  return (
    <Container>
      <Center>
        <title>Esqueceu a Palavra-passe</title>

        <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
          <Flex align={"center"} justify={"center"} mt={100}>
            <Image src={computedColorScheme === "light" ? "/logos/logo-propadel-1.svg" : "/logos/logo-propadel-2.svg"} alt="Logo" width={120} height={90} />
          </Flex>

          <Title ta="center" size="h2" className="specialheader">
            Esqueceu-se da palavra-passe?
          </Title>

          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Introduza o seu email abaixo.
          </Text>

          <StyledPaper withBorder shadow="md" p={30} mt={30} radius="md">
            <TextInput className="specialinput" label="Email" placeholder="you@gmail.com" required {...form.getInputProps("email")} />
            <Group justify={"flex-end"} mt="sm" mb={"sm"} onClick={() => router.push(routes.signin.url)}>
              <Anchor component="button" size="sm" c="dimmed">
                Voltar à pagina de entrada
              </Anchor>
            </Group>

            <Button fullWidth type="submit" disabled={isLoading} mt="md">
              Enviar Instruções
            </Button>
   
          </StyledPaper>
        </form>
      </Center>
    </Container>
  );
}
