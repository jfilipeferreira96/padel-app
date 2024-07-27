"use client";
import React, { useEffect } from "react";
import { Card, TextInput, Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { getConfig, updateConfig } from "@/services/dashboard.service";
import { useSession } from "@/providers/SessionProvider";

interface FormValues {
  torneios: string;
  ligas: string;
}

function Configurations() {
  const { user, fetchConfig } = useSession();

  const form = useForm<FormValues>({
    initialValues: {
      torneios: "",
      ligas: "",
    },
  });

   useEffect(() => {
     getConfig()
       .then((config) => {
         if (config.status) {
            form.setValues({
              torneios: config.data.torneios || "",
              ligas: config.data.ligas || "",
            });
         } else {
           notifications.show({
             title: "Erro",
             message: "Não foi possível carregar as configurações",
             color: "red",
           });
         }
        
       })
       .catch((error) => {
         notifications.show({
           title: "Erro",
           message: "Não foi possível carregar as configurações",
           color: "red",
         });
       });
   }, []);
  
  const onSubmitHandler = async (values: FormValues) => {
    try {
      const response = await updateConfig(values); 
      
      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "Configurações atualizadas com sucesso",
          color: "green",
        });
        fetchConfig();
      } else {
        notifications.show({
          title: "Erro",
          message: response.message || "Erro ao atualizar as configurações",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Algo correu mal ao tentar atualizar as configurações",
        color: "red",
      });
    }
  };

  return (
    <>
      <h1>Configurações</h1>

      <Card shadow="sm" padding="lg" radius="md" mt={20} withBorder p={20} mih={250}>
        <form onSubmit={form.onSubmit((values) => onSubmitHandler(values))}>
          <TextInput label="Torneios" placeholder="Insira o URL do torneio" {...form.getInputProps("torneios")} mb={"sm"} />

          <TextInput label="Ligas" placeholder="Insira o URL da liga" {...form.getInputProps("ligas")} mb={"sm"} />

          <Group mt="lg">
            <Button size="md" type="submit" fullWidth>
              Guardar
            </Button>
          </Group>
        </form>
      </Card>
    </>
  );
}

export default Configurations;
