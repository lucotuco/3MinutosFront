import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title?: string;
};

function timeStringToDate(value: string) {
  const [rawHour, rawMinute] = String(value || "08:00").split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  const date = new Date();
  date.setHours(Number.isFinite(hour) ? hour : 8);
  date.setMinutes(Number.isFinite(minute) ? minute : 0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function dateToTimeString(date: Date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function TimePickerField({
  visible,
  value,
  onClose,
  onConfirm,
  title = "Horario de entrega",
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(() => timeStringToDate(value));

  useEffect(() => {
    if (visible) {
      setSelectedDate(timeStringToDate(value));
    }
  }, [value, visible]);

  const previewValue = useMemo(() => dateToTimeString(selectedDate), [selectedDate]);

  const s = makeStyles(colors);

  const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed") {
      onClose();
      return;
    }

    if (date) {
      const nextValue = dateToTimeString(date);
      onConfirm(nextValue);
    }

    onClose();
  };

  const handleIosChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  if (!visible) return null;

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={selectedDate}
        mode="time"
        is24Hour
        display="default"
        onChange={handleAndroidChange}
      />
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalRoot}>
        <Pressable style={s.modalBackdrop} onPress={onClose} />

        <View
          style={[
            s.modalSheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={[s.modalCancel, { color: colors.mutedForeground }]}>Cancelar</Text>
            </TouchableOpacity>

            <Text style={[s.modalTitle, { color: colors.foreground }]}>{title}</Text>

            <TouchableOpacity onPress={() => onConfirm(previewValue)} hitSlop={10}>
              <Text style={[s.modalDone, { color: colors.primary }]}>Listo</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.timePreview, { backgroundColor: colors.secondary }]}>
            <Feather name="clock" size={14} color={colors.mutedForeground} />
            <Text style={[s.timePreviewText, { color: colors.foreground }]}>
              {previewValue}
            </Text>
          </View>

          <View
            style={[
              s.pickerWrap,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <DateTimePicker
              value={selectedDate}
              mode="time"
              is24Hour
              display="spinner"
              onChange={handleIosChange}
              style={s.iosPicker}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    modalSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      paddingTop: 10,
      paddingHorizontal: 16,
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
    timePreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "center",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    timePreviewText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.4,
    },
    pickerWrap: {
      borderWidth: 1,
      borderRadius: 20,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
    },
    iosPicker: {
      width: "100%",
      height: 200,
    },
  });