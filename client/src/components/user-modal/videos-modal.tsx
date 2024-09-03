import React, { useEffect, useState } from "react";
import { Modal, Center, Loader, NumberInput, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { getUser } from "@/services/user.service"; // Usando o getUser para buscar os dados do usuário
import { updateUserCredits } from "@/services/video.service";

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userId: number | null;
  fetchData: () => Promise<void>;
}

const VideosModal: React.FC<Props> = ({ isModalOpen, setIsModalOpen, userId, fetchData }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [creditCount, setCreditCount] = useState<number | string>(0); 

  useEffect(() => {
    if (isModalOpen && userId) {
      open();
    } else {
      close();
    }
  }, [isModalOpen, open, close, userId]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
    }
  }, [opened, setIsModalOpen]);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        if (!userId) return;

        const response = await getUser(userId);
        setCreditCount(response.video_credits ? response.video_credits : 0); 

        setIsLoading(false);
      } catch (error) {
        console.log("Error fetching user data:", error);
        notifications.show({
          title: "Erro",
          message: "Algo correu mal ao buscar os créditos.",
          color: "red",
        });
        setIsLoading(false);
      }
    };

    if (opened && userId) {
      fetchCredits();
    }
  }, [opened, userId]);

  const onSubmit = async () => {
    try {
      if (!userId || creditCount == null) return;

      const response = await updateUserCredits(userId, creditCount as number);
      if (response.status) {
        notifications.show({
          title: response.message,
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
      console.error("Error updating credits:", error);
      notifications.show({
        title: "Erro",
        message: "Algo correu mal ao guardar as alterações.",
        color: "red",
      });
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Ver/Editar Créditos para Vídeos" size="xl">
      {!userId || isLoading ? (
        <Center mt={50} mih={"40vh"}>
          <Loader color="blue" />
        </Center>
      ) : (
        <>
          <Center >
            <h2>Editar Créditos para Vídeos</h2>
          </Center>

          <NumberInput mt={"lg"} className="specialinput" label="Nº de Créditos" placeholder="Insira o número que pretende" value={creditCount} min={0} mb={"sm"} onChange={(value) => setCreditCount(value)} max={10} />

          <Button fullWidth mt="lg" type="submit" onClick={onSubmit}>
            Guardar
          </Button>
        </>
      )}
    </Modal>
  );
};

export default VideosModal;
