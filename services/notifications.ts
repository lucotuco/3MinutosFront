import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const isDev = __DEV__;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId
  );
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    throw new Error("Las push remotas requieren un dispositivo real.");
  }

  const permsBefore = await Notifications.getPermissionsAsync();
  let finalStatus = permsBefore.status;

  if (finalStatus !== "granted") {
    const permsAfter = await Notifications.requestPermissionsAsync();
    finalStatus = permsAfter.status;
  }

  if (finalStatus !== "granted") {
    throw new Error("Permiso de notificaciones denegado.");
  }

  const projectId = getProjectId();

  if (!projectId) {
    throw new Error("No se encontró el projectId de EAS.");
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  if (isDev) {
    console.log("[Push] token obtenido correctamente");
  }

  return tokenResponse.data;
}