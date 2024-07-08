"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button, Center, Card, Loader, Title } from "@mantine/core";
import classes from "./classes.module.css";
import { QRCodeSVG } from "qrcode.react";
import { IconDownload } from "@tabler/icons-react";
import { toPng } from "html-to-image";
import { useSession } from "@/providers/SessionProvider";

function Home() {
  const qrRef = useRef<HTMLDivElement>(null);
  const { user } = useSession();

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


  return (
    <div>
      <Title mt={15} className="productheader">
        Código QR
      </Title>

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
                src: "/logos/qrblack.svg",
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

    </div>
  );
}

export default Home;
