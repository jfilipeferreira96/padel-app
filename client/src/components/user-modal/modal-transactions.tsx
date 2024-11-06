import React, { useState, useEffect } from "react";
import { Modal, Table, Loader, Text, Center, Box } from "@mantine/core";
import { getVoucherTransactions } from "@/services/vouchers.service";
import dayjs from "dayjs";
import "dayjs/locale/pt";
dayjs.locale("pt");

interface ModalTransactionsProps
{
    opened: boolean;
    onClose: () => void;
    user_voucher_id: number | null;
}

interface Transaction
{
    transaction_id: number;
    user_voucher_id: number;
    credits_before: number;
    credits_after: number;
    created_at: string; 
    observacoes: string | null;

    changed_by_email: string | null;
    changed_by_first_name: string | null;
    changed_by_last_name: string | null;

    owner_email: string | null;
    owner_first_name: string | null;
    owner_last_name: string | null;
    owner_phone: string | null;
}

const ModalTransactions: React.FC<ModalTransactionsProps> = ({ opened, onClose, user_voucher_id }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async (user_voucher_id: number) => {
        setLoading(true);
        try
        {
            const response = await getVoucherTransactions(user_voucher_id);
            console.log(response)
            setTransactions(response.data);
        } catch (error)
        {
            console.error("Erro ao buscar transações:", error);
        } finally
        {
            setLoading(false);
        }
    };

    useEffect(() =>{
        if (opened && user_voucher_id)
        {
            console.log('entrei')
            fetchTransactions(user_voucher_id);
        }
    }, [opened, user_voucher_id]);

    return (
        <Modal opened={opened} onClose={onClose} title="Histórico de Transações" size="lg" centered>
            {loading ? (
                <Center mt={20}>
                    <Loader color="blue" />
                </Center>
            ) : transactions.length === 0 ? (
                <>
                    <Box miw={600}>
                        <Center>
                            <Text>Nenhuma transação encontrada.</Text>
                        </Center>
                    </Box>
                </>
            ) : (
                <Table striped highlightOnHover>
                    <thead>
                        <tr>
                            <th>Saldo</th>
                            <th>Observações</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr key={transaction.transaction_id}>
                                <td>{transaction.credits_after} €</td>
                                <td>{transaction.observacoes || "-"}</td>
                                <td>{dayjs(transaction.created_at).format("YYYY-MM-DD HH:mm")}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Modal>
    );
};

export default ModalTransactions;
