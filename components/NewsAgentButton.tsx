import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
      activeOpacity={0.88}
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
              borderColor: "rgba(79,140,255,0.16)",
            },
          ]}
        >
          <Feather name="calendar" size={11} color={colors.primary} />
          <Text style={[s.badgeText, { color: colors.primary }]}>
            EFEMÉRIDE
          </Text>
        </View>

        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.86}
          style={[s.dayTitle, { color: colors.text }]}
        >
          {dayTitle.toUpperCase()}
        </Text>
      </View>

      <View style={s.rightContent}>
        <View
          style={[
            s.imageRing,
            {
              borderColor: "rgba(79,140,255,0.32)",
              backgroundColor: "rgba(79,140,255,0.08)",
            },
          ]}
        >
          <Image
            source={agentImage}
            style={s.agentImage}
            resizeMode="cover"
          />
        </View>

        <View
          style={[
            s.askPill,
            {
              backgroundColor: colors.primary,
              borderColor: "rgba(255,255,255,0.18)",
            },
          ]}
        >
          <Feather name="mic" size={10} color="#FFFFFF" />
          <Text style={s.askText}>Tocá para hablar</Text>
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
      paddingVertical: 11,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      overflow: "hidden",
      minHeight: 98,
    },
    leftContent: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      paddingRight: 4,
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
      marginBottom: 7,
    },
    badgeText: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    dayTitle: {
      fontSize: 19,
      lineHeight: 25,
      fontFamily: "Inter_700Bold",
    },
    rightContent: {
      width: 104,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    imageRing: {
      width: 78,
      height: 78,
      borderRadius: 39,
      borderWidth: 2.5,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    agentImage: {
      width: "100%",
      height: "100%",
    },
    askPill: {
      marginTop: -6,
      alignSelf: "flex-end",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
      maxWidth: 100,
    },
    askText: {
      color: "#FFFFFF",
      fontSize: 10,
      lineHeight: 12,
      fontFamily: "Inter_700Bold",
    },
  });