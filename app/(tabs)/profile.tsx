import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { TimePickerField } from "@/components/TimePickerField";
import { TopicPicker } from "@/components/TopicPicker";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { useHandleUserNotFound } from "@/hooks/useHandleUserNotFound";
import { api } from "@/services/api";

function parseDeliveryTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { hour: "08", minute: "00" };
  return { hour: match[1], minute: match[2] };
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, clearUserId } = useUser();
  const queryClient = useQueryClient();
  const { handleError } = useHandleUserNotFound();

  const [name, setName] = useState("");
  const [topics, setTopics] = useState<string[]>(["", "", ""]);
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [topicPickerVisible, setTopicPickerVisible] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const deliveryTime = useMemo(
    () => `${selectedHour}:${selectedMinute}`,
    [selectedHour, selectedMinute]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["preferences", userId],
    queryFn: () => api.getPreferences(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setTopics(data.topics ?? ["", "", ""]);
      const parsed = parseDeliveryTime(data.deliveryTime ?? "08:00");
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setIsActive(data.isActive ?? true);
      setIsDirty(false);
    }
  }, [data]);

  const markDirty = () => setIsDirty(true);

  const handleSave = async () => {
    if (!userId) return;
    if (!name.trim() || topics.filter((t) => t.trim()).length < 3) {
      Alert.alert("Campos requeridos", "Nombre y 3 tópicos son obligatorios.");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      await api.updatePreferences(userId, {
        name: name.trim(),
        topics: [topics[0].trim(), topics[1].trim(), topics[2].trim()] as [string, string, string],
        deliveryTime,
        isActive,
      });
      await queryClient.invalidateQueries({ queryKey: ["preferences", userId] });
      await queryClient.invalidateQueries({ queryKey: ["digest", userId] });
      setIsDirty(false);
      Alert.alert("Guardado", "Tus preferencias han sido actualizadas.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Cerrar sesion", "Se borrará tu usuario guardado localmente. Continuar?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => clearUserId() },
    ]);
  };

  const handleFeedback = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const email = "lucasschlez@gmail.com"; // 👈 Cambiá esto por tu dirección real de mail
      const subject = encodeURIComponent("Feedback - App 3 Minutos");
      
      // Le dejamos pre-configurado el ID del usuario abajo de todo para que no lo borre
      const body = encodeURIComponent(`[Escribí tu feedback acá]\n\n\n\n--- Info técnica (No borrar) ---\nUsuario ID: ${userId || 'N/A'}\nPlataforma: ${Platform.OS}`);
      
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir la aplicación de correo en tu celular.");
    }
  };

  const s = makeStyles(colors);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const selectedTopics = topics.filter((t) => t.trim());

  return (
    <>
      <KeyboardAvoidingView
        style={[s.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[s.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
          <Text style={[s.title, { color: colors.foreground }]}>Perfil</Text>
          {isDirty && (
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.saveTxt}>Guardar</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {isLoading && <View style={{ padding: 20 }}><LoadingState /></View>}
        {isError && <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />}

        {!isLoading && !isError && (
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: botPad }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Nombre */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Nombre</Text>
              <View
                style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <Text
                  style={[s.inputText, { color: name ? colors.foreground : colors.mutedForeground }]}
                  onPress={() => {}}
                >
                  {name || "Tu nombre"}
                </Text>
              </View>
            </View>

            {/* Categorias */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Categorias Seleccionadas</Text>

              {selectedTopics.length > 0 ? (
                <View style={s.chipsWrap}>
                  {selectedTopics.map((topic) => (
                    <View
                      key={topic}
                      style={[s.chip, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}
                    >
                      <Text style={[s.chipText, { color: colors.primary }]}>{topic}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[s.emptyTopics, { color: colors.mutedForeground }]}>
                  0 de 3 tópicos seleccionados
                </Text>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setTopicPickerVisible(true)}
                style={[s.pickerBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="sliders" size={16} color="#fff" />
                <Text style={s.pickerBtnText}>Elegír Categorias</Text>
              </TouchableOpacity>
            </View>

            {/* Horario */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Horario de entrega</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setTimeModalVisible(true)}
                style={[s.timeRowButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={s.timeRowLeft}>
                  <View style={[s.timeIconWrap, { backgroundColor: colors.secondary }]}>
                    <Feather name="clock" size={16} color={colors.mutedForeground} />
                  </View>
                  <View>
                    <Text style={[s.timeRowTitle, { color: colors.foreground }]}>Hora de entrega</Text>
                    <Text style={[s.timeRowSubtitle, { color: colors.mutedForeground }]}>Toca para cambiarla</Text>
                  </View>
                </View>
                <View style={s.timeRowRight}>
                  <Text style={[s.timeRowValue, { color: colors.foreground }]}>{deliveryTime}</Text>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={s.section}>
              <TouchableOpacity
                style={[s.feedbackBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={handleFeedback}
                activeOpacity={0.8}
              >
                <Feather name="mail" size={16} color={colors.primary} />
                <Text style={[s.feedbackText, { color: colors.foreground }]}>Mandar Feedback</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.logoutBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={confirmLogout}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={16} color={colors.destructive} />
              <Text style={[s.logoutText, { color: colors.destructive }]}>Cerrar sesion</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <TimePickerField
        visible={timeModalVisible}
        value={deliveryTime}
        onClose={() => setTimeModalVisible(false)}
        onConfirm={async (v) => {
          const [h, m] = v.split(":");
          setSelectedHour(h || "08");
          setSelectedMinute(m || "00");
          setTimeModalVisible(false);
          markDirty();
          try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
        }}
      />

      <TopicPicker
        visible={topicPickerVisible}
        value={topics.filter((t) => t.trim())}
        onClose={() => setTopicPickerVisible(false)}
        onConfirm={(newTopics) => {
          const padded: [string, string, string] = [
            newTopics[0] ?? "",
            newTopics[1] ?? "",
            newTopics[2] ?? "",
          ];
          setTopics(padded);
          setTopicPickerVisible(false);
          markDirty();
        }}
      />
    </>
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
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { fontSize: 28, fontFamily: "Inter_700Bold" },
    saveBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
    saveTxt: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
    scroll: { padding: 20 },
    section: { marginBottom: 22 },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    inputWrap: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    inputText: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_500Medium",
    },
    chipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    chip: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    emptyTopics: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    pickerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      paddingVertical: 14,
    },
    pickerBtnText: {
      color: "#fff",
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
    timeRowButton: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    timeRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    timeIconWrap: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" },
    timeRowTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    timeRowSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    timeRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    timeRowValue: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
    switchRow: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    switchTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    switchSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    logoutBtn: {
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 10,
    },
    logoutText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    feedbackBtn: {
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 10,
    },
    feedbackText: { 
      fontSize: 15, 
      fontFamily: "Inter_600SemiBold" 
    },
  });