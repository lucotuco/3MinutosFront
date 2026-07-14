import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { usePostHog } from 'posthog-react-native';
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Linking,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DailyAgendaStrip } from "@/components/DailyAgendaStrip";
import { DigestCard } from "@/components/DigestCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { useHandleUserNotFound } from "@/hooks/useHandleUserNotFound";
import { api } from "@/services/api";
import sponsorLogo from "../../assets/images/banco-comercio.png";
import { getTodayEfemeride } from "@/constants/efemerides";
import { useQueryClient } from "@tanstack/react-query";

type WeatherState = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  loading: boolean;
};
const handlePress = () => {

  Linking.openURL('https://www.bancodecomercio.com.ar/home');
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
  const isValidName = (name?: string | null) => name && name.length > 3;

  if (address.city === "CABA" || address.region === "CABA" || address.subregion === "CABA") {
    return "CABA";
  }
  if (isValidName(address.city)) return address.city;
  if (isValidName(address.district)) return address.district;
  if (isValidName(address.subregion)) return address.subregion;
  if (isValidName(address.region)) return address.region;

  return "tu zona";
}

// Mapeamos los códigos WMO de Open-Meteo a íconos de Feather
function getWeatherIcon(code: number): keyof typeof Feather.glyphMap {
  if (code === 0) return "sun"; // Despejado
  if (code === 1 || code === 2 || code === 3) return "cloud"; // Parcialmente nublado / Nublado
  if (code === 45 || code === 48) return "cloud"; // Niebla
  if (code >= 51 && code <= 57) return "cloud-drizzle"; // Llovizna
  if (code >= 61 && code <= 67) return "cloud-rain"; // Lluvia
  if (code >= 71 && code <= 77) return "cloud-snow"; // Nieve
  if (code >= 80 && code <= 82) return "cloud-rain"; // Chubascos
  if (code >= 95 && code <= 99) return "cloud-lightning"; // Tormenta
  return "cloud"; // Fallback por defecto
}

async function fetchCurrentWeather(): Promise<{ label: string; icon: keyof typeof Feather.glyphMap }> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    return { label: "", icon: "cloud" };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;

  // Agregamos weather_code a la URL
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,weather_code` +
    `&timezone=auto`;

  const response = await fetch(weatherUrl);

  if (!response.ok) {
    throw new Error(`Weather HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    current?: {
      temperature_2m?: number;
      weather_code?: number;
    };
  };

  const temperature = data.current?.temperature_2m;
  const code = data.current?.weather_code ?? -1;

  if (typeof temperature !== "number") {
    return { label: "", icon: "cloud" };
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

  return {
    label: `${Math.round(temperature)}° en ${city}`,
    icon: getWeatherIcon(code),
  };
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
  const { handleError } = useHandleUserNotFound();
  const dynamicDayTitle = getTodayEfemeride();

  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const [showTutorial, setShowTutorial] = useState(false);

  const [weather, setWeather] = useState<WeatherState>({
    label: "",
    icon: "cloud",
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
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

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
    const checkTutorial = async () => {
      try {
        // Buscamos si la bandera existe en el almacenamiento local
        const visto = await AsyncStorage.getItem("home_tutorial_visto");
        if (!visto) {
          // Si nunca lo vio, encendemos el Modal flotante
          setShowTutorial(true);
        }
      } catch (err) {
        console.log("Error leyendo tutorial cache", err);
      }
    };

    // Solo mostramos el tutorial cuando las noticias ya terminaron de cargar
    if (!isLoading && data?.digest?.items?.length) {
      checkTutorial();
    }
  }, [isLoading, data]);

  const closeTutorialModal = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Guardamos la marca en memoria para que no vuelva a molestar jamás
      await AsyncStorage.setItem("home_tutorial_visto", "true");
      setShowTutorial(false);
    } catch (err) {
      setShowTutorial(false);
    }
  };

  useEffect(() => {
    if (sound) {
      console.log("🔄 [AUDIO FRONT] Detectado cambio de noticias (Refresh). Reseteando reproductor...");
      sound.unloadAsync()
        .then(() => {
          setSound(null);
          setPlaying(false);
        })
        .catch((err) => console.log("Error descargando audio en refresh:", err));
    }
  }, [data?.digest?.items]);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      try {
        const { label, icon } = await fetchCurrentWeather();

        if (!cancelled) {
          setWeather({
            label,
            icon,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setWeather({
            label: "",
            icon: "cloud",
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
    if (posthog && data.user) {
      posthog.identify(userId, {
        name: data.user.name,
        topic_distribution: data.user.topics, // Array con los 3 tópicos
        delivery_time: data.user.deliveryTime // Guarda su hora elegida (ej. "08:00")
      });
    }
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
      .catch(() => { });
  }, [userId, data]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => { });
      }
    };
  }, [sound]);

  const [loadingAudio, setLoadingAudio] = useState(false);

  const [nextSound, setNextSound] = useState<Audio.Sound | null>(null);

  const [loadingText, setLoadingText] = useState("Buscando las mejores noticias...");

  useEffect(() => {
    if (!isLoading && !refreshing) return;

    const phrases = [
      "Analizando tus Categorias...",
      "Buscando las mejores noticias...",
      "Redactando tu resumen...",
      "Sintetizando la información...",
      "Afinando últimos detalles..."
    ];
    let i = 0;

    const interval = setInterval(() => {
      i = (i + 1) % phrases.length;
      setLoadingText(phrases[i]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading, refreshing]);

  const handlePlayDigest = async () => {
    try {
      if (!userId) return;

      // Si el audio ya existe y está cargado, manejamos pausa/play normal
      if (sound) {
        if (playing) {
          await sound.pauseAsync();
          setPlaying(false);
        } else {
          await sound.playAsync();
          setPlaying(true);
          posthog.capture('audio_play_clicked', { state: 'resumed' });
        }
        return;
      }

      setLoadingAudio(true);
      posthog.capture('audio_play_clicked', { state: 'new_generation' });
      const res = await api.playDigest(userId);

      if (!res.success || !res.playlist || res.playlist.length === 0) {
        setLoadingAudio(false);
        Alert.alert("Error", "No pudimos preparar tu playlist de audio.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const playlist = res.playlist;
      let currentTrackIndex = 0;
      let loadedNextSound: Audio.Sound | null = null;

      // Función auxiliar para precargar un track en segundo plano
      const preloadTrack = async (index: number) => {
        if (index >= playlist.length) return null;
        try {
          const { sound: preloaded } = await Audio.Sound.createAsync(
            { uri: playlist[index] },
            { shouldPlay: false, volume: 1 }
          );
          return preloaded;
        } catch (e) {
          console.log(`Error precargando track ${index}:`, e);
          return null;
        }
      };

      // Función principal de reproducción
      const playTrack = async (index: number, preloadedSoundObject: Audio.Sound | null) => {
        if (index >= playlist.length) {
          setPlaying(false);
          setSound(null);
          setNextSound(null);
          return;
        }

        let activeSound: Audio.Sound;

        // Si ya teníamos el audio precargado en memoria, lo usamos directamente (¡Gaps de 0ms!)
        if (preloadedSoundObject) {
          activeSound = preloadedSoundObject;
        } else {
          // Fallback por si no llegó a precargarse a tiempo
          const { sound: loaded } = await Audio.Sound.createAsync(
            { uri: playlist[index] },
            { shouldPlay: false, volume: 1 }
          );
          activeSound = loaded;
        }

        setSound(activeSound);
        setPlaying(true);
        setLoadingAudio(false);

        // Arrancamos la reproducción del track actual
        await activeSound.playAsync();

        // 🚀 LA MAGIA: Mientras suena este track, ya empezamos a descargar el SIGUIENTE
        const nextIndex = index + 1;
        loadedNextSound = await preloadTrack(nextIndex);
        setNextSound(loadedNextSound);

        // Monitoreamos cuándo termina el track actual
        activeSound.setOnPlaybackStatusUpdate(async (status) => {
          if (!status.isLoaded) return;

          if (status.didJustFinish) {
            // Limpiamos el audio viejo de la memoria
            await activeSound.unloadAsync().catch(() => { });

            // Saltamos al siguiente pasándole el objeto que YA está descargado
            currentTrackIndex++;
            if (currentTrackIndex >= playlist.length) {
              posthog.capture('audio_completed');
            }
            playTrack(currentTrackIndex, loadedNextSound);
          }
        });
      };

      // Arrancamos cargando el primer audio de la lista (el saludo)
      playTrack(currentTrackIndex, null);

    } catch (error) {
      setLoadingAudio(false);
      console.log("Error reproduciendo digest:", error);
      Alert.alert("Error", "Hubo un problema al generar o reproducir el audio.");
    }
  };

  const handlePullToRefresh = useCallback(async () => {
    if (!userId || refreshing) return;

    setRefreshing(true);
    posthog.capture('digest_refreshed');

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (sound) {
        await sound.stopAsync().catch(() => { });
        await sound.unloadAsync().catch(() => { });
        setSound(null);
        setPlaying(false);
      }
      await api.refreshDigest(userId);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["shown-articles", userId] });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos generar un nuevo resumen.";

      Alert.alert("No se pudo generar un nuevo resumen", message);
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



  // Usamos usedFallback que envía el backend
  const hasFallbackItems = data?.digest?.items?.some(
    (item) => item.usedFallback
  );
  useEffect(() => {
    if (hasFallbackItems && posthog) {
      posthog.capture('fallback_shown');
    }
  }, [hasFallbackItems, posthog]);


  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad }]}>
        <View style={s.brandSponsorRow}>
          <View style={s.brandRow}>
            <Text style={[s.logoBlue, { color: colors.primary }]}>3</Text>
            <Text style={[s.logoText, { color: colors.text }]}>Minutos</Text>
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
            <TouchableOpacity onPress={handlePress}>
              {/*<Image
                source={sponsorLogo}
                style={s.sponsorLogoInline}
                resizeMode="contain"
              />*/}
              <Text style={[{ color: colors.text, fontSize:18 }]}>Queres anunciar aqui?</Text>
            </TouchableOpacity>
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
        onScroll={({ nativeEvent }) => {
          // Detectar si llegó cerca del final (al 90% del scroll)
          const isCloseToBottom =
            nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
            nativeEvent.contentSize.height - 50;

          if (isCloseToBottom) {
            // Un pequeño truco para dispararlo solo una vez
            if (!lastMarkedKeyRef.current?.includes("completed")) {
              posthog.capture('digest_completed');
              // Marcamos que ya se disparó
              lastMarkedKeyRef.current = (lastMarkedKeyRef.current || "") + "_completed";
            }
          }
        }}
        scrollEventThrottle={400} // Para que no llame a la función mil veces por segundo
      >
        <DailyAgendaStrip
          todayLabel={todayLabel}
          weatherLabel={weather.label}
          weatherIcon={weather.icon}
          weatherLoading={weather.loading}
        />

        {(isLoading || refreshing) && (
          <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 20 }}>
            <DigestLoadingState />
            <Text style={{
              marginTop: 16,
              fontSize: 15,
              fontWeight: "600",
              color: colors.primary,
              textAlign: "center"
            }}>
              {loadingText}
            </Text>
          </View>
        )}

        {isError && (
          <ErrorState
            title="No pudimos cargar tu resumen"
            message={
              error instanceof Error
                ? error.message
                : "Ocurrió un error inesperado."
            }
            onRetry={() => refetch()}
          />
        )}

        {/* Agregamos el !refreshing para que esto desaparezca mientras carga */}
        {!isLoading && !refreshing &&
          !isError &&
          (!data?.digest?.items || data.digest.items.length === 0) && (
            <EmptyState
              title="Todavía no hay noticias"
              message="Cuando tengamos artículos relevantes para tus temas, los vas a ver acá."
            />
          )}

        {/* Agregamos el !refreshing para que las noticias viejas se oculten mientras busca nuevas */}
        {!isLoading && !refreshing &&
          !isError &&
          data?.digest?.items &&
          data.digest.items.length > 0 && (
            <>
              {/* BANNER DE AVISO DE SUGERENCIAS */}
              {hasFallbackItems && (
                <View
                  style={[
                    s.fallbackBanner,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[s.fallbackIconCircle, { backgroundColor: colors.primary + "22" }]}>
                    <Feather name="info" size={18} color={colors.primary} />
                  </View>
                  <Text style={[s.fallbackText, { color: colors.text }]}>
                    No encontramos noticias exactas para algunos de tus tópicos hoy, así que completamos tu resumen con sugerencias relevantes.
                  </Text>
                </View>
              )}

              {data.digest.items.slice(0, 3).map((item, i) => (
                <DigestCard
                  key={`digest-item-${item.articleId || item.url || "id"}-${i}`}
                  item={item}
                  index={i}
                />
              ))}

              {/* 🎧 MÓDULO UNIFICADO: AUDIO + EFEMÉRIDE */}
              <View style={[s.unifiedCard, { borderColor: colors.border, backgroundColor: colors.card }]}>

                {/* 1. SECCIÓN PRINCIPAL: BOTÓN DE AUDIO (Destacado) */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePlayDigest}
                  disabled={loadingAudio}
                  style={[
                    s.unifiedAudioBtn,
                    { opacity: loadingAudio ? 0.6 : 1 }
                  ]}
                >
                  <View style={[s.unifiedPlayCircle, { backgroundColor: colors.primary }]}>
                    <Feather name={playing ? "pause" : "play"} size={22} color="#fff" style={{ marginLeft: playing ? 0 : 2 }} />
                  </View>

                  <View style={s.listenTextWrap}>
                    <Text style={[s.unifiedAudioTitle, { color: colors.text }]}>
                      Escuchar resumen
                    </Text>
                    <Text style={[s.unifiedAudioSub, { color: colors.primary }]}>
                      {loadingAudio ? "PREPARANDO AUDIO..." : playing ? "REPRODUCIENDO" : "DISPONIBLE EN AUDIO"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. LÍNEA SEPARADORA */}
                <View style={[s.divider, { backgroundColor: colors.border }]} />

                {/* 3. SECCIÓN SECUNDARIA: EFEMÉRIDE (Sutil) */}
                <View style={s.unifiedEphemeris}>
                  <Feather name="calendar" size={16} color={colors.mutedText} style={{ marginTop: 2 }} />
                  <View style={s.ephemerisTextWrap}>
                    <Text style={[s.unifiedEphemerisTitle, { color: colors.text }]}>
                      Efeméride del Día
                    </Text>
                    <Text style={[s.unifiedEphemerisDesc, { color: colors.mutedText }]}>
                      {dynamicDayTitle}
                    </Text>
                  </View>
                </View>

              </View>

            </>
          )}
      </ScrollView>
      <Modal
        visible={showTutorial}
        transparent={true}
        animationType="fade"
        onRequestClose={closeTutorialModal}
      >
        <View style={s.modalOverlay}>
          <View style={[s.tutorialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            <View style={s.tutorialHeader}>
              <View style={[s.tutorialIconRing, { backgroundColor: colors.primary }]}>
                <Feather name="compass" size={20} color="#fff" />
              </View>
              <Text style={[s.tutorialMainTitle, { color: colors.text }]}>¡Ya tenés tu resumen listo!</Text>
            </View>

            <Text style={[s.tutorialLabel, { color: colors.mutedText }]}>
              Te dejamos 4 tips rápidos para sacarle el jugo a la app:
            </Text>

            {/* Tip 1: Audio */}
            <View style={s.tutorialRow}>
              <Feather name="play" size={16} color={colors.primary} style={{ marginTop: 3 }} />
              <View style={s.tutorialRowTexts}>
                <Text style={[s.tipTitle, { color: colors.text }]}>Escuchá sin baches</Text>
                <Text style={[s.tipDesc, { color: colors.mutedText }]}>Tocá el botón inferior para generar un audio de todas tus noticias.</Text>
              </View>
            </View>

            {/* Tip 2: Refresh */}
            <View style={s.tutorialRow}>
              <Feather name="refresh-cw" size={16} color={colors.primary} style={{ marginTop: 3 }} />
              <View style={s.tutorialRowTexts}>
                <Text style={[s.tipTitle, { color: colors.text }]}>¿Querés más? Deslizá</Text>
                <Text style={[s.tipDesc, { color: colors.mutedText }]}>Haciendo "Refresh" (arrastrando hacia abajo) te traemos 3 noticias frescas.</Text>
              </View>
            </View>

            {/* Tip 3: Historial */}
            <View style={s.tutorialRow}>
              <Feather name="clock" size={16} color={colors.primary} style={{ marginTop: 3 }} />
              <View style={s.tutorialRowTexts}>
                <Text style={[s.tipTitle, { color: colors.text }]}>Revisá tu Historial</Text>
                <Text style={[s.tipDesc, { color: colors.mutedText }]}>En la pestaña de abajo podés volver a ver todos los artículos que fuiste leyendo en días anteriores.</Text>
              </View>
            </View>

            {/* Tip 4: Perfil */}
            <View style={s.tutorialRow}>
              <Feather name="user" size={16} color={colors.primary} style={{ marginTop: 3 }} />
              <View style={s.tutorialRowTexts}>
                <Text style={[s.tipTitle, { color: colors.text }]}>Ajustá tu Perfil</Text>
                <Text style={[s.tipDesc, { color: colors.mutedText }]}>Si cambias de opinión, desde Ajustes podés modificar tus 3 categorías o la hora en que llega la notificación.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[s.tutorialBtn, { backgroundColor: colors.primary }]}
              onPress={closeTutorialModal}
              activeOpacity={0.85}
            >
              <Text style={s.tutorialBtnTxt}>Entendido, empezar</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
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
      gap: 8,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "baseline",
      flexShrink: 0,
      letterSpacing: -1,
    },
    logoBlue: {
      fontSize: 31,
      fontFamily: "Inter_700Bold",
      marginRight: -1,
    },
    logoText: {
      fontSize: 31,
      fontFamily: "Inter_700Bold",
      marginLeft: -1,
    },
    sponsorWrapInline: {
      flexShrink: 1,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },
    sponsorLogoInline: {
      width: 158,
      height: 43,
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
    fallbackBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
    },
    fallbackIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    fallbackText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 18,
      fontFamily: "Inter_500Medium",
    },
    listenButton: {
      marginTop: 0,
      marginBottom: 8,
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
    ephemerisCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 8,
      marginBottom: 24,
      gap: 16,
    },
    ephemerisIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    ephemerisTextWrap: {
      flex: 1,
    },
    ephemerisTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
    },
    ephemerisDesc: {
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 20,
    },
    unifiedCard: {
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 4,
      marginBottom: 24,
      overflow: "hidden", // Hace que el fondo respete los bordes redondeados
    },
    unifiedAudioBtn: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      paddingVertical: 18, // Un poco más alto para destacarlo
      gap: 16,
    },
    unifiedPlayCircle: {
      width: 52, // Círculo de play más grande
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4, // Sombra para que resalte
    },
    listenTextWrap: {
      flex: 1,
    },
    unifiedAudioTitle: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    unifiedAudioSub: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    divider: {
      height: 1,
      width: "100%",
    },
    unifiedEphemeris: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 16,
      paddingTop: 14,
      paddingBottom: 16,
      gap: 12,
    },
    unifiedEphemerisTitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 2,
    },
    unifiedEphemerisDesc: {
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    tutorialCard: {
      width: "100%",
      maxWidth: 400,
      borderWidth: 1,
      borderRadius: 24,
      padding: 22,
      gap: 16,
    },
    tutorialHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    tutorialIconRing: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    tutorialMainTitle: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
    },
    tutorialLabel: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    tutorialRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    tutorialRowTexts: {
      flex: 1,
    },
    tipTitle: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      marginBottom: 2,
    },
    tipDesc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
    tutorialBtn: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
    },
    tutorialBtnTxt: {
      color: "#fff",
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
  });