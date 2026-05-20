import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORIES, CATEGORY_ICONS, type CategoryName } from "@/constants/categories";
import { useColors } from "@/hooks/useColors";

const MAX_TOPICS = 3;

type Props = {
  visible: boolean;
  value: string[];
  onClose: () => void;
  onConfirm: (topics: string[]) => void;
};

export function TopicPicker({ visible, value, onClose, onConfirm }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(value);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");

  useEffect(() => {
    if (visible) {
      setSelected(value);
      setFreeText("");
    }
  }, [visible]);

  const toggleTopic = useCallback(async (topic: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => {
      if (prev.includes(topic)) return prev.filter((t) => t !== topic);
      if (prev.length >= MAX_TOPICS) return prev;
      return [...prev, topic];
    });
  }, []);

  const toggleCategory = useCallback(async (cat: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  }, []);

  const addFreeText = useCallback(async () => {
    const clean = freeText.trim();
    if (!clean || selected.length >= MAX_TOPICS || selected.includes(clean)) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => [...prev, clean]);
    setFreeText("");
  }, [freeText, selected]);

  const handleConfirm = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(selected);
  }, [selected, onConfirm]);

  const canSave = selected.length === MAX_TOPICS;

  const s = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.container, { backgroundColor: colors.background }]}>

        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Tópicos Disponibles</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Category list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {(Object.entries(CATEGORIES) as [CategoryName, readonly string[]][]).map(
            ([cat, topics], idx) => {
              const isExpanded = expandedCategory === cat;
              const icon = CATEGORY_ICONS[cat] as any;

              return (
                <View key={cat}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleCategory(cat)}
                    style={[s.catRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={s.catLeft}>
                      <View style={[s.catIconWrap, { backgroundColor: colors.accent }]}>
                        <Feather name={icon} size={16} color={colors.primary} />
                      </View>
                      <Text style={[s.catName, { color: colors.foreground }]}>
                        {idx + 1}. {cat.toUpperCase()}
                      </Text>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[s.topicsWrap, { backgroundColor: colors.muted }]}>
                      <View style={s.chipsRow}>
                        {topics.map((topic) => {
                          const isSelected = selected.includes(topic);
                          const isDisabled = !isSelected && selected.length >= MAX_TOPICS;
                          return (
                            <TouchableOpacity
                              key={topic}
                              activeOpacity={0.8}
                              disabled={isDisabled}
                              onPress={() => toggleTopic(topic)}
                              style={[
                                s.chip,
                                {
                                  borderColor: isSelected ? colors.primary : colors.border,
                                  backgroundColor: isSelected
                                    ? colors.primary + "28"
                                    : colors.card,
                                  opacity: isDisabled ? 0.35 : 1,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  s.chipText,
                                  {
                                    color: isSelected ? colors.primary : colors.foreground,
                                    fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                                  },
                                ]}
                              >
                                {topic}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            }
          )}

          {/* Tema libre */}
          <View style={[s.freeWrap, { borderTopColor: colors.border }]}>
            <Text style={[s.freeLabel, { color: colors.mutedForeground }]}>Tema Libre</Text>
            <View style={s.freeRow}>
              <TextInput
                style={[
                  s.freeInput,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.card,
                  },
                ]}
                value={freeText}
                onChangeText={setFreeText}
                placeholder="Ej. Boca Juniors"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={addFreeText}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={addFreeText}
                disabled={!freeText.trim() || selected.length >= MAX_TOPICS}
                style={[
                  s.addBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: !freeText.trim() || selected.length >= MAX_TOPICS ? 0.45 : 1,
                  },
                ]}
              >
                <Feather name="plus" size={15} color="#fff" />
                <Text style={s.addBtnText}>Añadir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer fijo */}
        <View
          style={[
            s.footer,
            {
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Text style={[s.counter, { color: colors.mutedForeground }]}>
            ({selected.length} de {MAX_TOPICS}) subtemas seleccionados
            {selected.length > 0 && (
              <Text style={{ color: colors.primary }}>
                {" · "}{selected.join(", ")}
              </Text>
            )}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!canSave}
            onPress={handleConfirm}
            style={[
              s.saveBtn,
              {
                backgroundColor: canSave ? colors.primary : colors.secondary,
              },
            ]}
          >
            <Feather
              name="check"
              size={16}
              color={canSave ? "#fff" : colors.mutedForeground}
            />
            <Text
              style={[
                s.saveBtnText,
                { color: canSave ? "#fff" : colors.mutedForeground },
              ]}
            >
              Guardar Selección
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
    },
    catRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    catLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    catIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    catName: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
    topicsWrap: {
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 7,
    },
    chipText: {
      fontSize: 13,
    },
    freeWrap: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderTopWidth: 1,
      marginTop: 8,
    },
    freeLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    freeRow: {
      flexDirection: "row",
      gap: 10,
    },
    freeInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 12,
    },
    addBtnText: {
      color: "#fff",
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    footer: {
      borderTopWidth: 1,
      paddingHorizontal: 20,
      paddingTop: 14,
      gap: 10,
    },
    counter: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      paddingVertical: 14,
    },
    saveBtnText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
  });