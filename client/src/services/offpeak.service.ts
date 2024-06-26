import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Pagination } from "./dashboard.service";

export interface OffpeakCardData {
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

export const getOffpeakCard = async (offpeakCardId: number) => {
  try {
    const response = await api.get(`${endpoints.getOffpeakCard}/${offpeakCardId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllOffpeakCards = async (pagination: Pagination) => {
  try {
    const response = await api.post(endpoints.getAllOffpeakCards, { pagination });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addOffpeakCard = async (data: Partial<OffpeakCardData>) => {
  try {
    const response = await api.post(endpoints.addOffpeakCard, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateOffpeakCard = async (offpeakCardId: number, data: Partial<OffpeakCardData>) => {
  try {
    const response = await api.put(`${endpoints.updateOffpeakCard}/${offpeakCardId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteOffpeakCard = async (offpeakCardId: number) => {
  try {
    const response = await api.delete(`${endpoints.deleteOffpeakCard}/${offpeakCardId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignOffpeakCard = async (data: { user_id: number; offpeak_card_ids: number[]; assigned_by: number}) => {
  try {
    const response = await api.post(endpoints.assignOffpeakCard, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
