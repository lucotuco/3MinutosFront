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

export default function OnboardingScreen() {
  const colors = useColors();
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

  const deliveryTime = `${selectedHour}:${selectedMinute}`;

  const updateTopic = (index: number, value: string) => {
    const next: [string, string, string] = [...topics] as [
      string,
      string,
      string
    ];
    next[index] = value;
    setTopics(next);
  };

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

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleSubmit = async () => {
    const error = validate();

    if (error) {
      Alert.alert("Datos incompletos", error);
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setLoading(true);

    try {
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
              paddingTop: insets.top + 36,
              paddingBottom: insets.bottom + 36,
            },
          ]}
        >
          <View style={s.header}>
            <View
              style={[
                s.logoCircle,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Feather name="zap" size={28} color="#fff" />
            </View>

            <Text style={[s.appName, { color: colors.text }]}>3 Minutos</Text>

            <Text style={[s.subtitle, { color: colors.mutedText }]}>
              Tu resumen de noticias personalizado
            </Text>
          </View>

          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              Tu perfil
            </Text>

            <Text style={[s.label, { color: colors.text }]}>Nombre</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej: Mateo"
              placeholderTextColor={colors.mutedText}
              style={[
                s.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.card,
                },
              ]}
              autoCapitalize="words"
              maxLength={60}
            />

           <Text style={[s.label, { color: colors.text }]}>
  Tus 3 tópicos de interés
</Text>

{topics.filter((t) => t.trim()).length > 0 ? (
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
) : (
  <Text style={[s.hint, { color: colors.mutedText }]}>
    Elegí exactamente 3 temas que te interesan
  </Text>
)}

<TouchableOpacity
  activeOpacity={0.85}
  onPress={() => setTopicPickerVisible(true)}
  style={[s.pickerBtn, { backgroundColor: colors.primary }]}
>
  <Feather name="sliders" size={16} color="#fff" />
  <Text style={s.pickerBtnText}>
    {topics.filter((t) => t.trim()).length === 3 ? "Cambiar Tópicos" : "Elegí Tópicos"}
  </Text>
</TouchableOpacity>

            <Text style={[s.label, { color: colors.text }]}>
              Horario de entrega
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openTimeModal}
              style={[
                s.timeRowButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <View style={s.timeRowLeft}>
                <View
                  style={[
                    s.timeIconWrap,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Feather name="clock" size={18} color="#fff" />
                </View>

                <View>
                  <Text style={[s.timeRowTitle, { color: colors.text }]}>
                    Hora de entrega
                  </Text>
                  <Text
                    style={[
                      s.timeRowSubtitle,
                      {
                        color: colors.mutedText,
                      },
                    ]}
                  >
                    Toca para cambiarla
                  </Text>
                </View>
              </View>

              <View style={s.timeRowRight}>
                <Text style={[s.timeRowValue, { color: colors.text }]}>
                  {deliveryTime}
                </Text>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.mutedText}
                />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={loading}
            onPress={handleSubmit}
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
              <Text style={s.submitText}>Comenzar</Text>
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
    </>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
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
pickerBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderRadius: 14,
  paddingVertical: 14,
  marginBottom: 10,
},
pickerBtnText: {
  color: "#fff",
  fontSize: 15,
  fontFamily: "Inter_700Bold",
},

    root: {
      flex: 1,
    },
    scroll: {
      paddingHorizontal: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
      gap: 8,
    },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    appName: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
    },
    subtitle: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      marginBottom: 14,
    },
    label: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      marginBottom: 6,
      marginTop: 12,
    },
    hint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginBottom: 8,
      marginTop: -4,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
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
    submitBtn: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    submitText: {
      color: "#fff",
      fontSize: 17,
      fontFamily: "Inter_700Bold",
    },
  });