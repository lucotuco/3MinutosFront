import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ActivityIndicator, View, Text, Image } from "react-native";
import appLogo from "../assets/images/icon.png";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider, useUser } from "@/context/UserContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

function RootLayoutNav() {
  const { isLoading } = useUser();
const [forceDelay, setForceDelay] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setForceDelay(false);
    }, 3000); 
    return () => clearTimeout(timer);
  }, []);
  if (isLoading || forceDelay) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#05070B",
          gap: 24, 
        }}
      >
        <Image
          source={appLogo}
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
          }}
          resizeMode="contain"
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            fontFamily: "Inter_600SemiBold",
            color: "#9AA4BF", 
            textAlign: "center",
            paddingHorizontal: 40,
            lineHeight: 22,
          }}
        >
          Información clave. Sin ruido. En 3 minutos.
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <RootLayoutNav />
      </UserProvider>
    </QueryClientProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
    </ErrorBoundary>
  );
}