import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import agentImage from "../assets/images/agent-dan.png";

type Props = {
  dayTitle?: string;
};

export function NewsAgentButton({ dayTitle = "Panadero" }: Props) {
  const colors = useColors();
  const s = makeStyles(colors);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push("/news-agent")}
      style={[
        s.card,
        {
          backgroundColor: colors.card,
          borderColor: "rgba(79,140,255,0.18)",
        },
      ]}
    >
      <View style={s.leftContent}>
        <View
          style={[
            s.badge,
            {
              backgroundColor: "rgba(79,140,255,0.10)",
              borderColor: "rgba(79,140,255,0.20)",
            },
          ]}
        >
          <Feather name="calendar" size={12} color={colors.primary} />
          <Text style={[s.badgeText, { color: colors.accentForeground }]}>
            HOY ES EL DÍA DEL
          </Text>
        </View>

        <Text style={[s.dayTitle, { color: colors.text }]} numberOfLines={2}>
          {dayTitle}
        </Text>

        <View
          style={[
            s.askPill,
            {
              backgroundColor: "rgba(255,255,255,0.04)",
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="mic" size={13} color={colors.primary} />
          <Text style={[s.askText, { color: colors.text }]}>
            Tocá para hablar con DAN
          </Text>
        </View>
      </View>

      <View style={s.rightContent}>
        <View
          style={[
            s.imageRing,
            {
              borderColor: colors.primary,
              backgroundColor: "rgba(79,140,255,0.08)",
            },
          ]}
        >
          <Image source={agentImage} style={s.agentImage} resizeMode="cover" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      overflow: "hidden",
      minHeight: 90,
    },

    leftContent: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },

    badge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginBottom: 8,
    },

    badgeText: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },

    dayTitle: {
      fontSize: 20,
      lineHeight: 29,
      fontFamily: "Inter_700Bold",
      marginBottom: 10,
    },

    askPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    askText: {
      fontSize: 12,
      lineHeight: 15,
      fontFamily: "Inter_600SemiBold",
    },

    rightContent: {
      width: 90,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    imageRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2.5,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    agentImage: {
      width: "100%",
      height: "100%",
    },
  });