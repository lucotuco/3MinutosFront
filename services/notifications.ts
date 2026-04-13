import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  console.log("[Push] arrancando registro");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
    console.log("[Push] canal android creado");
  }

  console.log("[Push] Device.isDevice:", Device.isDevice);

  if (!Device.isDevice) {
    throw new Error("Las push remotas requieren un dispositivo real.");
  }

  const permsBefore = await Notifications.getPermissionsAsync();
  console.log("[Push] permisos antes:", permsBefore);

  let finalStatus = permsBefore.status;

  if (finalStatus !== "granted") {
    const permsAfter = await Notifications.requestPermissionsAsync();
    console.log("[Push] permisos después:", permsAfter);
    finalStatus = permsAfter.status;
  }

  if (finalStatus !== "granted") {
    throw new Error("Permiso de notificaciones denegado.");
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  console.log("[Push] projectId:", projectId);
  console.log("[Push] expoConfig?.extra:", Constants?.expoConfig?.extra);
  console.log("[Push] easConfig:", Constants?.easConfig);

  if (!projectId) {
    throw new Error("No se encontró el projectId de EAS.");
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  console.log("[Push] tokenResponse:", tokenResponse);

  return tokenResponse.data;
}