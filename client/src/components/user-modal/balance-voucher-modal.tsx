import React, { useEffect, useState } from "react";
import { Modal, Center, Loader, NumberInput, Button, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { updateCreditBalance } from "@/services/vouchers.service";

interface Props
{
    opened: boolean;
    onClose: () => void;
    voucherId: number | null;
    currentBalance: number;
    fetchData: () => Promise<void>;
}

const EditBalanceModal: React.FC<Props> = ({ opened, onClose, voucherId, currentBalance, fetchData }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newBalance, setNewBalance] = useState<number | string>(currentBalance);
    const [isModalOpen, { open, close }] = useDisclosure(false);

    useEffect(() =>
    {
        if (opened)
        {
            setNewBalance(currentBalance); // Define o saldo inicial ao abrir o modal
            open(); // Abre o modal
        }
    }, [opened, currentBalance, open]);

    const handleSave = async () =>
    {
        if (!voucherId) return;

        try
        {
            setIsLoading(true);
            const response = await updateCreditBalance({
                voucher_id: voucherId,
                new_credit_balance: typeof newBalance === "number" ? newBalance : parseFloat(newBalance),
            });

            if (response.status)
            {
                notifications.show({
                    title: "Sucesso",
                    message: "Saldo atualizado com sucesso!",
                    color: "green",
                });

                await fetchData();
                close();          
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
            console.error("Erro ao atualizar saldo:", error);
            notifications.show({
                title: "Erro",
                message: "Ocorreu algum erro ao guardar as alterações.",
                color: "red",
            });
        } finally
        {
            setIsLoading(false);
        }
    };

    return (
        <Modal opened={isModalOpen} onClose={close} title="Editar Saldo de Créditos" size="md">
            {isLoading ? (
                <Center mt={50} mih={"40vh"}>
                    <Loader color="blue" />
                </Center>
            ) : (
                <>
                    <Text mb="sm">
                        Saldo atual: <Text span fw={700} c="green">{currentBalance} € </Text>
                    </Text>

                    <NumberInput
                        label="Novo Saldo"
                        value={newBalance}
                        onChange={(value) => setNewBalance(value ?? currentBalance)}
                        min={0}
                        placeholder="Insira o novo saldo"
                    />

                    <Button fullWidth mt="lg" onClick={handleSave}>
                        Guardar
                    </Button>
                </>
            )}
        </Modal>
    );
};

export default EditBalanceModal;
