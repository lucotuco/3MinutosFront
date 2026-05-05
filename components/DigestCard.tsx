import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { DigestItem } from "@/services/api";

interface DigestCardProps {
  item: DigestItem;
  index: number;
}

const rankColors = ["#EF4444", "#22C55E", "#3B82F6"];

export function DigestCard({ item, index }: DigestCardProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const rankColor = rankColors[index % rankColors.length];

  const title = item.neutralTitle || item.title || "Sin título";
  const lead = item.neutralLead || item.lead || "";
  const summary =
    item.neutralSummary || item.summary || "Sin resumen disponible.";

  const openUrl = async () => {
    if (!item.url) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(item.url);
  };

  const toggleExpanded = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => !prev);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={toggleExpanded}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Text style={styles.rankBadgeText}>{index + 1}</Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={[styles.topic, { color: rankColor }]} numberOfLines={1}>
            {(item.topic || "General").toUpperCase()}
          </Text>

          {item.region || item.section ? (
            <Text
              style={[styles.metaSmall, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {[item.region, item.section].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </View>

        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </View>

      <Text
        style={[styles.title, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {title}
      </Text>

      {lead ? (
        <Text
          style={[styles.lead, { color: colors.mutedForeground }]}
          numberOfLines={expanded ? 3 : 1}
        >
          {lead}
        </Text>
      ) : null}

      {expanded ? (
        <>
          <Text style={[styles.summary, { color: colors.mutedForeground }]}>
            {summary}
          </Text>

          <View style={styles.footerRow}>
            {typeof item.neutralityScore === "number" ? (
              <View
                style={[
                  styles.neutralBadge,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Feather
                  name="shield"
                  size={12}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.neutralText,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  Neutralidad {Math.round(item.neutralityScore)}%
                </Text>
              </View>
            ) : (
              <View />
            )}

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
                  Abrir fuente
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
    marginBottom: 8,
    gap: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  topRow: {
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
    lineHeight: 18,
    fontFamily: "Inter_700Bold",
  },
  lead: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: "Inter_400Regular",
  },
  summary: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  footerRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  neutralBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexShrink: 1,
  },
  neutralText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
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