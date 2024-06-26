import api from "@/config/api";
import { endpoints } from "@/config/routes";

interface RegisterEntriesProps {
  userEmail: string;
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