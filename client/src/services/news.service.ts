import api from "@/config/api";
import { endpoints } from "@/config/routes";
import { Pagination } from "./dashboard.service";
import { addToFormData } from "@/utils/formData";

export interface NewsData
{
  title: string;
  content: string;
  author: string;
  is_active: number | string;
}

export const getNews = async (newsId: number) =>
{
  try
  {
    const response = await api.get(`${endpoints.getNews}/${newsId}`);
    return response.data;
  } catch (error)
  {
    throw error;
  }
};

export const getAllNews = async (pagination: Pagination) =>
{
  try
  {
    const response = await api.post(endpoints.getAllNews, { pagination });
    return response.data;
  } catch (error)
  {
    throw error;
  }
};

export const addNews = async (data: Partial<NewsData>) =>
{
  try
  {
    const formData = new FormData();
    addToFormData(data, formData);

    const response = await api.post(endpoints.addNews, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    //const response = await api.post(endpoints.addNews, data);
    return response.data;
  } catch (error)
  {
    throw error;
  }
};

export const updateNews = async (newsId: number) =>
{
  try
  {
    const response = await api.put(`${endpoints.updateNews}/${newsId}`);
    return response.data;
  } catch (error)
  {
    throw error;
  }
};

export const deleteNews = async (newsId: number) =>
{
  try
  {
    const response = await api.delete(`${endpoints.deleteNews}/${newsId}`);
    return response.data;
  } catch (error)
  {
    throw error;
  }
};
