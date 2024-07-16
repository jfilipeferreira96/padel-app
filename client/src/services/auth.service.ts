import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Location } from "@/providers/LocationProvider";

export interface LoginData {
  email: string;
  password: string;
}

export enum UserType {
  PLAYER = "player",
  ADMIN = "admin"
}

export interface RegisterData {
  email: string;
  user_type: UserType | string;
  first_name: string;
  last_name: string;
  password: string;
  birthdate?: string | Date;
  locations?: Location[] | any
}

export const login = async (data: LoginData) => {
  try
  {
    const response = await api.post(endpoints.loginRoute, data);

    return response.data;
  }
  catch (error)
  {
    throw error;
  }
};

export const register = async (data: RegisterData) => {
  try
  {
    const response = await api.post(endpoints.registerRoute, data);
    return response.data;
  }
  catch (error)
  {
    throw error;
  }
};