import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Pagination } from "./dashboard.service";
import { Filters } from "./user.service";

export interface VoucherData {
  id: number;
  voucher_name: string;
  assigned_at: string;
  assigned_by: number;
  activated_at: string | null;
  activated_by: number | null;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  phone: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  reason: string;
}

export const getVoucher = async (voucherId: number) => {
  try {
    const response = await api.get(`${endpoints.getVoucher}/${voucherId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllVouchersHistory = async (pagination: Pagination, filters: Filters) => {
  try {
    const response = await api.post(endpoints.getAllVouchers, { pagination, filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllVouchers = async () => {
  try {
    const response = await api.get(endpoints.getAllVouchers);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addVoucher = async (data: Partial<VoucherData>) => {
  try {
    const response = await api.post(endpoints.addVoucher, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateVoucher = async (voucherId: number, data: Partial<VoucherData>) => {
  try {
    const response = await api.put(`${endpoints.updateVoucher}/${voucherId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteVoucher = async (voucherId: number) => {
  try {
    const response = await api.delete(`${endpoints.deleteVoucher}/${voucherId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserVouchers = async (userId: number) => {
  try {
    const response = await api.get(`${endpoints.userVoucher}/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignVoucher = async (data: {
  voucher_id: number;
  is_active: number;
  reason: string;
  assigned_to: number;
  credit_limit: number | string | any;
}) => {
  try {
    const response = await api.post(endpoints.assignVoucher, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const ativarVoucher = async (id: number) => {
  try {
    const response = await api.post(endpoints.ativarVoucher, { id });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCreditBalance = async (data: { user_voucher_id: number; new_credit_balance: number }) => {
  try {
    const response = await api.post(endpoints.updateCreditBalance, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVoucherTransactions = async (id: number) =>
{
  try
  {
    const response = await api.get(`${endpoints.getVoucherTransactions}/${id}`);
    return response.data;
  } catch (error)
  {
    throw error;
  }
};