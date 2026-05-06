import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === "web";
  const isAndroid = Platform.OS === "android";
  const isIOS = Platform.OS === "ios";

  const bottomInset = isWeb ? 0 : insets.bottom;
  const androidLift = isAndroid ? Math.max(bottomInset, 14) : 0;
  const barHeight = isWeb ? 82 : isIOS ? 88 : 76 + androidLift;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: Platform.OS === "ios" ? -8 : -6,
            height: Platform.OS === "ios" ? 78 : 70,
            paddingBottom: Platform.OS === "ios" ? 18 : 10,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 7,
            paddingHorizontal: 10,
          },
          tabBarItemStyle: {
            paddingTop: isAndroid ? 4 : 0,
          },
          tabBarLabelStyle: {
            fontFamily: "Inter_500Medium",
            fontSize: 11,
            marginBottom: isAndroid ? 4 : 4,
          },
          tabBarBackground: () => (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: colors.background,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hoy",
            tabBarIcon: ({ color }) => (
              <Feather name="book-open" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Historial",
            tabBarIcon: ({ color }) => (
              <Feather name="clock" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Ajustes",
            tabBarIcon: ({ color }) => (
              <Feather name="user" size={20} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});