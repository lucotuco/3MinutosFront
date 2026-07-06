import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { useHandleUserNotFound } from "@/hooks/useHandleUserNotFound";
import { api, ShownArticle } from "@/services/api";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ArticleRow({ item }: { item: ShownArticle }) {
  const colors = useColors();
  const s = rowStyles(colors);
  const [expanded, setExpanded] = useState(false);

  const title = item.title || "Sin título";
  const summary = item.summary || "No hay más información disponible para esta noticia.";

  const openUrl = async () => {
    if (!item.articleUrl) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(item.articleUrl);
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
        s.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={s.topRow}>
        <View style={s.metaBlock}>
          <Text style={[s.topic, { color: colors.mutedForeground }]} numberOfLines={1}>
            {(item.topic || "General").toUpperCase()}
          </Text>
          <Text
            style={[s.metaSmall, { color: colors.mutedForeground, marginTop: 1 }]}
            numberOfLines={1}
          >
            {formatDate(item.shownAt)}
          </Text>
        </View>

        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </View>

      <Text
        style={[s.title, { color: colors.foreground }]}
        numberOfLines={expanded ? undefined : 2}
      >
        {title}
      </Text>

      {expanded ? (
        <View style={s.expandedBlock}>
          <Text style={[s.summary, { color: colors.mutedForeground }]}>
            {summary}
          </Text>

          {item.articleUrl ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                s.linkButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.secondary,
                },
              ]}
              onPress={openUrl}
            >
              <Feather name="external-link" size={13} color={colors.primary} />
              <Text style={[s.linkText, { color: colors.primary }]}>
                Leer noticia
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <Text
          style={[s.lead, { color: colors.accentForeground }]}
          numberOfLines={2}
        >
          {summary}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const rowStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
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

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();
  const { handleError } = useHandleUserNotFound();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["shown-articles", userId],
    queryFn: () => api.getShownArticles(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  const s = makeStyles(colors);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.foreground }]}>Historial</Text>
        {data && data.length > 0 && (
          <Text style={[s.count, { color: colors.mutedForeground }]}>
            {data.length} artículos
          </Text>
        )}
      </View>

      {isLoading && (
        <View style={{ padding: 20 }}>
          <LoadingState />
        </View>
      )}

      {isError && (
        <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && (
        <FlatList
          data={data ?? []}
          keyExtractor={(item, i) => `${item.articleUrl ?? item.articleId ?? i}-${item.shownAt}`}
          renderItem={({ item }) => <ArticleRow item={item} />}
          contentContainerStyle={[s.list, { paddingBottom: botPad }]}
          scrollEnabled={!!data && data.length > 0}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="clock"
              title="Sin historial"
              description="Las noticias que leas aparecerán aquí."
            />
          }
        />
      )}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1 },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
    },
    count: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    list: {
      padding: 20,
    },
  });