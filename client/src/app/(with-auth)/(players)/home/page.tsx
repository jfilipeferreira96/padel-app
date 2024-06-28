"use client";
import React, { useState, useRef, useEffect } from "react";
import { TextInput, Paper, PasswordInput, Checkbox, Anchor, Title, Text, Container, Group, Button, Center, SimpleGrid, Image, Card, Badge, Flex, Divider, Loader } from "@mantine/core";
import classes from "./classes.module.css";
import { QRCodeSVG } from "qrcode.react";
import { IconDownload } from "@tabler/icons-react";
import { toPng } from "html-to-image";
import { useSession } from "@/providers/SessionProvider";
import { notifications } from "@mantine/notifications";
import { getUserPunchCard } from "@/services/user.service";
import { CartaoJogos } from "@/components/padel-racket/cartao-jogos";

function Home() {
  const [rackets, setRackets] = useState(Array(10).fill({ isFilled: false }));
  const qrRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useSession();

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await getUserPunchCard(user.id);
        if (response.status) {
          const card = response.actual_card[0];
          if (card) {
            const entryCount = card.entry_count ?? 0;
            let rackets = [];

            for (let i = 1; i <= 10; i++) {
              rackets.push({ isFilled: i <= entryCount ? true : false });
            }

            setRackets(rackets);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [user]);
 
  const handleDownload = async () => {
    if (qrRef.current) {
      try {
        const svgElement = qrRef.current.querySelector("svg");
        if (!svgElement) {
          throw new Error("SVG element not found");
        }

        const dataUrl = await toPng(svgElement as unknown as HTMLElement, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "qrcode.png";
        link.click();
      } catch (error) {
        console.error("Erro ao gerar a imagem do QR code:", error);
      }
    }
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
      <Card shadow="sm" padding="lg" radius="md" mt={20} withBorder p={20}>
        <Card.Section>
          <div ref={qrRef} className={classes.qrcode}>
            <QRCodeSVG
              value={user?.email}
              size={220}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
              includeMargin={true}
              imageSettings={{
                src: "/logos/qrblack.png",
                x: undefined,
                y: undefined,
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>
        </Card.Section>

        <Button variant="gradient" gradient={{ from: "blue", to: "cyan", deg: 90 }} fullWidth mt="md" radius="md" rightSection={<IconDownload size={18} />} onClick={handleDownload}>
          Descarregue o seu Código QR
        </Button>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" mt={20} withBorder p={20} /* className={classes.cardimagem} */>
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
}

export default Home;
