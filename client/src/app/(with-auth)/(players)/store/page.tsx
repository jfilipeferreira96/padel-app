"use client";
import React, { useState, useRef, useEffect } from "react";
import { TextInput, Paper, PasswordInput, Checkbox, Anchor, Title, Text, Image, Group, Button, Center, SimpleGrid, Card, Badge, Flex, Divider, Loader, Pagination } from "@mantine/core";
import classes from "./classes.module.css";
import { useSession } from "@/providers/SessionProvider";
import { notifications } from "@mantine/notifications";
import { getAllProducts } from "@/services/product.service";
import { routes } from "@/config/routes";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/CartProvider";

export interface ProductType {
  category: string | null;
  created_at: string;
  description: string;
  is_active: number;
  name: string;
  price: string;
  product_id: number;
  stock: number | null;
  url_image_1: string | null;
  url_image_2: string | null;
}

const ITEMS_PER_PAGE = 9;  // Número de itens por página

function Store() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<number>(1);
  const { user } = useSession();
  const router = useRouter();
  const { cart } = useCart(); 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const pagination = {
          page: 1,
          limit: 999,
          orderBy: "product_id",
          order: "ASC",
        };
        const response = await getAllProducts(pagination);

        if (response.status) {
          setProducts(response.data);
          setIsLoading(false);
        }
      } catch (error) {
        notifications.show({
          title: "Erro",
          message: "Algo correu mal",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  if (isLoading) {
    return (
      <Center mt={100} mih={"50vh"}>
        <Loader color="blue" />
      </Center>
    );
  }

  const activeProducts = products.filter((product) => product.is_active === 1);
  const totalPages = Math.ceil(activeProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = activeProducts.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  return (
    <div>
      <Title mt={15} className="productheader">
        Todos os produtos
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 3 }} mt={"lg"}>
        {paginatedProducts.map((product) => (
          <Card key={product.product_id} shadow="sm" padding="lg" radius="md" withBorder className={classes.cardproduct} onClick={() => router.push(`${routes.store.product}/${product.product_id}`)}>
            <Card.Section>
              <div className={classes.imagediv} style={{ backgroundImage: `url(${product.url_image_1 || `/off_peak/${product.product_id}.png`})` }} />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500}>{product.name}</Text>
            </Group>

            <Text fz="xl" fw={700} style={{ lineHeight: 1 }}>
              {product.price} €
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <Center mt={"xl"}>
        <Pagination total={totalPages} onChange={setActivePage} radius="md" />
      </Center>
    </div>
  );
}

export default Store;
