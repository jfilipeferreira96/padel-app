import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Pagination } from "./dashboard.service";
import { UserType } from "./auth.service";

export interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  birthdate: string;
  user_type: UserType;
  password?: string;
  locations?: {label: string, value: number}[]
  offpeaks?: OffpeakCard[]
}

export interface OffpeakCard {
  offpeak_card_id: number;
  name: string;
  month: number;
  year: number;
  is_active: boolean;
  assigned_by?: string;
  assigned_at?: Date;
  assigned_by_first_name?: string;
  assigned_by_last_name?: string;
}

export const getUserPunchCard = async (id: string) => {
  try {
    const response = await api.get(endpoints.cardsRoute + id);
    return response.data;
  } catch (error) {
    throw error;
  }
};

interface Filters {
  email: string | null,
  name: string | null
}

export const getAllUsers = async (pagination: Pagination, filters: Filters) => {
  try
  {
    const response = await api.post(endpoints.getAllUsers, { pagination: pagination, filters });
    return response.data;
  } catch (error)
  {
    throw error;
  }
};

export const getUser = async (userId: number) => {
  try {
    const response = await api.get(`${endpoints.getSingleUser}/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId: number, data: Partial<UserData>)  => {
  try {

    const response = await api.put(`${endpoints.updateUser}/${userId}`, data);
     return response.data;
   } catch (error) {
     throw error;
   }
};

export const updateAccount = async (userId: number, data: Partial<UserData>) => {
  try {
    const response = await api.put(`${endpoints.updateAccount}/${userId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId: number) => {
  try {
    const response = await api.delete(`${endpoints.deleteUser}/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};