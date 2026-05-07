import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title?: string;
};

function normalizeTime(value: string) {
  const [rawHour, rawMinute] = String(value || "08:00").split(":");

  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  const safeHour = Number.isFinite(hour)
    ? Math.min(23, Math.max(0, hour))
    : 8;

  const safeMinute = Number.isFinite(minute)
    ? Math.min(59, Math.max(0, minute))
    : 0;

  return {
    hour: safeHour,
    minute: safeMinute,
  };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function wrap(value: number, min: number, max: number) {
  if (value > max) return min;
  if (value < min) return max;
  return value;
}

export function TimePickerField({
  visible,
  value,
  onClose,
  onConfirm,
  title = "Horario de entrega",
}: Props) {
  const colors = useColors();

  const initial = useMemo(() => normalizeTime(value), [value]);

  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    if (visible) {
      const next = normalizeTime(value);
      setHour(next.hour);
      setMinute(next.minute);
    }
  }, [value, visible]);

  const s = makeStyles(colors);

  if (!visible) return null;

  const previewValue = `${pad2(hour)}:${pad2(minute)}`;

  const incrementHour = () => {
    setHour((current) => wrap(current + 1, 0, 23));
  };

  const decrementHour = () => {
    setHour((current) => wrap(current - 1, 0, 23));
  };

  const incrementMinute = () => {
    setMinute((current) => wrap(current + 5, 0, 55));
  };

  const decrementMinute = () => {
    setMinute((current) => wrap(current - 5, 0, 55));
  };

  const handleConfirm = () => {
    onConfirm(`${pad2(hour)}:${pad2(minute)}`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.modalRoot}>
        <Pressable style={s.modalBackdrop} onPress={onClose} />

        <View
          style={[
            s.modalCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={[s.modalCancel, { color: colors.mutedText }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <Text style={[s.modalTitle, { color: colors.text }]}>{title}</Text>

            <TouchableOpacity onPress={handleConfirm} hitSlop={10}>
              <Text style={[s.modalDone, { color: colors.primary }]}>
                Listo
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              s.previewPill,
              { backgroundColor: "rgba(59,130,246,0.14)" },
            ]}
          >
            <Feather name="clock" size={15} color={colors.primary} />
            <Text style={[s.previewText, { color: colors.text }]}>
              {previewValue}
            </Text>
          </View>

          <View style={s.pickerRow}>
            <View style={s.pickerColumn}>
              <Text style={[s.inputLabel, { color: colors.mutedText }]}>
                Hora
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={incrementHour}
                style={[
                  s.stepButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="chevron-up" size={22} color={colors.text} />
              </TouchableOpacity>

              <View
                style={[
                  s.valueBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[s.valueText, { color: colors.text }]}>
                  {pad2(hour)}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={decrementHour}
                style={[
                  s.stepButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="chevron-down" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[s.separator, { color: colors.text }]}>:</Text>

            <View style={s.pickerColumn}>
              <Text style={[s.inputLabel, { color: colors.mutedText }]}>
                Minutos
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={incrementMinute}
                style={[
                  s.stepButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="chevron-up" size={22} color={colors.text} />
              </TouchableOpacity>

              <View
                style={[
                  s.valueBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[s.valueText, { color: colors.text }]}>
                  {pad2(minute)}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={decrementMinute}
                style={[
                  s.stepButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="chevron-down" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[s.helper, { color: colors.mutedText }]}>
            En web, usá las flechas. Los minutos avanzan de 5 en 5.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      borderWidth: 1,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 18,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      paddingBottom: 12,
      marginBottom: 14,
    },
    modalTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
    modalCancel: {
      fontSize: 15,
      fontFamily: "Inter_500Medium",
    },
    modalDone: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
    previewPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "center",
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginBottom: 18,
    },
    previewText: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    },
    pickerColumn: {
      width: 110,
      alignItems: "center",
      gap: 8,
    },
    inputLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
      marginBottom: 2,
    },
    stepButton: {
      width: 86,
      height: 38,
      borderWidth: 1,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    valueBox: {
      width: 96,
      height: 58,
      borderWidth: 1,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    valueText: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.8,
    },
    separator: {
      fontSize: 30,
      fontFamily: "Inter_700Bold",
      marginTop: 26,
    },
    helper: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 16,
    },
  });