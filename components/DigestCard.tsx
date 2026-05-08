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

const rankColors = ["#EF4444", "#3B82F6","#22C55E"];

export function DigestCard({ item, index }: DigestCardProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const rankColor = rankColors[index % rankColors.length];

  const title = item.neutralTitle || item.title || "Sin título";
  const lead = item.neutralLead || item.lead || "";
  const summary =
    item.neutralSummary ||
    item.summary ||
    lead ||
    "No hay más información disponible para esta noticia.";

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
      activeOpacity={0.88}
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
        numberOfLines={expanded ? undefined : 2}
      >
        {title}
      </Text>

      {lead ? (
        <Text
          style={[styles.lead, { color: colors.accentForeground }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {lead}
        </Text>
      ) : null}

      {expanded ? (
        <View style={styles.expandedBlock}>
          <Text style={[styles.summary, { color: colors.mutedForeground }]}>
            {summary}
          </Text>

          {item.url ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.linkButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.secondary,
                },
              ]}
              onPress={openUrl}
            >
              <Feather name="external-link" size={13} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Leer fuente
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
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
    letterSpacing: 0.35,
  },
  metaSmall: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontFamily: "Inter_700Bold",
  },
  lead: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: "Inter_500Medium",
  },
  expandedBlock: {
    marginTop: 2,
    gap: 7,
  },
  summary: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
  },
  linkButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});