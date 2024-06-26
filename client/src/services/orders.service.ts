import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Pagination } from "./dashboard.service";

export interface OrderData {
  order_id: number;
  user_id: number;
  total_price: number;
  status: string;
  created_at: string;
  user_email: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  products: Array<{
    product_id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
}

export const OrderStatus = [
  { label: "Pendente", value: "pending" },
  { label: "Concluída", value: "completed" },
  { label: "Cancelada", value: "cancelled" },
  { label: "Enviada", value: "shipped" },
];

export const getSingleOrder = async (orderId: number) => {
  try {
    const response = await api.get(`${endpoints.getSingleOrder}/${orderId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllOrders = async (pagination: Pagination) => {
  try {
    const response = await api.post(endpoints.getAllOrders, { pagination });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addOrder = async (data: Partial<OrderData>) => {
  try {
    const response = await api.post(endpoints.addOrder, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
