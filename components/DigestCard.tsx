import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { DigestItem } from "@/services/api";
import { useColors } from "@/hooks/useColors";

interface DigestCardProps {
  item: DigestItem;
  index: number;
}

const rankColors = ["#EF4444", "#22C55E", "#3B82F6"];

export function DigestCard({ item, index }: DigestCardProps) {
  const colors = useColors();

  const openUrl = async () => {
    if (!item.url) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(item.url);
  };

  const rankColor = rankColors[index % rankColors.length];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Text style={styles.rankBadgeText}>{index + 1}</Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={[styles.topic, { color: rankColor }]}>
            {(item.topic || "General").toUpperCase()}
          </Text>

          {(item.region || item.section) ? (
            <Text style={[styles.metaSmall, { color: colors.mutedForeground }]}>
              {[item.region, item.section].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>
        {item.title || "Sin título"}
      </Text>

      <Text style={[styles.summary, { color: colors.mutedForeground }]}>
        {item.summary || "Sin resumen disponible."}
      </Text>

      <View style={styles.footerRow}>
  <View style={styles.footerSpacer} />

  {item.url ? (
    <TouchableOpacity
      style={[
        styles.linkButton,
        {
          backgroundColor: colors.accent,
          borderColor: colors.border,
        },
      ]}
      onPress={openUrl}
      activeOpacity={0.8}
    >
      <Feather name="external-link" size={14} color={colors.primary} />
      <Text style={[styles.linkText, { color: colors.primary }]}>
        Abrir
      </Text>
    </TouchableOpacity>
  ) : null}
</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
  borderRadius: 16,
  borderWidth: 1,
  padding: 12,
  marginBottom: 8,
  gap: 6,
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
},
row: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
rankBadge: {
  width: 22,
  height: 22,
  borderRadius: 11,
  alignItems: "center",
  justifyContent: "center",
},
rankBadgeText: {
  color: "#FFFFFF",
  fontSize: 11,
  fontFamily: "Inter_700Bold",
},
metaBlock: {
  flex: 1,
},
topic: {
  fontSize: 10,
  fontFamily: "Inter_700Bold",
  letterSpacing: 0.3,
},
metaSmall: {
  fontSize: 9,
  fontFamily: "Inter_400Regular",
  marginTop: 1,
},
title: {
  fontSize: 15,
  lineHeight: 19,
  fontFamily: "Inter_700Bold",
},
summary: {
  fontSize: 12,
  lineHeight: 16,
  fontFamily: "Inter_400Regular",
},
footerRow: {
  marginTop: 2,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
footerSpacer: {
  flex: 1,
},
linkButton: {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 6,
},
linkText: {
  fontSize: 12,
  fontFamily: "Inter_600SemiBold",
},
});