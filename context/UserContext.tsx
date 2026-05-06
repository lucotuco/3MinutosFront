import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/services/api";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "@/services/session";

type UserContextValue = {
  userId: string | null;
  authToken: string | null;
  isLoading: boolean;
  setSession: (session: { userId: string; authToken: string }) => Promise<void>;
  clearSession: () => Promise<void>;

  /**
   * Compatibilidad temporal con código viejo.
   * No lo uses para usuarios nuevos porque ahora necesitamos authToken.
   */
  setUserId: (id: string) => Promise<void>;
  clearUserId: () => Promise<void>;
};

const UserContext = createContext<UserContextValue>({
  userId: null,
  authToken: null,
  isLoading: true,
  setSession: async () => {},
  clearSession: async () => {},
  setUserId: async () => {},
  clearUserId: async () => {},
});

type Props = {
  children: ReactNode;
};

const isDev = __DEV__;

export function UserProvider({ children }: Props) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const session = await getStoredSession();

        if (session) {
          setUserIdState(session.userId);
          setAuthTokenState(session.authToken);
          api.setAuthToken(session.authToken);
        }
      } catch (err) {
        if (isDev) {
          console.warn("Unable to load stored session", err);
        }

        await clearStoredSession();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!userId || !authToken) return;

    const registerPush = async () => {
      try {
        const expoPushToken = await registerForPushNotificationsAsync();
        await api.updatePushToken(userId, expoPushToken);

        if (isDev) {
          console.log("[Push] token guardado en backend");
        }
      } catch (err) {
        if (isDev) {
          console.warn("[Push] no se pudo registrar el token", err);
        }
      }
    };

    registerPush();
  }, [userId, authToken]);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (isDev) {
          console.log(
            "[Push] recibida en foreground:",
            notification.request.identifier
          );
        }
      }
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (isDev) {
          console.log(
            "[Push] usuario tocó la notificación:",
            response.notification.request.identifier
          );
        }
      }
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  const setSession = useCallback(
    async (session: { userId: string; authToken: string }) => {
      setUserIdState(session.userId);
      setAuthTokenState(session.authToken);
      api.setAuthToken(session.authToken);

      try {
        await setStoredSession(session);
      } catch (err) {
        if (isDev) {
          console.warn("Failed to persist session", err);
        }
      }
    },
    []
  );

  const clearSession = useCallback(async () => {
    setUserIdState(null);
    setAuthTokenState(null);
    api.setAuthToken(null);

    try {
      await clearStoredSession();
    } catch (err) {
      if (isDev) {
        console.warn("Failed to clear stored session", err);
      }
    }
  }, []);

  const setUserId = useCallback(async (_id: string) => {
    throw new Error(
      "setUserId está deprecado. Usá setSession({ userId, authToken })."
    );
  }, []);

  const clearUserId = clearSession;

  const value = useMemo(
    () => ({
      userId,
      authToken,
      isLoading,
      setSession,
      clearSession,
      setUserId,
      clearUserId,
    }),
    [
      userId,
      authToken,
      isLoading,
      setSession,
      clearSession,
      setUserId,
      clearUserId,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}