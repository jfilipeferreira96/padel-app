import React, { useEffect, useState } from "react";
import { Modal, Center, Loader, NumberInput, Button, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { getUserPunchCard } from "@/services/user.service";
import { useSession } from "@/providers/SessionProvider";
import Carimbos from "../carimbos";
import { updateEntryCount } from "@/services/acessos.service";
import { createUserCardCarimbos } from "@/services/dashboard.service";

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userId: number | null;
  fetchData: () => Promise<void>;
}

const CarimbosModal: React.FC<Props> = ({ isModalOpen, setIsModalOpen, userId, fetchData }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actualCard, setActualCard] = useState<any>(null); 
  const [entryCount, setEntryCount] = useState<number | string>(0); 
  
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
      setActualCard(null); // Limpar o estado do cartão quando o modal é fechado
      setEntryCount(0); // Limpar o estado do número de entrada quando o modal é fechado
    }
  }, [opened, setIsModalOpen]);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        if (!userId) return;

        const response = await getUserPunchCard(userId as any);
        
        if (response.status) {
          const card = response.actual_card[0];
          
          if (card) {
            setActualCard(card); 
            setEntryCount(card.entry_count ?? 0); 
          } else {
            const createCard = await createUserCardCarimbos(userId as any);
            if (createCard.status) {
              setActualCard(createCard.card);
              setEntryCount(createCard.card.entry_count ?? 0);
            }
          }
        } else {
          notifications.show({
            title: "Erro",
            message: response.message,
            color: "red",
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching card data:", error);
        notifications.show({
          title: "Erro",
          message: "Algo correu mal",
          color: "red",
        });
        setIsLoading(false);
      }
    };

    if (opened && userId) {
      fetchCard();
    }
  }, [opened, userId]);

  const onSubmit = async () => {
    
    try {
      if (!userId || !actualCard || !entryCount == null || !entryCount == undefined) return;
      
      const response = await updateEntryCount(userId, actualCard?.card_id, entryCount as number);
      
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
      console.error("Error updating card data:", error);
      notifications.show({
        title: "Erro",
        message: "Algo correu mal ao guardar as alterações.",
        color: "red",
      });
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Ver/Editar Carimbos" size="xl">
      {!userId || isLoading ? (
        <Center mt={50} mih={"40vh"}>
          <Loader color="blue" />
        </Center>
      ) : (
        <>
          {!actualCard ? (
              <>
                <h4>
                  Este utilizador ainda não tem um cartão carimbo associado.
                  Por favor, registe uma entrada para este utilizador.
                </h4>
              </>
          ) : (
            <>
              <Carimbos userId={userId} />

              <NumberInput mt={"lg"} className="specialinput" label="Editar Nº de Entrada" placeholder="Insira o número que pretende" value={entryCount} min={0} mb={"sm"} onChange={(value) => setEntryCount(value)} max={10} />

              <Button fullWidth mt="lg" type="submit" onClick={onSubmit}>
                Guardar
              </Button>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default CarimbosModal;
