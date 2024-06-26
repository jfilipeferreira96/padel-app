import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import qs from "qs";
import { routes } from "@/config/routes";
import jwt, { JwtPayload } from "jsonwebtoken";

const paramsSerializer = (params: any) => {
  return qs.stringify(params, { arrayFormat: "brackets" });
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: paramsSerializer,
} as AxiosRequestConfig);

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage?.getItem("accessToken");
    const refreshToken = localStorage?.getItem("refreshToken");

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (refreshToken) {
      config.headers["Refresh-Token"] = refreshToken; // Corrigido refreshToken
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response && error.response.status === 403) {
      const accessToken = localStorage.getItem("accessToken") ?? "";
      const currentDate = new Date();

      interface DecodedToken extends JwtPayload {
        user: any;
        exp: number;
      }

      if (accessToken) {
        const decodedToken = jwt.decode(accessToken) as DecodedToken;

        if (decodedToken.exp * 1000 < currentDate.getTime()) {
          // Clear tokens from localStorage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");

          // Redirect to signin
          if (typeof window !== "undefined") {
            window.location.href = routes.signin.url;
          }
        }
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
