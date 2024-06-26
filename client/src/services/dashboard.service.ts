import api from "@/config/api";
import { endpoints } from "@/config/routes";

export interface Pagination {
  page: number;
  limit: number;
  orderBy: string;
  order: 'ASC' | 'DESC' | string;
  total?: number;
}

export const getDashboardEntries = async (pagination: Pagination, location: number) => {
  try {
    const response = await api.post(endpoints.dashboardEntriesRoute, { pagination: pagination, location: location });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDashboardCards = async (pagination: Pagination) => {
  try
  {
    const response = await api.post(endpoints.dashboardCardsRoute, { pagination: pagination });
    return response.data;
  } catch (error)
  {
    throw error;
  }
};

export const getConfig = async () => {
  try {
    const response = await api.get(endpoints.configRoute);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateConfig = async (configData: any): Promise<{ status: string; message?: string }> => {
  try {
    const response = await api.post(endpoints.configRoute, configData);
    return response.data;
  } catch (error) {
    throw error;
  }
};