"use client";
import React, { useState } from "react";
import { Container, Table, Title, Text, Group, Button, Box, Flex, SimpleGrid, Grid, Skeleton, rem, Card, Divider, TextInput, Center, Image, ActionIcon, NumberInput, UnstyledButton, Loader } from "@mantine/core";
import { IconMinus, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useCart } from "@/providers/CartProvider";

const PRIMARY_COL_HEIGHT = rem(350);
const SECONDARY_COL_HEIGHT = `calc(${PRIMARY_COL_HEIGHT} / 2 - var(--mantine-spacing-md) / 2)`;

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = () => {
    console.log("Finalizando compra...");
    setIsProcessing(true);

    // Exemplo de integração com um serviço de pagamento
    const checkoutData = {
      items: cart,
      total: totalPrice,
    };

    // Simulação de redirecionamento para uma página de pagamento
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      //router.push("/checkout-success");
    }, 2000);
  };

  const handleIncrement = (itemId: number) => {
    const item = cart.find((item) => item.product_id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity + 1);
    }
  };

  const handleDecrement = (itemId: number) => {
    const item = cart.find((item) => item.product_id === itemId);
    if (item && item.quantity > 1) {
      updateQuantity(itemId, item.quantity - 1);
    }
  };

  if (isProcessing) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (isLoading) {
    return (
      <>
        <Title mt={15} className="productheader">
          Carrinho de compras
        </Title>
        <Grid columns={6} mt="lg">
          <Grid.Col span={{ base: 6, md: 4 }}>
            {/* divs com os produtos */}
            <Skeleton height={SECONDARY_COL_HEIGHT} radius="md" animate={false} mb="md" />
            <Skeleton height={SECONDARY_COL_HEIGHT} radius="md" animate={false} mb="md" />
            <Skeleton height={SECONDARY_COL_HEIGHT} radius="md" animate={false} />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 2 }}>
            {/*  subtotal shipping Total + botao checkout */}
            <Skeleton height={PRIMARY_COL_HEIGHT} radius="md" animate={false} mb="md" />

            {/* text-input cupon code + botao */}
            <Skeleton height={SECONDARY_COL_HEIGHT} radius="md" animate={false} />
          </Grid.Col>
        </Grid>
      </>
    );
  }

  return (
    <>
      <Title mt={15} className="productheader">
        Carrinho de compras
      </Title>
      {cart.length === 0 ? (
        <Center mt={80}>
          <Image src={"./empty.svg"} alt="Empty" width={400} height={400} />
        </Center>
      ) : (
        <Grid columns={6} mt="lg">
          <Grid.Col span={{ base: 6, md: 4 }}>
            {cart.map((item) => (
              <div key={item.product_id}>
                <Card shadow="sm" padding="lg" radius="md" mb={20} withBorder p={20}>
                  <Grid columns={12}>
                    <Grid.Col span={{ base: 12, sm: 4.5, md: 4.5, lg: 4.5 }}>
                      <Flex>
                        <Image src={"./off_peak/5.png"} alt={item.name} />
                      </Flex>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4, md: 4, lg: 4 }}>
                      <Text size="lg" fw={600}>
                        {item.name}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 4, sm: 2, md: 2, lg: 2 }}>
                      <div style={{ placeItems: "center", textAlign: "center" }}>
                        <NumberInput
                          value={item.quantity}
                          decimalScale={0}
                          min={1}
                          className={"cartinput smaller"}
                          rightSection={<IconPlus size={18} onClick={() => handleIncrement(item.product_id)} />}
                          leftSection={<IconMinus size={18} onClick={() => handleDecrement(item.product_id)} />}
                        />
                        <Text c={"red"} size="sm" fw={600} style={{ cursor: "pointer" }} onClick={() => removeFromCart(item.product_id)}>
                          Remover
                        </Text>
                      </div>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 1.5, md: 1.5, lg: 1.5 }}>
                      <Group justify={"flex-end"}>
                        <Text size="lg" fw={600}>
                          {item.price.toFixed(2)} €
                        </Text>
                      </Group>
                    </Grid.Col>
                  </Grid>
                </Card>
              </div>
            ))}
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 2 }}>
            <Card shadow="sm" padding="lg" radius="md" mb={20} withBorder p={20} mih={SECONDARY_COL_HEIGHT}>
              <Text fw={900} size="lg" mb={10}>
                Resumo
              </Text>

              <Box>
                <Group justify="space-between" align="center" mb={5}>
                  <Text size="md">Subtotal</Text>
                  <Text size="md">{totalPrice.toFixed(2)} €</Text>
                </Group>

                <Divider />

                <Group justify="space-between" align="center" mb={5} mt={5}>
                  <Text size="md">Transporte</Text>
                  <Text size="md">0 €</Text>
                </Group>

                <Divider />

                <Group justify="space-between" mb={10} mt={5}>
                  <Text fw={900} size="lg">
                    Total
                  </Text>
                  <Text fw={900} size="lg">
                    {totalPrice.toFixed(2)} €
                  </Text>
                </Group>
              </Box>

              <Button variant="filled" size="md" onClick={handleCheckout}>
                Finalizar Compra
              </Button>
            </Card>

            {/* Código Cupão */}
            {/* <Card shadow="sm" padding="lg" radius="md" mb={20} withBorder p={20} mih={SECONDARY_COL_HEIGHT}>
              <Text fw={900} size="lg" mb={10}>
                Do you have a voucher?
              </Text>
              <TextInput className="specialinput" size="lg" placeholder="Código Cupão" mb={"sm"} />
              <Button variant="filled" color="blue" size="md" onClick={() => console.log(1)}>
                Aplicar
              </Button>
            </Card> */}
          </Grid.Col>
        </Grid>
      )}
    </>
  );
};

export default CartPage;
