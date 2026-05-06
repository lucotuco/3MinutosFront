import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  getUpcomingCalendarEvents,
  type UpcomingCalendarEvent,
} from "@/services/calendar";

function formatEventDate(event: UpcomingCalendarEvent) {
  const start = new Date(event.startDate);
  const now = new Date();

  const isToday = start.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const isTomorrow = start.toDateString() === tomorrow.toDateString();

  const time = event.allDay
    ? "Todo el día"
    : start.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });

  if (isToday) {
    return `Hoy · ${time}`;
  }

  if (isTomorrow) {
    return `Mañana · ${time}`;
  }

  const day = start.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return `${day} · ${time}`;
}

export function UpcomingEvents() {
  const colors = useColors();
  const s = makeStyles(colors);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UpcomingCalendarEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        const result = await getUpcomingCalendarEvents(7, 4);

        if (!cancelled) {
          setEvents(result);
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
        <View style={s.headerRow}>
          <Feather name="calendar" size={16} color={colors.primary} />
          <Text style={[s.title, { color: colors.text }]}>
            Buscando próximos eventos
          </Text>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

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
      <View style={s.headerRow}>
        <Feather name="calendar" size={16} color={colors.primary} />
        <Text style={[s.title, { color: colors.text }]}>
          Próximos eventos
        </Text>
      </View>

      <View style={s.eventsList}>
        {events.map((event) => (
          <View key={event.id} style={s.eventRow}>
            <View
              style={[
                s.eventDot,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            />

            <View style={s.eventContent}>
              <Text
                numberOfLines={1}
                style={[s.eventTitle, { color: colors.text }]}
              >
                {event.title}
              </Text>

              <Text
                numberOfLines={1}
                style={[s.eventMeta, { color: colors.mutedText }]}
              >
                {formatEventDate(event)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 13,
      marginBottom: 12,
    },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    title: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },

    eventsList: {
      marginTop: 10,
      gap: 10,
    },

    eventRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    eventDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    eventContent: {
      flex: 1,
    },

    eventTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },

    eventMeta: {
      marginTop: 2,
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
  });