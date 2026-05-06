import { Feather } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  getUpcomingCalendarEvents,
  type UpcomingCalendarEvent,
} from "@/services/calendar";

function formatEventDay(event: UpcomingCalendarEvent) {
  const start = new Date(event.startDate);
  const now = new Date();

  const isToday = start.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const isTomorrow = start.toDateString() === tomorrow.toDateString();

  if (isToday) return "Hoy";
  if (isTomorrow) return "Mañana";

  return start.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatEventTime(event: UpcomingCalendarEvent) {
  if (event.allDay) {
    return "Todo el día";
  }

  const start = new Date(event.startDate);

  return start.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function openCalendarEvent(event: UpcomingCalendarEvent) {
  try {
    if (typeof Calendar.openEventInCalendarAsync === "function") {
      await Calendar.openEventInCalendarAsync({
        id: event.id,
        instanceStartDate: event.startDate,
      });
      return;
    }

    if (typeof Calendar.openEventInCalendar === "function") {
      Calendar.openEventInCalendar(event.id);
      return;
    }

    throw new Error("No calendar open function available");
  } catch (error) {
    console.log("Error abriendo evento de calendario:", error);

    Alert.alert(
      "No pudimos abrir el evento",
      "Podés verlo desde la app de calendario de tu celular."
    );
  }
}

export function UpcomingEvents() {
  const colors = useColors();
  const s = makeStyles(colors);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<UpcomingCalendarEvent | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        const result = await getUpcomingCalendarEvents(7, 1);

        if (!cancelled) {
          setEvent(result?.[0] ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
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
            s.iconWrap,
            {
              backgroundColor: "rgba(59,130,246,0.14)",
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>

        <View style={s.content}>
          <Text
            numberOfLines={1}
            style={[s.mainText, { color: colors.mutedText }]}
          >
            Buscando tu próximo evento...
          </Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => openCalendarEvent(event)}
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
          s.iconWrap,
          {
            backgroundColor: "rgba(59,130,246,0.14)",
          },
        ]}
      >
        <Feather name="calendar" size={18} color={colors.primary} />
      </View>

      <View style={s.content}>
        <Text style={[s.metaText, { color: colors.primary }]}>
          {formatEventDay(event)} · {formatEventTime(event)}
        </Text>

        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[s.mainText, { color: colors.text }]}
        >
          {event.title}
        </Text>
      </View>

      <Feather name="chevron-right" size={18} color={colors.mutedText} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    content: {
      flex: 1,
      minWidth: 0,
    },

    metaText: {
      fontSize: 12,
      lineHeight: 15,
      fontFamily: "Inter_700Bold",
      textTransform: "uppercase",
      letterSpacing: 0.25,
      marginBottom: 2,
    },

    mainText: {
      fontSize: 15,
      lineHeight: 19,
      fontFamily: "Inter_700Bold",
    },
  });