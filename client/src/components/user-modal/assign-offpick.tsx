"use client";
import { useEffect, useCallback, useState } from "react";
import { Modal, Table, Text, Button, UnstyledButton, Center, Loader, Select, MultiSelect, Paper } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { getUser, OffpickCard, updateUser, UserData } from "@/services/user.service";
import { assignOffpickCard, getAllOffpickCards } from "@/services/offpick.service";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userId: number | null;
  fetchData: () => Promise<void>;
}

export default function AsignOffpickModal({ isModalOpen, setIsModalOpen, userId, fetchData }: Props) {
  const { user } = useSession();
  const [opened, { open, close }] = useDisclosure(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [offpickCards, setOffpickCards] = useState<OffpickCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userOffPicksIds, setuserOffPicksIds] = useState<number[]>([]);
  const [userOffpickCards, setUserOffpickCards] = useState<OffpickCard[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [selectedOffpickIds, setSelectedOffpickIds] = useState<number[]>([]);

  useEffect(() => {
    if (isModalOpen && userId) {
      fetchUserData(userId);
      open();
    } else {
      close();
    }
  }, [isModalOpen, open, close, userId]);

  useEffect(() => {
    if (!opened) {
      setIsModalOpen(false);
      //LIMPAR TODOS OS ESTADOS AQUI
      setIsModalOpen(false);
      setUserData(null);
      setOffpickCards([]);
      setIsLoading(true); 
      setuserOffPicksIds([]);
      setUserOffpickCards([]);
      setCurrentYear(new Date().getFullYear()); 
      setUniqueYears([]);
      setSelectedOffpickIds([]); 
    }
  }, [opened, setIsModalOpen]);

  const filteredCards = offpickCards.filter((card) => card.year === currentYear && card.is_active);
  const filteredUserCards = userOffpickCards.filter((card) => card.year === currentYear);
  const availableCards = filteredCards.filter((card) => !userOffPicksIds.includes(card.offpick_card_id));

  const handleSelect = (value: string[] | null) => {
    if (value === null) {
      setSelectedOffpickIds([]);
      return;
    }

    const ids: number[] = [];
    availableCards.forEach((option) => {
      if (value.includes(`${option.name} ${option.year}`)) {
        ids.push(option.offpick_card_id);
      }
    });

    setSelectedOffpickIds(ids);
  };

  const fetchUserData = async (userId: number) => {
    if (!userId) return;

    try {
      const pagination = {
        page: 1,
        limit: 999999,
        orderBy: "year",
        order: "DESC",
      };

      // Faz os dois fetches simultaneamente usando Promise.all
      const [offpickCardsResponse, userData] = await Promise.all([getAllOffpickCards(pagination), getUser(userId)]);
      
      // Trata a resposta de getAllOffpickCards
      if (offpickCardsResponse.status) {
        const sortedCards: OffpickCard[] = offpickCardsResponse.data.sort((a: OffpickCard, b: OffpickCard) => {
          if (a.year === b.year) {
            return a.month - b.month;
          }
          return b.year - a.year;
        });

        setOffpickCards(sortedCards);

        const years = Array.from(new Set(sortedCards.map((card) => card.year)));
        setUniqueYears(years);

        if (!years.includes(currentYear)) {
          setCurrentYear(years[0]);
        }
      }

      // Trata a resposta de getUser
      if (userData) {
        const userResponse: UserData = userData;
        if (userResponse?.offpicks) {
          setUserOffpickCards(userResponse?.offpicks);
          const userOffPicksIds = userResponse?.offpicks.map((offpick) => offpick.offpick_card_id);
          setuserOffPicksIds(userOffPicksIds);
        }
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar os dados",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async () => {
      try {
        if (!userId) return;
        if (selectedOffpickIds.length === 0) return;

        const response = await assignOffpickCard({
          user_id: userId,
          offpick_card_ids: selectedOffpickIds,
          assigned_by: user.id
        });

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
        notifications.show({
          title: "Erro",
          message: "Algo correu mal",
          color: "red",
        });
      }
    };

  const handleIncrementYear = () => {
    setCurrentYear((current) => {
      const nextYear = current + 1;
      return nextYear <= Math.max(...uniqueYears) ? nextYear : current;
    });
  };

  const handleDecrementYear = () => {
    setCurrentYear((current) => {
      const prevYear = current - 1;
      return prevYear >= Math.min(...uniqueYears) ? prevYear : current;
    });
  };

  return (
    <Modal opened={opened} onClose={close} title="Ver/atribuir cartões" size="lg">
      {isLoading ? (
        <Center mt={50} mih={"40vh"}>
          <Loader color="blue" />
        </Center>
      ) : (
        <>
          <div className={classes.position}>
            <div className={classes.controls}>
              <UnstyledButton className={`${classes.control} ${currentYear <= Math.min(...uniqueYears) ? classes.controlDisabled : ""}`} onClick={handleDecrementYear} disabled={currentYear <= Math.min(...uniqueYears)}>
                <IconChevronDown className={`${classes.controlIcon} ${currentYear <= Math.min(...uniqueYears) ? classes.controlDisabledIcon : ""}`} stroke={1.5} />
              </UnstyledButton>

              <div className={classes.date}>
                <Text className={classes.year}>{currentYear}</Text>
              </div>

              <UnstyledButton className={`${classes.control} ${currentYear >= Math.max(...uniqueYears) ? classes.controlDisabled : ""}`} onClick={handleIncrementYear} disabled={currentYear >= Math.max(...uniqueYears)}>
                <IconChevronUp className={`${classes.controlIcon} ${currentYear >= Math.max(...uniqueYears) ? classes.controlDisabledIcon : ""}`} stroke={1.5} />
              </UnstyledButton>
            </div>
          </div>

          {filteredUserCards.length ? (
            <Paper shadow="xs" p="sm" withBorder>
              <Table.ScrollContainer minWidth={200}>
                <Table highlightOnHover striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nome</Table.Th>
                      <Table.Th>Mês</Table.Th>
                      <Table.Th>Ano</Table.Th>
                      <Table.Th>Atribuído por</Table.Th>
                      <Table.Th>Data de Atribuição</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <tbody>
                    {filteredUserCards.map((card, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>{card.name}</Table.Td>
                        <Table.Td>{card.month}</Table.Td>
                        <Table.Td>{card.year}</Table.Td>
                        <Table.Td>{card.assigned_by ? `${card.assigned_by_first_name} ${card.assigned_by_last_name}` : "-"}</Table.Td>
                        <Table.Td>{card?.assigned_at ? new Date(card.assigned_at).toLocaleString() : "-"}</Table.Td>
                      </Table.Tr>
                    ))}
                  </tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          ) : (
            <Paper shadow="xs" p="sm" withBorder>
              <Text>Este utilizador não tem cartões offpick.</Text>
            </Paper>
          )}

          <MultiSelect
            mt={"md"}
            label="Cartões offpick disponíveis"
            data={availableCards.map((available) => `${available.name} ${available.year}`)}
            clearable
            onChange={handleSelect}
            disabled={availableCards.map((available) => available.name).length === 0}
          />

          <Button fullWidth mt="lg" type="submit" onClick={() => onSubmit()}>
            Guardar
          </Button>
        </>
      )}
    </Modal>
  );
}
