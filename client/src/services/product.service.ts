import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Pagination } from "./dashboard.service";

export interface ProductData {
  name: string;
  description: string;
  price: number;
  is_active: number | string;
  stock: number;
  category: string | null;
  url_image_1: string | null;
  url_image_2: string | null;
}

export const getProduct = async (productId: number) => {
  try {
    const response = await api.get(`${endpoints.getProduct}/${productId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllProducts = async (pagination: Pagination) => {
  try {
    const response = await api.post(endpoints.getAllProducts, { pagination });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addProduct = async (data: Partial<ProductData>) => {
  try {
    const response = await api.post(endpoints.addProduct, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (productId: number, data: Partial<ProductData>) => {
  try {
    const response = await api.put(`${endpoints.updateProduct}/${productId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (productId: number) => {
  try {
    const response = await api.delete(`${endpoints.deleteProduct}/${productId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
