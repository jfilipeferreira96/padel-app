import { Flex, Image, Text } from "@mantine/core";
import classes from "./PadelRacket.module.css";
import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";

interface Props {
  children?: React.ReactNode;
  number: number;
  isFilled?: boolean;
}

export function CartaoJogos(props: Props) {
  const { children, number, isFilled } = props;
  const [isNumberTen, setIsNumberTen] = useState(number === 10 ? true : false);
    const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className={classes.rounded}>
      <Flex align={"center"}>
        {isFilled && <Image src={`/paddle_6688583.png`} alt={number.toString()} width={isMobile ? 80 : 100} height={isMobile ? 80 : 100} />}

        {isNumberTen && (
          <>
            <div className={isFilled ? classes.divoferta : ""}>
              <Text c="dimmed" fw={900} className={classes.oferta}>
                OFERTA
              </Text>
            </div>
          </>
        )}
      </Flex>
    </div>
  );
}
