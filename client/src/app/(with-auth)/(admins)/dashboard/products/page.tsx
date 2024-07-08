"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, Badge, SimpleGrid, Skeleton, Grid, Tooltip, ActionIcon, rem, Group, Button, Modal } from "@mantine/core";
import { deleteProduct, getAllProducts } from "@/services/product.service";
import { IconEye, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import AddProductModal from "@/components/product-modal/add";
import { useDisclosure } from "@mantine/hooks";
import EditProductModal from "@/components/product-modal/edit";
import { notifications } from "@mantine/notifications";
import { usePathname } from "next/navigation";

function getBadge(isActive: number){
  return isActive === 1 ? { name: "Ativo", color: "blue" } : { name: "Inativo", color: "gray" };
}

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  is_active: number;
  stock: number;
  category: string | null;
  url_image_1: string | null;
  url_image_2: string | null;
  created_at: string;
}

function Products() {
  const pathname = usePathname();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activePage, setActivePage] = useState<number>(1);
  const [elementsPerPage, setElementsPerPage] = useState<number>(() => {
    const storedValue = localStorage.getItem(pathname);
    return storedValue ? parseInt(storedValue) : 10;
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isModalOpenAdd, setIsModalOpenAdd] = useState<boolean>(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState<boolean>(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pagination = {
        page: activePage,
        limit: elementsPerPage,
        orderBy: 'product_id',
        order: 'ASC'
      }

      const response = await getAllProducts(pagination);
      
      if (response)
      {
        setProducts(response.data);
        setTotalElements(response.pagination.total || 0);
        setActivePage(response.pagination.page || 1);
      }

      setLoading(false);
    } catch (error)
    {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    //fetchData();
  }, [activePage, elementsPerPage]);

  const handlePageChange = (page: number) =>
  {
    setActivePage(page);
  };

  const handleEditClick = (productId: number) => {
    setEditProductId(productId);
    setIsModalOpenEdit(true);
  };
  
  const handleElementsPerPageChange = (value: string | null) => {

    if (value)
    {
      setElementsPerPage(parseInt(value));
      setActivePage(1); // Reset to first page whenever elements per page change
      localStorage.setItem(pathname, value);
    }
  };

  const initialIndex = (activePage - 1) * elementsPerPage;
  const finalIndex = initialIndex + elementsPerPage;

  const rows = products?.map((product) => (
    <Table.Tr key={product.product_id} bg={selectedRows.includes(product.product_id) ? "var(--mantine-color-blue-light)" : undefined}>
      <Table.Td>
        <Badge variant="filled" size="md" fw={700} color={getBadge(product.is_active).color} style={{ minWidth: "110px" }}>
          {getBadge(product.is_active).name}
        </Badge>
      </Table.Td>
      <Table.Td>{product.name}</Table.Td>
      <Table.Td>{product.description ? product.description : "-"}</Table.Td>
      <Table.Td>{product.price} €</Table.Td>
      <Table.Td>
        <Group gap={0} justify="center">
          <Tooltip label={"Delete Product"} withArrow position="top">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => {
                setDeleteProductId(product.product_id);
                open();
              }}
            >
              <IconTrash style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={"Edit Product"} withArrow position="top">
            <ActionIcon variant="subtle" onClick={() => handleEditClick(product.product_id)}>
              <IconPencil size={20} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <h1>Produtos</h1>
      <AddProductModal isModalOpen={isModalOpenAdd} setIsModalOpen={setIsModalOpenAdd} fetchData={fetchData} />
      <EditProductModal isModalOpen={isModalOpenEdit} setIsModalOpen={setIsModalOpenEdit} fetchData={fetchData} productId={editProductId} />

      <Modal opened={opened} onClose={close} withCloseButton={false}>
        <Center>
          <h3>Tem a certeza que pretende eliminar?</h3>
        </Center>
        <Button
          fullWidth
          variant="filled"
          color="red"
          size="md"
          onClick={() => {
            if (deleteProductId) {
              deleteProduct(deleteProductId)
                .then((res) => {
                  if (res.status === true) {
                    notifications.show({
                      message: res.message,
                      color: "red",
                    });
                  } else {
                    notifications.show({
                      title: "Erro",
                      message: "Algo correu mal",
                      color: "red",
                    });
                  }
                })
                .finally(() => {
                  close(), fetchData();
                });
            }
          }}
        >
          Confirmo
        </Button>
      </Modal>

      <Card withBorder shadow="md" p={30} mt={10} radius="md" style={{ flex: 1 }}>
        <Group justify="space-between" align="center" mb={"lg"}>
          <Flex align={"center"}>
            <Text>A mostrar</Text>
            <Select
              data={["10", "20", "30", "50"]}
              value={elementsPerPage.toString()}
              allowDeselect={false}
              style={{ width: "80px", marginLeft: "8px" }}
              ml={4}
              mr={4}
              onChange={(value) => handleElementsPerPageChange(value)}
            />
            <Text>entradas</Text>
          </Flex>

          <Button
            variant="light"
            color="green"
            rightSection={<IconPlus size={18} />}
            onClick={() => {
              setIsModalOpenAdd(true);
            }}
          >
            Adicionar Produto
          </Button>
        </Group>

        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Descrição</Table.Th>
                <Table.Th>Preço</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {products.length > 0 && (
          <Flex justify={"space-between"} mt={"lg"}>
            <Text>
              A mostrar {initialIndex + 1} a {Math.min(finalIndex, totalElements)} de {totalElements} elementos
            </Text>
            <MantinePagination total={Math.ceil(totalElements / elementsPerPage)} onChange={handlePageChange} />
          </Flex>
        )}
      </Card>
    </>
  );
}

export default Products;
