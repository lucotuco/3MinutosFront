import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { api } from "@/services/api";
import { registerForPushNotificationsAsync } from "@/services/notifications";

type UserContextValue = {
  userId: string | null;
  isLoading: boolean;
  setUserId: (id: string) => Promise<void>;
  clearUserId: () => Promise<void>;
};

const STORAGE_KEY = "user:id";

const UserContext = createContext<UserContextValue>({
  userId: null,
  isLoading: true,
  setUserId: async () => {},
  clearUserId: async () => {},
});

type Props = { children: ReactNode };

export function UserProvider({ children }: Props) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const isMongoId = /^[a-fA-F0-9]{24}$/.test(stored ?? "");

        if (stored && isMongoId) {
          setUserIdState(stored);
        } else if (stored) {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn("Unable to load stored user id", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
  if (!userId) {
    console.log("[Push] no hay userId, no registro token");
    return;
  }

  const registerPush = async () => {
    try {
      console.log("[Push] intentando registrar token para userId:", userId);

      const expoPushToken = await registerForPushNotificationsAsync();
      console.log("[Push] token obtenido:", expoPushToken);

      const response = await api.updatePushToken(userId, expoPushToken);
      console.log("[Push] respuesta backend guardando token:", response);
    } catch (err) {
      console.warn("[Push] no se pudo registrar el token", err);
    }
  };

  registerPush();
}, [userId]);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[Push] recibida en foreground:", notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[Push] usuario tocó la notificación:", response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  const setUserId = useCallback(async (id: string) => {
    setUserIdState(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, id);
    } catch (err) {
      console.warn("Failed to persist user id", err);
    }
  }, []);

  const clearUserId = useCallback(async () => {
    setUserIdState(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("Failed to clear stored user id", err);
    }
  }, []);

  const value = useMemo(
    () => ({ userId, isLoading, setUserId, clearUserId }),
    [userId, isLoading, setUserId, clearUserId]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}