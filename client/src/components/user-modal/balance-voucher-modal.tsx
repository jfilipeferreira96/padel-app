import React, { useEffect, useState } from "react";
import { Modal, NumberInput, Button, Text, TextInput } from "@mantine/core";
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
  const [amountToDeduct, setAmountToDeduct] = useState<number>(0);
  const [opened, { open, close }] = useDisclosure(false);
  const [obvservation, setObvservation] = useState<string>("");

  useEffect(() => {
    if (isModalOpen) {
      open();
      setAmountToDeduct(0);
      setObvservation("");
    } else {
      close();
    }
  }, [isModalOpen, open, close]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
    }
  }, [opened, setIsModalOpen]);

  const handleSave = async () => {
    if (!voucherId) return;

    if (amountToDeduct <= 0) {
      notifications.show({
        title: "Erro",
        message: "O valor a descontar deve ser maior que zero.",
        color: "red",
      });
      return;
    }

    if (amountToDeduct > currentBalance) {
      notifications.show({
        title: "Erro",
        message: "O valor a descontar é superior ao saldo atual.",
        color: "red",
      });
      return;
    }

    const newBalance = currentBalance - amountToDeduct;

    try {
      setIsLoading(true);

      const response = await updateCreditBalance({
        user_voucher_id: voucherId,
        new_credit_balance: newBalance,
        obvservation: obvservation,
      });

      if (response.status) {
        notifications.show({
          title: "Sucesso",
          message: "Créditos descontados com sucesso!",
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
      console.error("Erro ao descontar créditos:", error);
      notifications.show({
        title: "Erro",
        message: "Ocorreu um erro ao guardar as alterações.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal opened={isModalOpen} onClose={close} title="Descontar Créditos" size="md">
      <>
        <Text mb="sm">
          Saldo atual:{" "}
          <Text span fw={700} c="green">
            {currentBalance} €{" "}
          </Text>
        </Text>

        <NumberInput required label="Valor a Descontar" value={amountToDeduct} onChange={(value) => setAmountToDeduct(Number(value || 0))} step={1} min={0} max={currentBalance} placeholder="Insira o valor a descontar" />

        <TextInput label="Observação" placeholder="Escreva uma observação" value={obvservation} onChange={(event) => setObvservation(event.currentTarget.value)} mb="sm" />

        <Button fullWidth mt="lg" onClick={handleSave} loading={isLoading}>
          Guardar
        </Button>
      </>
    </Modal>
  );
};

export default EditBalanceModal;
