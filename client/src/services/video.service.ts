import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Pagination } from "./dashboard.service";
import { Filters } from "./user.service";

// Interface para o histórico de créditos dos usuários
export interface CreditsHistoryData {
  id: number;
  user_id: number;
  credits_before: number;
  credits_after: number;
  given_by: number;
  created_at: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

// Interface para vídeos processados
export interface VideoProcessedData {
  id: number;
  user_id: number;
  location: string;
  processed_at: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

// Serviço para obter o histórico de créditos
export const getCreditsHistory = async (pagination: Pagination, filters: Filters) => {
  try {
    const response = await api.post(endpoints.getCreditsHistory, { pagination, filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Serviço para obter vídeos processados
export const getVideosProcessed = async (pagination: Pagination, userId?: number) => {
  try {
    const response = await api.post(endpoints.getVideosProcessed, { pagination, userId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVideosWaiting = async (pagination: Pagination, filters: Filters) =>
{
  try
  {
    const response = await api.post(endpoints.getVideosWaiting, { pagination, filters });
    return response.data;
  } catch (error)
  {
    throw error;
  }
};

export const getCreditsVideoPage = async () => {
  try {
    const response = await api.get(endpoints.getCreditsVideoPage);
    return response.data;
  } catch (error) {
    throw error;
  }
};


// Serviço para atualizar os créditos do usuário
export const updateUserCredits = async (userId: number, credits: number) => {
  try {
    const response = await api.put(endpoints.updateUserCredits, { userId, credits });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Serviço para adicionar um vídeo processado
export const addVideoProcessed = async (data: any) => {
  try {
    const response = await api.post(endpoints.addVideoProcessed, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const processVideo = async (videoId: number, accepted: boolean) =>
{
  try
  {
    const response = await api.post(endpoints.processVideo, { videoId, accepted });
    return response.data;
  } catch (error)
  {
    throw error;
  }
};

export const cutVideo = async (videoId: number, startTime: number, endTime: number) => {
  try {
    const response = await api.post(endpoints.cutVideo, { videoId, startTime, endTime });
    return response.data;
  } catch (error) {
    throw error;
  }
};


// Serviço para obter um vídeo processado específico
export const getSingleVideoProcessed = async (videoId: number) => {
  try {
    const response = await api.get(`${endpoints.getSingleVideoProcessed}/${videoId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* //STREAMS
export const fetchCompleteVideo = async (videoId: string) => {
  try {
    const response = await api.get(`${endpoints.completeVideo}/${videoId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const parsedVideo = async (videoId: string) => {
  try {
    const response = await api.get(`${endpoints.completeVideo}/${videoId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

 */