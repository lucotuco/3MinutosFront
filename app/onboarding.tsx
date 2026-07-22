import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopicPicker } from "@/components/TopicPicker";
import { TimePickerField } from "@/components/TimePickerField";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { PushSoftPrompt } from "@/components/PushNotiPrompt";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePostHog } from 'posthog-react-native';

export default function OnboardingScreen() {
  const colors = useColors();
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const { setSession, clearSession } = useUser();

  const [topicPickerVisible, setTopicPickerVisible] = useState(false);
  const [name, setName] = useState("");
  const [topics, setTopics] = useState<[string, string, string]>(["", "", ""]);
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [isActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pushPromptVisible, setPushPromptVisible] = useState(false);

  const deliveryTime = `${selectedHour}:${selectedMinute}`;

  const validate = () => {
    const cleanName = name.trim();
    const cleanTopics = topics.map((topic) => topic.trim());

    if (!cleanName) return "Ingresa tu nombre";
    if (cleanName.length > 60) return "El nombre no puede superar 60 caracteres";

    if (cleanTopics.some((topic) => !topic)) {
      return "Completa los 3 tópicos";
    }

    const uniqueTopics = new Set(cleanTopics.map((topic) => topic.toLowerCase()));

    if (uniqueTopics.size !== 3) {
      return "Los 3 tópicos tienen que ser distintos";
    }

    if (cleanTopics.some((topic) => topic.length < 2 || topic.length > 40)) {
      return "Cada tópico debe tener entre 2 y 40 caracteres";
    }

    return null;
  };

  const openTimeModal = () => {
    setTimeModalVisible(true);
  };

  const closeTimeModal = () => {
    setTimeModalVisible(false);
  };

  const confirmTimeSelection = async (nextValue: string) => {
    const [h, m] = nextValue.split(":");
    setSelectedHour(h || "08");
    setSelectedMinute(m || "00");
    setTimeModalVisible(false);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  };

  const handleNext = () => {
    const error = validate();
    if (error) {
      Alert.alert("Faltan datos", error);
      return;
    }
    // 📊 ANALÍTICA: Completó el formulario base
    posthog.capture('onboarding_form_completed', {
      topics_chosen: topics.filter(t => t.trim())
    });
    
    setPushPromptVisible(true);
  };

const finalizeOnboarding = async (wantsPush: boolean) => {
    setPushPromptVisible(false);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setLoading(true);

    // 📊 ANALÍTICA: Respuesta al permiso
    posthog.capture('onboarding_push_prompt_answered', { accepted: wantsPush });

    try {
      if (wantsPush) {
        await registerForPushNotificationsAsync(true);
      } else {
        await AsyncStorage.setItem("push_prompt_declined_date", Date.now().toString());
      }

      await clearSession();
      const result = await api.createPreferences({
        name: name.trim(),
        topics: [topics[0].trim(), topics[1].trim(), topics[2].trim()],
        deliveryTime,
        isActive,
      });

      await setSession({
        userId: result.user.id,
        authToken: result.authToken,
      });

      // 📊 ANALÍTICA: Creación exitosa
      posthog.capture('onboarding_fully_completed');

      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      Alert.alert("Error al guardar", msg);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <>
      <KeyboardAvoidingView
        style={[s.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scroll,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 36,
            },
          ]}
        >
          {/* HEADER */}
          <View style={s.header}>
            <View style={[s.logoCircle, { backgroundColor: colors.primary }]}>
              <Feather name="zap" size={28} color="#fff" />
            </View>
            <Text style={[s.appName, { color: colors.text }]}>3 Minutos</Text>
            <Text style={[s.subtitle, { color: colors.mutedText }]}>
              Configurá tu resumen diario en 3 pasos
            </Text>
          </View>

          {/* PASO 1: NOMBRE */}
          <View style={[s.stepCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={s.stepHeader}>
              <View style={[s.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={s.stepNumberTxt}>1</Text>
              </View>
              <Text style={[s.stepTitle, { color: colors.text }]}>¿Cómo quieres que te llamemos?</Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej: San Martín"
              placeholderTextColor={colors.mutedText}
              style={[
                s.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              autoCapitalize="words"
              maxLength={60}
            />
          </View>

          {/* PASO 2: TÓPICOS */}
          <View style={[s.stepCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={s.stepHeader}>
              <View style={[s.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={s.stepNumberTxt}>2</Text>
              </View>
              <Text style={[s.stepTitle, { color: colors.text }]}>Elegí tus Categorias</Text>
            </View>
            
            <Text style={[s.stepDesc, { color: colors.mutedText }]}>
              Tocá el botón abajo y seleccioná exactamente 3 categorías sobre las que querés recibir noticias.
            </Text>

            {topics.filter((t) => t.trim()).length > 0 && (
              <View style={s.chipsWrap}>
                {topics.filter((t) => t.trim()).map((topic) => (
                  <View
                    key={topic}
                    style={[s.chip, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}
                  >
                    <Text style={[s.chipText, { color: colors.primary }]}>{topic}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setTopicPickerVisible(true)}
              style={[s.pickerBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="sliders" size={16} color="#fff" />
              <Text style={s.pickerBtnText}>
                {topics.filter((t) => t.trim()).length === 3 ? "Modificar selección" : "Elegir Categorías"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PASO 3: HORARIO */}
          <View style={[s.stepCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={s.stepHeader}>
              <View style={[s.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={s.stepNumberTxt}>3</Text>
              </View>
              <Text style={[s.stepTitle, { color: colors.text }]}>Horario de entrega</Text>
            </View>
            
            <Text style={[s.stepDesc, { color: colors.mutedText }]}>
              ¿A qué hora querés que te enviemos tu resumen todos los días?
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openTimeModal}
              style={[
                s.timeRowButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={s.timeRowLeft}>
                <Feather name="clock" size={20} color={colors.primary} />
                <Text style={[s.timeRowTitle, { color: colors.text }]}>Hora del Digest</Text>
              </View>
              <View style={s.timeRowRight}>
                <Text style={[s.timeRowValue, { color: colors.text }]}>{deliveryTime}</Text>
                <Feather name="chevron-right" size={18} color={colors.mutedText} />
              </View>
            </TouchableOpacity>
          </View>

          {/* BOTÓN FINAL */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={loading}
            onPress={handleNext}
            style={[
              s.submitBtn,
              {
                backgroundColor: loading ? colors.mutedText : colors.primary,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitText}>Crear mi Perfil</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <TopicPicker
        visible={topicPickerVisible}
        value={topics.filter((t) => t.trim())}
        onClose={() => setTopicPickerVisible(false)}
        onConfirm={(newTopics) => {
          setTopics([newTopics[0] ?? "", newTopics[1] ?? "", newTopics[2] ?? ""]);
          setTopicPickerVisible(false);
        }}
      />
      <TimePickerField
        visible={timeModalVisible}
        value={deliveryTime}
        onClose={closeTimeModal}
        onConfirm={confirmTimeSelection}
      />
      <PushSoftPrompt
        visible={pushPromptVisible}
        onAccept={() => finalizeOnboarding(true)}
        onDecline={() => finalizeOnboarding(false)}
      />
    </>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 20 },
    header: { alignItems: "center", justifyContent: "center", marginBottom: 24 },
    logoCircle: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    appName: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
    subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },

    stepCard: {
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
    },
    stepHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumberTxt: {
      color: "#fff",
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
    stepTitle: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
    },
    stepDesc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
      marginBottom: 14,
      marginTop: -4,
    },

    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_500Medium" },
    
    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    
    pickerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
    pickerBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
    
    timeRowButton: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    timeRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    timeRowTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    timeRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    timeRowValue: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
    
    submitBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    submitText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  });