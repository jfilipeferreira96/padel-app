import React, { useEffect, useState } from "react";
import { Modal, Center, Loader, NumberInput, Button, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { updateCreditBalance } from "@/services/vouchers.service";

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  voucherId: number | null;
  currentBalance: number;
  fetchData: (userId: number | null) => Promise<void>;
}

const EditBalanceModal: React.FC<Props> = ({ isModalOpen, setIsModalOpen, voucherId, currentBalance, fetchData }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newBalance, setNewBalance] = useState<number>(currentBalance || 0);
  const [opened, { open, close }] = useDisclosure(false);
  const [obvservation, setObvservation] = useState<string>("");

  useEffect(() => {
    if (isModalOpen) {
      open();
      setNewBalance(Number(currentBalance));
      setObvservation("");
    } else {
      close();
    }
  }, [isModalOpen, open, close, currentBalance]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
    }
  }, [opened, setIsModalOpen]);

  const handleSave = async () => {
    if (!voucherId) return;

    try {
      setIsLoading(true);

      const response = await updateCreditBalance({
        user_voucher_id: voucherId,
        new_credit_balance: typeof newBalance === "number" ? newBalance : parseFloat(newBalance),
        obvservation: obvservation,
      });

      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "Saldo atualizado com sucesso!",
          color: "green",
        });

        await fetchData(null);
        close();
      } else {
        notifications.show({
          title: "Erro",
          message: response.message,
          color: "red",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar saldo:", error);
      notifications.show({
        title: "Erro",
        message: "Ocorreu algum erro ao guardar as alterações.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal opened={isModalOpen} onClose={close} title="Editar Saldo de Créditos" size="md">
      <>
        <Text mb="sm">
          Saldo atual:{" "}
          <Text span fw={700} c="green">
            {currentBalance} €{" "}
          </Text>
        </Text>

        <NumberInput required label="Novo Saldo" value={newBalance} onChange={(value) => setNewBalance(Number(value || 0))} step={1} min={0} placeholder="Insira o novo saldo" />

        <TextInput label="Observação" placeholder="Escreva uma observação" value={obvservation} onChange={(event) => setObvservation(event.currentTarget.value)} mb="sm" />
        
        <Button fullWidth mt="lg" onClick={handleSave} loading={isLoading}>
          Guardar
        </Button>
      </>
    </Modal>
  );
};

export default EditBalanceModal;
