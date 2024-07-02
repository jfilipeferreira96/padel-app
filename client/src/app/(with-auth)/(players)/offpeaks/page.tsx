"use client";
import React, { useState, useEffect } from "react";
import { Text, Title, Center, Loader, UnstyledButton, Box, Image, rem } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import { getUser, OffpeakCard, UserData } from "@/services/user.service";
import { getAllOffpeakCards } from "@/services/offpeak.service";
import { IconChevronDown, IconChevronLeft, IconChevronUp } from "@tabler/icons-react";
import { Carousel } from "@mantine/carousel";
import "@mantine/carousel/styles.css";
import { IconChevronRight } from "@tabler/icons-react";

function Offpeaks() {
  const { user } = useSession();
  const [userOffPeaks, setUserOffpeaks] = useState<OffpeakCard[]>([]);
  const [offpeakCards, setOffpeakCards] = useState<OffpeakCard[]>([]);
  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userOffPeaksIds, setuserOffPeaksIds] = useState<number[]>([]);

  const getInitialSlide = () => {
    if (currentYear === new Date().getFullYear())
    {
      return new Date().getMonth() + 1;
    }
    return 0; // Primeiro mês do ano selecionado
  };

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const pagination = {
        page: 1,
        limit: 999999,
        orderBy: "year",
        order: "DESC",
      };

      // Faz os dois fetches simultaneamente usando Promise.all
      const [offpeakCardsResponse, userData] = await Promise.all([getAllOffpeakCards(pagination), getUser(user.id)]);

      // Trata a resposta de getAllOffpeakCards
      if (offpeakCardsResponse.status) {
        const sortedCards: OffpeakCard[] = offpeakCardsResponse.data.sort((a: OffpeakCard, b: OffpeakCard) => {
          if (a.year === b.year) {
            return a.month - b.month;
          }
          return b.year - a.year;
        });

        setOffpeakCards(sortedCards);

        const years = Array.from(new Set(sortedCards.map((card) => card.year)));
        setUniqueYears(years);

        if (!years.includes(currentYear)) {
          setCurrentYear(years[0]);
        }
      }

      // Trata a resposta de getUser
      if (userData) {
        const userResponse: UserData = userData;
        if (userResponse?.offpeaks) {
          const userOffPeaksIds = userResponse?.offpeaks.map((offpeak) => offpeak.offpeak_card_id);
          setuserOffPeaksIds(userOffPeaksIds);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCards = offpeakCards.filter((card) => card.year === currentYear && card.is_active);

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

  if (isLoading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <div>
      <Title mt={15} className="productheader">
        Cartões Off Peak
      </Title>
      <Box mt={20}>
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

        <Carousel
          dragFree
          height={250}
          slideSize={{ base: "100%", sm: "50%", md: "33.333333%" }}
          slideGap="md"
          loop
          align="start"
          initialSlide={getInitialSlide()}
          nextControlIcon={<IconChevronRight style={{ width: rem(22), height: rem(22) }} />}
          previousControlIcon={<IconChevronLeft style={{ width: rem(22), height: rem(22)}} />}
        >
          {filteredCards.map((card) => {
            const isUserCard = userOffPeaksIds.includes(card.offpeak_card_id);

            return (
              <Carousel.Slide key={card.offpeak_card_id}>
                <Image src={`/off_peak/${card?.month}.png`} alt="Offpeak" radius="md" height={250} className={isUserCard ? "" : classes.blur} />
              </Carousel.Slide>
            );
          })}
        </Carousel>
      </Box>
    </div>
  );
}

export default Offpeaks;
