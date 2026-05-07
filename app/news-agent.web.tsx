import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function NewsAgentWebScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors);

  const topPad = Platform.OS === "web" ? 42 : Math.max(insets.top, 18);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)");
  };

  const handleOpenMobileInfo = () => {
    Linking.openURL("https://expo.dev/");
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad }]}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleGoBack}
          style={[
            s.backButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="arrow-left" size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={s.headerTextWrap}>
          <Text style={[s.kicker, { color: colors.primary }]}>
            Agente de noticias
          </Text>
          <Text style={[s.title, { color: colors.text }]}>
            Disponible en la app móvil
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
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
              s.iconCircle,
              { backgroundColor: "rgba(59,130,246,0.14)" },
            ]}
          >
            <Feather name="mic" size={28} color={colors.primary} />
          </View>

          <Text style={[s.cardTitle, { color: colors.text }]}>
            El agente por voz no está activo en la versión web
          </Text>

          <Text style={[s.description, { color: colors.mutedText }]}>
            Esta pantalla usa WebRTC nativo en iPhone y Android. Para que el MVP
            web pueda abrirse desde Safari sin romper, dejamos esta versión
            informativa y mantenemos la función real en la app móvil.
          </Text>

          <View
            style={[
              s.infoBox,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="info" size={17} color={colors.primary} />
            <Text style={[s.infoText, { color: colors.mutedText }]}>
              Tus superiores pueden probar el resumen, las noticias, el audio,
              el clima y el calendario desde la web. El agente conversacional
              queda reservado para la build nativa.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            onPress={handleGoBack}
            style={[s.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Feather name="home" size={17} color="#fff" />
            <Text style={s.primaryButtonText}>Volver al resumen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.78}
            onPress={handleOpenMobileInfo}
            style={[
              s.secondaryButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Feather name="smartphone" size={17} color={colors.text} />
            <Text style={[s.secondaryButtonText, { color: colors.text }]}>
              Probar luego en app móvil
            </Text>
          </TouchableOpacity>
        </View>
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
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    kicker: {
      fontSize: 12,
      lineHeight: 15,
      fontFamily: "Inter_700Bold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    title: {
      fontSize: 22,
      lineHeight: 27,
      fontFamily: "Inter_700Bold",
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 40,
    },
    card: {
      borderWidth: 1,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: "center",
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 20,
      lineHeight: 25,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginBottom: 18,
    },
    infoBox: {
      width: "100%",
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 13,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 18,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: "Inter_500Medium",
    },
    primaryButton: {
      width: "100%",
      borderRadius: 18,
      paddingVertical: 13,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 10,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 15,
      lineHeight: 19,
      fontFamily: "Inter_700Bold",
    },
    secondaryButton: {
      width: "100%",
      borderRadius: 18,
      borderWidth: 1,
      paddingVertical: 13,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    secondaryButtonText: {
      fontSize: 15,
      lineHeight: 19,
      fontFamily: "Inter_700Bold",
    },
  });