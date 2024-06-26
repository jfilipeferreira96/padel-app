"use client";
import React, { useState, useEffect } from "react";
import { Text, Title, Center, Loader, UnstyledButton, Box, Image, rem } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import { getUser, OffpickCard, UserData } from "@/services/user.service";
import { getAllOffpickCards } from "@/services/offpick.service";
import { IconChevronDown, IconChevronLeft, IconChevronUp } from "@tabler/icons-react";
import { Carousel } from "@mantine/carousel";
import "@mantine/carousel/styles.css";
import { IconChevronRight } from "@tabler/icons-react";

function Offpicks() {
  const { user } = useSession();
  const [userOffPicks, setUserOffpicks] = useState<OffpickCard[]>([]);
  const [offpickCards, setOffpickCards] = useState<OffpickCard[]>([]);
  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userOffPicksIds, setuserOffPicksIds] = useState<number[]>([]);

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
      const [offpickCardsResponse, userData] = await Promise.all([getAllOffpickCards(pagination), getUser(user.id)]);

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
          const userOffPicksIds = userResponse?.offpicks.map((offpick) => offpick.offpick_card_id);
          setuserOffPicksIds(userOffPicksIds);
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

  const filteredCards = offpickCards.filter((card) => card.year === currentYear && card.is_active);

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
        Cartões Offpicks
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
          initialSlide={new Date().getMonth() + 1}
          nextControlIcon={<IconChevronRight style={{ width: rem(22), height: rem(22) }} />}
          previousControlIcon={<IconChevronLeft style={{ width: rem(22), height: rem(22)}} />}
        >
          {filteredCards.map((card) => {
            const isUserCard = userOffPicksIds.includes(card.offpick_card_id);

            return (
              <Carousel.Slide key={card.offpick_card_id}>
                <Image src={`/off_peak/${card?.month}.png`} alt="Offpick" radius="md" height={250} className={isUserCard ? "" : classes.blur} />
              </Carousel.Slide>
            );
          })}
        </Carousel>
      </Box>
    </div>
  );
}

export default Offpicks;
