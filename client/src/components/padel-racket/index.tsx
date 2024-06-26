import { Flex, Image, Text } from "@mantine/core";
import classes from "./PadelRacket.module.css";
import { useState } from "react";

interface Props {
  children?: React.ReactNode;
  number: number;
  isFilled?: boolean;
}

export function PadelRacket(props: Props) {
  const { children, number, isFilled } = props;
  const [isNumberTen, setIsNumberTen] = useState(number === 10 ? true : false);

  return (
    <div className={classes.card}>
      <Flex align={"center"}>
        {isFilled && <Image src={`paddle_6688583.png`} alt={number.toString()} width={100} height={100} />}
        {isNumberTen && (
          <>
            <div className={isFilled ? classes.freeimage : ""}>
              <Image src={`trophy-prize-medal-3-svgrepo-com.svg`} alt="prize" width={100} height={100} />
            </div>
          </>
        )}
      </Flex>
    </div>
  );
}
