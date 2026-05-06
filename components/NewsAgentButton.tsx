import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function NewsAgentButton() {
  const colors = useColors();
  const s = makeStyles(colors);

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={() => router.push("/news-agent")}
      style={[
        s.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          s.iconWrap,
          {
            backgroundColor: "rgba(59,130,246,0.14)",
          },
        ]}
      >
        <Feather name="mic" size={17} color={colors.primary} />
      </View>

      <View style={s.content}>
        <Text style={[s.title, { color: colors.text }]}>
          Hablar sobre estas noticias
        </Text>

        <Text
          numberOfLines={1}
          style={[s.subtitle, { color: colors.mutedText }]}
        >
          Preguntale al agente por contexto o impacto.
        </Text>
      </View>

      <Feather name="chevron-right" size={17} color={colors.mutedText} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 9,
      marginTop: 0,
      marginBottom: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    content: {
      flex: 1,
      minWidth: 0,
    },

    title: {
      fontSize: 14,
      lineHeight: 17,
      fontFamily: "Inter_700Bold",
      marginBottom: 1,
    },

    subtitle: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: "Inter_500Medium",
    },
  });