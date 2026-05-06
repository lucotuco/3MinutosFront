import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "user:id";
const AUTH_TOKEN_KEY = "user:authToken";

export type StoredSession = {
  userId: string;
  authToken: string;
};

export async function getStoredSession(): Promise<StoredSession | null> {
  const [userId, authToken] = await Promise.all([
    AsyncStorage.getItem(USER_ID_KEY),
    AsyncStorage.getItem(AUTH_TOKEN_KEY),
  ]);

  const isMongoId = /^[a-fA-F0-9]{24}$/.test(userId ?? "");

  if (!userId || !authToken || !isMongoId) {
    await clearStoredSession();
    return null;
  }

  return {
    userId,
    authToken,
  };
}

export async function setStoredSession(session: StoredSession): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(USER_ID_KEY, session.userId),
    AsyncStorage.setItem(AUTH_TOKEN_KEY, session.authToken),
  ]);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(USER_ID_KEY),
    AsyncStorage.removeItem(AUTH_TOKEN_KEY),
  ]);
}