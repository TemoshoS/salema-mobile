import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/config/api";

export async function registerForPushNotificationsAsync() {
  console.log("🔔 PUSH: registration started");

  if (!Device.isDevice) {
    console.log("❌ PUSH: not a physical device");
    return null;
  }

  console.log("✅ PUSH: physical device detected");

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  console.log("🔐 PUSH: existing permission:", existingStatus);

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    console.log("🔐 PUSH: requesting permission...");

    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;

    console.log("🔐 PUSH: permission result:", finalStatus);
  }

  if (finalStatus !== "granted") {
    console.log("❌ PUSH: permission not granted");
    return null;
  }

  console.log("✅ PUSH: permission granted");

  if (Platform.OS === "android") {
    console.log("🤖 PUSH: configuring Android channel");

    await Notifications.setNotificationChannelAsync(
      "emergency",
      {
        name: "Emergency Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      }
    );

    console.log("✅ PUSH: Android channel configured");
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  console.log("🆔 PUSH: projectId:", projectId);

  if (!projectId) {
    console.log("❌ PUSH: Expo project ID not found");
    return null;
  }

  console.log("📲 PUSH: requesting Expo push token...");

  const tokenResponse =
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

const token = tokenResponse.data;

console.log("================================");
console.log("📱 EXPO PUSH TOKEN:");
console.log(token);
console.log("================================");

try {
  console.log("📤 PUSH: saving token to backend...");

  const response = await api.put("/auth/push-token", {
    pushToken: token,
  });

  console.log("✅ PUSH: token saved to backend");
  console.log("📡 PUSH: backend response:", response.data);

} catch (error: any) {
  console.log("❌ PUSH: failed to save token");

  console.log(
    "❌ PUSH:",
    error.response?.data || error.message
  );
}

return token;
}