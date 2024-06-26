import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Pagination } from "./dashboard.service";

export interface OffpickCardData {
  name: string;
  month: number;
  year: number;
  is_active: number | string;
  assigned_by?: string;
  assigned_at?: Date;
  assigned_by_first_name?: string;
  assigned_by_last_name?: string;
}

export const monthOptions = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export const getOffpickCard = async (offpickCardId: number) => {
  try {
    const response = await api.get(`${endpoints.getOffpickCard}/${offpickCardId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllOffpickCards = async (pagination: Pagination) => {
  try {
    const response = await api.post(endpoints.getAllOffpickCards, { pagination });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addOffpickCard = async (data: Partial<OffpickCardData>) => {
  try {
    const response = await api.post(endpoints.addOffpickCard, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateOffpickCard = async (offpickCardId: number, data: Partial<OffpickCardData>) => {
  try {
    const response = await api.put(`${endpoints.updateOffpickCard}/${offpickCardId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteOffpickCard = async (offpickCardId: number) => {
  try {
    const response = await api.delete(`${endpoints.deleteOffpickCard}/${offpickCardId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignOffpickCard = async (data: { user_id: number; offpick_card_ids: number[]; assigned_by: number}) => {
  try {
    const response = await api.post(endpoints.assignOffpickCard, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
