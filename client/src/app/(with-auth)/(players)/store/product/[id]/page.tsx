"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Grid, SimpleGrid, Skeleton, rem, Image, Title, Text, Group, Box, Button, NumberInput, Flex } from "@mantine/core";
import { getProduct } from "@/services/product.service";
import { ProductType } from "../../page";
import { routes } from "@/config/routes";
import { notifications } from "@mantine/notifications";
import { IconMinus, IconPlus, IconShoppingCart } from "@tabler/icons-react";
import { useCart } from "@/providers/CartProvider";

const PRIMARY_COL_HEIGHT = rem(350);

function Product({ params: { id } }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1); 
  const { addToCart } = useCart(); 

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

    const handleAddToCart = () => {
      if (product) {

        const cartItem = {
          product_id: product.product_id,
          name: product.name,
          price: Number(product.price),
          quantity: quantity
        };

        addToCart(cartItem);
        
        notifications.show({
          title: "Sucesso",
          message: "Produto adicionado ao carrinho",
          color: "green",
        });
      }
    };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const response = await getProduct(parseInt(id));
        
        if (response.status) {
          setProduct(response.data);
        } else {
          router.push(routes.store.url);
          notifications.show({
            title: "Erro",
            message: response.message,
            color: "red",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
        notifications.show({
          title: "Erro",
          message: "Algo correu mal",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const SECONDARY_COL_HEIGHT = `calc(${PRIMARY_COL_HEIGHT} / 2 - var(--mantine-spacing-md) / 2)`;

  if (isLoading) {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt={"lg"}>
          <Skeleton height={PRIMARY_COL_HEIGHT} radius="md" animate={false} />
          <Grid gutter="md">
            <Grid.Col>
              <Skeleton height={SECONDARY_COL_HEIGHT} radius="md" animate={false} />
            </Grid.Col>
            <Grid.Col span={6}>
              <Skeleton height={SECONDARY_COL_HEIGHT} radius="md" animate={false} />
            </Grid.Col>
            <Grid.Col span={6}>
              <Skeleton height={SECONDARY_COL_HEIGHT} radius="md" animate={false} />
            </Grid.Col>
          </Grid>
        </SimpleGrid>
    );
  }

  return (
    <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }} mt={"lg"}>
      {/* <h1>{product?.name}</h1> */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Image src={`/off_peak/${product?.product_id}.png`} alt="ProductImage" radius="md" height={PRIMARY_COL_HEIGHT} />
        <Grid gutter="lg">
          <Grid.Col>
            <Text size="xl" fw={900} c="blue" className="productcategory">
              {product?.category}
            </Text>
            <Title mt={15} className="productheader">
              {product?.name}
            </Title>
          </Grid.Col>
          <Grid.Col span={12}>
            {product?.description && <Text c={"dimmed"}>{product?.description}</Text>}

            <Text fz="xl" fw={700} mt={"sm"}>
              {product?.price} €
            </Text>

            <Flex justify="space-between" align="center" mt={"sm"}>
              <NumberInput
                /* disabled={product?.category === "Cartões"} */
                value={quantity}
                decimalScale={0}
                min={0}
                className="cartinput"
                mr={"sm"}
                rightSection={<IconPlus onClick={handleIncrement} />}
                leftSection={<IconMinus onClick={handleDecrement} />}
              />

              <Button size="lg" leftSection={<IconShoppingCart size={22} />} onClick={handleAddToCart}>
                Adicionar ao carrinho
              </Button>
            </Flex>
          </Grid.Col>
        </Grid>
      </SimpleGrid>
    </Box>
  );
}

export default Product;
