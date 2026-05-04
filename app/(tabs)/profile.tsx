import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TimePickerField } from "@/components/TimePickerField";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { api } from "@/services/api";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";

function parseDeliveryTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return { hour: "08", minute: "00" };
  }
  return {
    hour: match[1],
    minute: match[2],
  };
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, clearUserId } = useUser();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [topics, setTopics] = useState<[string, string, string]>(["", "", ""]);
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [timeModalVisible, setTimeModalVisible] = useState(false);
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
    if (data) {
      setName(data.name ?? "");
      const t = data.topics ?? ["", "", ""];
      setTopics([t[0] ?? "", t[1] ?? "", t[2] ?? ""] as [string, string, string]);
      const parsed = parseDeliveryTime(data.deliveryTime ?? "08:00");
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setIsActive(data.isActive ?? true);
      setIsDirty(false);
    }
  }, [data]);

  const markDirty = () => setIsDirty(true);

  const updateTopic = (index: number, value: string) => {
    const next: [string, string, string] = [...topics] as [string, string, string];
    next[index] = value;
    setTopics(next);
    markDirty();
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
    markDirty();
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!name.trim() || topics.some((t) => !t.trim())) {
      Alert.alert("Campos requeridos", "Nombre y los 3 topicos son obligatorios.");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      await api.updatePreferences(userId, {
        name: name.trim(),
        topics: [topics[0].trim(), topics[1].trim(), topics[2].trim()],
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
    Alert.alert("Cerrar sesion", "Se borrara tu usuario guardado localmente. Continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => clearUserId(),
      },
    ]);
  };

  const s = makeStyles(colors);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

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

        {isLoading && (
          <View style={{ padding: 20 }}>
            <LoadingState />
          </View>
        )}

        {isError && <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />}

        {!isLoading && !isError && (
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: botPad }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Nombre</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
                ]}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  markDirty();
                }}
                placeholder="Tu nombre"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
              />
            </View>

            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>Topicos</Text>
              {([0, 1, 2] as const).map((i) => (
                <TextInput
                  key={i}
                  style={[
                    s.input,
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
                  ]}
                  value={topics[i]}
                  onChangeText={(v) => updateTopic(i, v)}
                  placeholder={`Topico ${i + 1}`}
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                />
              ))}
            </View>

            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>
                Horario de entrega
              </Text>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={openTimeModal}
                style={[
                  s.timeRowButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={s.timeRowLeft}>
                  <View style={[s.timeIconWrap, { backgroundColor: colors.secondary }]}>
                    <Feather name="clock" size={16} color={colors.mutedForeground} />
                  </View>
                  <View>
                    <Text style={[s.timeRowTitle, { color: colors.foreground }]}>
                      Hora de entrega
                    </Text>
                    <Text style={[s.timeRowSubtitle, { color: colors.mutedForeground }]}>
                      Toca para cambiarla
                    </Text>
                  </View>
                </View>

                <View style={s.timeRowRight}>
                  <Text style={[s.timeRowValue, { color: colors.foreground }]}>
                    {deliveryTime}
                  </Text>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={s.section}>
              <View
                style={[
                  s.switchRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.switchTitle, { color: colors.foreground }]}>
                    Resumen activo
                  </Text>
                  <Text style={[s.switchSubtitle, { color: colors.mutedForeground }]}>
                    Pausa o reactiva tus entregas diarias
                  </Text>
                </View>

                <Switch
                  value={isActive}
                  onValueChange={(value) => {
                    setIsActive(value);
                    markDirty();
                  }}
                  trackColor={{ false: colors.secondary, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
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
        onClose={closeTimeModal}
        onConfirm={confirmTimeSelection}
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
    title: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
    },
    saveBtn: {
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    saveTxt: {
      color: "#fff",
      fontFamily: "Inter_700Bold",
      fontSize: 13,
    },
    scroll: {
      padding: 20,
    },
    section: {
      marginBottom: 22,
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    input: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      marginBottom: 10,
    },
    timeRowButton: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    timeRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    timeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    timeRowTitle: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
    timeRowSubtitle: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    timeRowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    timeRowValue: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
    switchRow: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    switchTitle: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
    switchSubtitle: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
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
    logoutText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
  });