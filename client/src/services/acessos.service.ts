import api from "@/config/api";
import { endpoints } from "@/config/routes";

interface RegisterEntriesProps {
  userEmail?: string;
  userPhone?: string;
  locationId: number;
}

export interface ValidateProps {
  entryIds: number[];
}

export const registerEntry = async (props: RegisterEntriesProps) => {
  try {
    const response = await api.post(endpoints.acessosEntryRoute, props);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const validateEntry = async (props: ValidateProps) => {
  try {
    const response = await api.post(endpoints.acessosValidateRoute, props);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeEntry = async (entryId: number) => {
  try {
    const response = await api.delete(`${endpoints.acessosEntryRoute}/${entryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateEntryCount = async (userId: number | string, actualCard: number, entryCount: number) => {
  try {
    const response = await api.post(endpoints.updateEntryCountRoute, { userId, actualCard, entryCount });
    return response.data;
  } catch (error) {
    throw error;
  }
};