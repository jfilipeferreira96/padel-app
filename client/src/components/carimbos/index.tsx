import React, { useState, useEffect } from "react";
import { Title, Text, Center, SimpleGrid, Card, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { getUserPunchCard } from "@/services/user.service";
import { CartaoJogos } from "@/components/padel-racket/cartao-jogos";
import classes from "./classes.module.css";

interface CarimbosProps {
  userId: number | string;
}

const Carimbos: React.FC<CarimbosProps> = ({ userId }) => {
  const [rackets, setRackets] = useState<{ isFilled: boolean }[]>(Array(10).fill({ isFilled: false }));
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch card data
  const fetchCard = async () => {
    try {
      const response = await getUserPunchCard(userId as string);

      if (response.status) {
        const card = response.actual_card[0];
        if (card) {
          const entryCount = card.entry_count ?? 0;
          let updatedRackets = [];

          for (let i = 1; i <= 10; i++) {
            updatedRackets.push({ isFilled: i <= entryCount });
          }

          setRackets(updatedRackets);
        }
        setIsLoading(false);
      }
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


  useEffect(() => {
    fetchCard();

    const intervalId = setInterval(fetchCard, 20000); 

    return () => clearInterval(intervalId); 
  }, [userId]);

  if (isLoading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <div>
      <Card shadow="sm" padding="lg" radius="md" mt={20} withBorder p={20}>
        <Title className={classes.titleversion2} ta="center" mb={30}>
          <span className={classes.outline}>CARTÃO</span> <br />
          <span className={classes.highlight}>JOGOS</span>
        </Title>

        <SimpleGrid cols={{ base: 2, xs: 2, sm: 5, md: 5, lg: 5 }} spacing={{ base: 5, sm: "xl" }} verticalSpacing={{ base: "sm", sm: "xl" }}>
          {rackets.map((racket, index) => (
            <div key={index} style={{ justifySelf: "center" }}>
              <CartaoJogos number={index + 1} isFilled={racket.isFilled} />
            </div>
          ))}
        </SimpleGrid>

        <Text ta={"center"} mt="lg" fw={600} className={classes.label}>
          Válido para jogos com duração de 1h30 em ambos os clubes Mozelos e Santa Maria de Lamas
        </Text>
      </Card>
    </div>
  );
};

export default Carimbos;
