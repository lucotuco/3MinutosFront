import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import sponsorLogo from "../../assets/images/banco-comercio.png";
import { NewsAgentButton } from "@/components/NewsAgentButton";
import { DailyAgendaStrip } from "@/components/DailyAgendaStrip";
import { DigestCard } from "@/components/DigestCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
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

function DigestLoadingState() {
  const colors = useColors();
  const s = makeStyles(colors);

  const pulse = useRef(new Animated.Value(0.6)).current;
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.6,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    const dotsLoop = Animated.loop(
      Animated.stagger(180, [
        Animated.sequence([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot1, {
            toValue: 0.25,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot2, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.25,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot3, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.25,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseLoop.start();
    dotsLoop.start();

    return () => {
      pulseLoop.stop();
      dotsLoop.stop();
    };
  }, [dot1, dot2, dot3, pulse]);

  return (
    <View
      style={[
        s.loadingCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Animated.View
        style={[
          s.loadingIconCircle,
          {
            backgroundColor: colors.primary,
            opacity: pulse,
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0.6, 1],
                  outputRange: [0.96, 1.08],
                }),
              },
            ],
          },
        ]}
      >
        <Feather name="zap" size={26} color="#fff" />
      </Animated.View>

      <Text style={[s.loadingTitle, { color: colors.text }]}>
        Estamos buscando las mejores noticias para ti
      </Text>

      <Text style={[s.loadingSubtitle, { color: colors.mutedText }]}>
        Analizando tus temas, filtrando ruido y preparando tu resumen de 3
        minutos.
      </Text>

      <View style={s.dotsRow}>
        <Animated.View
          style={[
            s.dot,
            {
              backgroundColor: colors.primary,
              opacity: dot1,
            },
          ]}
        />
        <Animated.View
          style={[
            s.dot,
            {
              backgroundColor: colors.primary,
              opacity: dot2,
            },
          ]}
        />
        <Animated.View
          style={[
            s.dot,
            {
              backgroundColor: colors.primary,
              opacity: dot3,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function DigestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();

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
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log("Error configurando audio:", error);
      }
    };

    configureAudio();
  }, []);

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

      if (sound && playing) {
        await sound.pauseAsync();
        setPlaying(false);
        return;
      }

      if (sound && !playing) {
        await sound.playAsync();
        setPlaying(true);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: data.digest.audioUrl },
        {
          shouldPlay: true,
          volume: 1,
          isMuted: false,
        }
      );

      setSound(newSound);
      setPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
          setPlaying(false);
          newSound.setPositionAsync(0).catch(() => {});
        }
      });
    } catch (error) {
      console.log("Error reproduciendo digest:", error);
    }
  };

  const handlePullToRefresh = useCallback(async () => {
    if (!userId || refreshing) return;

    setRefreshing(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await api.refreshDigest(userId);
      await refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos generar un nuevo digest.";

      Alert.alert("No se pudo generar un nuevo digest", message);
    } finally {
      setRefreshing(false);
    }
  }, [userId, refreshing, refetch]);

  const s = makeStyles(colors);

  const topPad = Platform.OS === "web" ? 42 : Math.max(insets.top - 4, 0);

  const botPad =
    Platform.OS === "web"
      ? 96
      : Platform.OS === "android"
        ? insets.bottom + 104
        : insets.bottom + 92;

  const todayLabel = formatTodayLabel();

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad }]}>
        <View style={s.brandSponsorRow}>
          <View style={s.brandRow}>
            <Text style={[s.logoBlue, { color: colors.primary }]}>3</Text>
            <Text style={[s.logoText, { color: colors.text }]}> Minutos</Text>
          </View>

          <View
            style={[
              s.sponsorWrapInline,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Image
              source={sponsorLogo}
              style={s.sponsorLogoInline}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          {
            paddingBottom: botPad,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullToRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <DailyAgendaStrip
          todayLabel={todayLabel}
          weatherLabel={weather.label}
          weatherLoading={weather.loading}
        />

        {isLoading && <DigestLoadingState />}

        {isError && (
          <ErrorState
            title="No pudimos cargar tu digest"
            message={
              error instanceof Error
                ? error.message
                : "Ocurrió un error inesperado."
            }
            onRetry={() => refetch()}
          />
        )}

        {!isLoading &&
          !isError &&
          (!data?.digest?.items || data.digest.items.length === 0) && (
            <EmptyState
              title="Todavía no hay noticias"
              message="Cuando tengamos artículos relevantes para tus temas, los vas a ver acá."
            />
          )}

        {!isLoading &&
          !isError &&
          data?.digest?.items &&
          data.digest.items.length > 0 && (
            <>
              {data.digest.items.slice(0, 3).map((item, i) => (
                <DigestCard
                  key={`${item.articleId ?? item.url ?? item.title ?? i}`}
                  item={item}
                  index={i}
                />
              ))}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePlayDigest}
                disabled={!data.digest.audioUrl}
                style={[
                  s.listenButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: data.digest.audioUrl ? 1 : 0.6,
                  },
                ]}
              >
                <View
                  style={[
                    s.playCircle,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Feather
                    name={playing ? "pause" : "play"}
                    size={18}
                    color="#fff"
                  />
                </View>

                <View style={s.listenTextWrap}>
                  <Text style={[s.listenTitle, { color: colors.text }]}>
                    Escuchar resumen
                  </Text>

                  <Text style={[s.listenSub, { color: colors.mutedText }]}>
                    {data.digest.audioUrl ? "Disponible" : "Generando audio"}
                  </Text>
                </View>
              </TouchableOpacity>
              <NewsAgentButton />
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
      paddingHorizontal: 18,
      paddingBottom: 2,
    },

    brandSponsorRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    brandRow: {
      flexDirection: "row",
      alignItems: "baseline",
      flexShrink: 0,
    },

    logoBlue: {
      fontSize: 30,
      fontFamily: "Inter_700Bold",
    },

    logoText: {
      fontSize: 30,
      fontFamily: "Inter_700Bold",
    },

    sponsorWrapInline: {
      flexShrink: 1,
      borderWidth: 1,
      borderRadius: 11,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },

    sponsorLogoInline: {
      width: 126,
      height: 34,
    },

    scroll: {
      paddingHorizontal: 18,
      paddingTop: 0,
    },

    loadingCard: {
      marginTop: 6,
      marginBottom: 12,
      borderWidth: 1,
      borderRadius: 22,
      paddingHorizontal: 20,
      paddingVertical: 22,
      alignItems: "center",
    },

    loadingIconCircle: {
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },

    loadingTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
      marginBottom: 7,
    },

    loadingSubtitle: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginBottom: 15,
    },

    dotsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    listenButton: {
      marginTop: 0,
      marginBottom: 4,
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
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
      fontSize: 15,
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