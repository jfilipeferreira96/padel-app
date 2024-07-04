"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import jwt, { JwtPayload } from "jsonwebtoken";
import { notifications } from "@mantine/notifications";
import { UserType } from "@/services/auth.service";
import { getConfig } from "@/services/dashboard.service";

export interface User {
  id: string;
  email: string;
  user_type: UserType | string;
  first_name: string;
  last_name: string;
  birthdate: string | Date;
  locations?: { location_id: number; location_name: string }[];
  offpeaks?: { offpeak_card_id: number; name: string; valid_until: Date; month: number; year: number }[];
}

interface DecodedToken extends JwtPayload {
  user: User;
  exp: number;
}

type sessionProps = (userData: User, accessToken: string, redirect?: boolean | undefined) => void;

interface SessionContextProps {
  user: User | null | any;
  sessionLogin: sessionProps;
  logout: () => void;
  isReady: boolean;
  updateUser: (newUserData: Partial<User>) => void;
  config: { torneios: string; ligas: string, isReady: boolean };
}

const SessionContext = createContext<SessionContextProps | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [config, setConfig] = useState({ torneios: "", ligas: "", isReady: false });
  const pathname = usePathname();

  const sessionLogin: sessionProps = (userData, accessToken, redirect = true) => {
    setUser(userData);
    localStorage.setItem("accessToken", accessToken);

    if (redirect) {
      router.push(routes.home.url);
    }
  };

  const logout = (redirect = true) => {
    setUser(null);
    localStorage.removeItem("accessToken");

    if (redirect) {
      router.push(routes.signin.url);
    }
  };

  const getSession = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken") ?? "";
      const currentDate = new Date();

      if (accessToken) {
        const decodedToken = jwt.decode(accessToken) as DecodedToken;

        if (decodedToken.exp * 1000 < currentDate.getTime()) {
          notifications.show({
            title: "Erro",
            message: "Sessão expirou",
            color: "red",
          });

          logout(true);
          return;
        }

        const userData = {
          id: decodedToken.id,
          email: decodedToken.email,
          user_type: decodedToken.user_type,
          first_name: decodedToken.first_name,
          last_name: decodedToken.last_name,
          birthdate: decodedToken.birthdate,
          locations: decodedToken.locations,
          offpeaks: decodedToken?.offpeaks ?? [],
        };

        sessionLogin(userData, accessToken, false);
      } else {
        logout(false);
        return;
      }
      setIsReady(true);
    } catch (error) {
      console.error("Erro ao decodificar o token:", error);
      return null;
    }
  };

  const fetchConfig = async () => {
    try {
      const configResponse = await getConfig();
      if (configResponse.status) {
        setConfig({
          torneios: configResponse.data.torneios || "",
          ligas: configResponse.data.ligas || "",
          isReady: true
        });
      } else {
        notifications.show({
          title: "Erro",
          message: "Não foi possível carregar as configurações",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar as configurações",
        color: "red",
      });
    }
  };

  useEffect(() => {
    getSession();
    fetchConfig();
  }, []);

  const updateUser = (newUserData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
  };

  return <SessionContext.Provider value={{ isReady, user, sessionLogin, logout, updateUser, config }}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextProps => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
