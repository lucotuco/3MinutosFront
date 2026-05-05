import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DigestCard } from "@/components/DigestCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";

type WeatherState = {
  label: string;
  loading: boolean;
};

function formatTodayLabel() {
  const today = new Date();

  const formatted = today.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getCityFromAddress(address: Location.LocationGeocodedAddress) {
  return (
    address.city ||
    address.subregion ||
    address.region ||
    address.district ||
    "tu zona"
  );
}

async function fetchCurrentWeatherLabel(): Promise<string> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    return "";
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m` +
    `&timezone=auto`;

  const response = await fetch(weatherUrl);

  if (!response.ok) {
    throw new Error(`Weather HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    current?: {
      temperature_2m?: number;
    };
  };

  const temperature = data.current?.temperature_2m;

  if (typeof temperature !== "number") {
    return "";
  }

  let city = "tu zona";

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses[0]) {
      city = getCityFromAddress(addresses[0]);
    }
  } catch {
    city = "tu zona";
  }

  return `${Math.round(temperature)}° en ${city}`;
}

export default function DigestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [weather, setWeather] = useState<WeatherState>({
    label: "",
    loading: true,
  });

  const lastMarkedKeyRef = useRef<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["digest", userId],
    queryFn: () => api.getDigest(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      try {
        const label = await fetchCurrentWeatherLabel();

        if (!cancelled) {
          setWeather({
            label,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setWeather({
            label: "",
            loading: false,
          });
        }
      }
    };

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId || !data?.digest?.items?.length) return;

    const markKey = JSON.stringify({
      items: data.digest.items.map((item) => ({
        articleId: item.articleId ?? "",
        url: item.url ?? "",
        topic: item.topic ?? "",
      })),
    });

    if (lastMarkedKeyRef.current === markKey) return;

    lastMarkedKeyRef.current = markKey;

    api
      .markDigestShown(userId, {
        items: data.digest.items,
      })
      .catch(() => {});
  }, [userId, data]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const handlePlayDigest = async () => {
    try {
      if (!data?.digest?.audioUrl) return;

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlaying(false);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: data.digest.audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
          setPlaying(false);
        }
      });
    } catch (error) {
      console.log("Error reproduciendo digest:", error);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!userId) return;

    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await api.refreshDigest(userId);
      queryClient.setQueryData(["digest", userId], result);
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, [userId, queryClient]);

  const s = makeStyles(colors);

  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const botPad =
    Platform.OS === "web"
      ? 110
      : Platform.OS === "android"
        ? insets.bottom + 130
        : insets.bottom + 110;

  const displayName = data?.user?.name ? `, ${data.user.name}` : "";
  const todayLabel = formatTodayLabel();

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={s.brandRow}>
          <Text style={[s.logoBlue, { color: colors.primary }]}>3</Text>
          <Text style={[s.logoText, { color: colors.foreground }]}>Minutos</Text>
        </View>

        <TouchableOpacity
          style={[
            s.refreshBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="refresh-cw" size={16} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[s.heroText, { color: colors.foreground }]}>
          Buen día{displayName}.
        </Text>

        <View
          style={[
            s.infoPill,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="calendar" size={13} color={colors.primary} />
          <Text style={[s.infoText, { color: colors.accentForeground }]}>
            {todayLabel}
          </Text>

          {weather.loading ? (
            <>
              <Text style={[s.infoDot, { color: colors.mutedForeground }]}>•</Text>
              <ActivityIndicator size="small" color={colors.primary} />
            </>
          ) : weather.label ? (
            <>
              <Text style={[s.infoDot, { color: colors.mutedForeground }]}>•</Text>
              <Feather name="sun" size={13} color={colors.primary} />
              <Text style={[s.infoText, { color: colors.accentForeground }]}>
                {weather.label}
              </Text>
            </>
          ) : null}
        </View>

        {isLoading && <LoadingState />}

        {isError && (
          <ErrorState
            message={(error as Error)?.message}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading &&
          !isError &&
          (!data?.digest?.items || data.digest.items.length === 0) && (
            <EmptyState
              icon="book-open"
              title="No hay noticias aún"
              description="Tu digest se está preparando. Vuelve más tarde o actualiza manualmente."
              actionLabel="Actualizar"
              onAction={handleRefresh}
            />
          )}

        {!isLoading && !isError && data?.digest?.items && data.digest.items.length > 0 && (
          <>
            {data.digest.items.slice(0, 3).map((item, i) => (
              <DigestCard
                key={item.articleId ?? `${item.url ?? ""}-${i}`}
                item={item}
                index={i}
              />
            ))}

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                s.listenButton,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  opacity: data.digest.audioUrl ? 1 : 0.5,
                },
              ]}
              onPress={handlePlayDigest}
              disabled={!data.digest.audioUrl}
            >
              <View style={[s.playCircle, { backgroundColor: colors.primary }]}>
                <Feather
                  name={playing ? "pause" : "play"}
                  size={16}
                  color="#FFFFFF"
                />
              </View>

              <View style={s.listenTextWrap}>
                <Text style={[s.listenTitle, { color: colors.foreground }]}>
                  Escuchar resumen
                </Text>
                <Text style={[s.listenSub, { color: colors.mutedForeground }]}>
                  {data.digest.audioUrl ? "Disponible" : "Generando audio"}
                </Text>
              </View>

              <Feather name="volume-2" size={18} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingBottom: 8,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    logoBlue: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
    },
    logoText: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
    },
    refreshBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: {
      paddingHorizontal: 18,
      paddingTop: 4,
    },
    heroText: {
      fontSize: 24,
      lineHeight: 24,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
    },
    infoPill: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 14,
    },
    infoText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.2,
    },
    infoDot: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      marginHorizontal: 2,
    },
    listenButton: {
      marginTop: 2,
      marginBottom: 6,
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    playCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    listenTextWrap: {
      flex: 1,
    },
    listenTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
    listenSub: {
      marginTop: 1,
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
  });