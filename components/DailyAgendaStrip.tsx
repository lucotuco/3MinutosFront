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

type DailyAgendaStripProps = {
  todayLabel: string;
  weatherLabel: string;
  weatherIcon?: keyof typeof Feather.glyphMap;
  weatherLoading: boolean;
};

const WEEKDAY_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function formatEventMarker(event: UpcomingCalendarEvent) {
  const start = new Date(event.startDate);
  const now = new Date();

  if (isSameDay(start, now)) {
    if (event.allDay) return "hoy";

    return start.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return WEEKDAY_SHORT[start.getDay()];
}

function formatCompactTodayLabel(todayLabel: string) {
  return todayLabel
    .replace(/^\w/, (letter) => letter.toUpperCase())
    .replace("miércoles", "Mié")
    .replace("Miércoles", "Mié")
    .replace("martes", "Mar")
    .replace("Martes", "Mar")
    .replace("jueves", "Jue")
    .replace("Jueves", "Jue")
    .replace("viernes", "Vie")
    .replace("Viernes", "Vie")
    .replace("sábado", "Sáb")
    .replace("Sábado", "Sáb")
    .replace("domingo", "Dom")
    .replace("Domingo", "Dom")
    .replace("lunes", "Lun")
    .replace("Lunes", "Lun");
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

export function DailyAgendaStrip({
  todayLabel,
  weatherLabel,
  weatherIcon = "sun",
  weatherLoading,
}: DailyAgendaStripProps) {
  const colors = useColors();
  const s = makeStyles(colors);

  const [eventsLoading, setEventsLoading] = useState(true);
  const [events, setEvents] = useState<UpcomingCalendarEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        const result = await getUpcomingCalendarEvents(7, 3);

        if (!cancelled) {
          setEvents(result);
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleEvents = events?.slice(0, 3) ?? [];

  const getWeatherColor = (iconName: string) => {
    switch (iconName) {
      case "sun":
        return "#F59E0B"; 
      case "cloud-rain":
        return "#60A5FA";
      case "cloud-drizzle":
        return "#60A5FA"; 
      case "cloud-lightning":
        return "#8B5CF6"; 
      case "cloud-snow":
        return "#E0F2FE"; 
      case "cloud":
      default:
        return colors.mutedText;
    }
  };

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
      <View style={s.leftBlock}>
        

        <View style={s.dateTextBlock}>
          <Text
            numberOfLines={1}
            style={[s.todayText, { color: colors.text }]}
          >
            {formatCompactTodayLabel(todayLabel)}
          </Text>

          <View style={s.weatherRow}>
            <Feather name={weatherIcon} size={11} color={getWeatherColor(weatherIcon)} />

            {weatherLoading ? (
              <ActivityIndicator size="small" color={colors.mutedText} />
            ) : (
              <Text
                numberOfLines={1}
                style={[s.weatherText, { color: colors.mutedText }]}
              >
                {weatherLabel || "Clima no disponible"}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={[s.divider, { backgroundColor: colors.border }]} />

      <View style={s.eventsBlock}>
        <View style={s.eventsHeaderRow}>
          <Text style={[s.eventsHeader, { color: colors.primary }]}>
            Tu calendario
          </Text>

          {eventsLoading && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>

        {!eventsLoading && visibleEvents.length === 0 ? (
          <Text
            numberOfLines={1}
            style={[s.noEventsText, { color: colors.mutedText }]}
          >
            Tu agenda está libre
          </Text>
        ) : (
          <View style={s.eventsList}>
            {visibleEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                activeOpacity={0.8}
                onPress={() => openCalendarEvent(event)}
                style={s.eventRow}
              >
                <Text
                  numberOfLines={1}
                  style={[s.eventMarker, { color: colors.primary }]}
                >
                  {formatEventMarker(event)}
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[s.eventTitle, { color: colors.text }]}
                >
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 11,
      paddingVertical: 9,
      marginBottom: 8,
      marginTop:10,
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: 86,
    },

    leftBlock: {
      width: 112,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingRight: 8,
    },

    dateIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    dateTextBlock: {
      flex: 1,
      minWidth: 0,
    },

    todayText: {
      fontSize: 13,
      lineHeight: 15,
      fontFamily: "Inter_700Bold",
      marginBottom: 3,
    },

    weatherRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      minWidth: 0,
    },

    weatherText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 14,
      fontFamily: "Inter_600SemiBold",
    },

    divider: {
      width: 1,
      marginHorizontal: 8,
      opacity: 0.8,
    },

    eventsBlock: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },

    eventsHeaderRow: {
      height: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 3,
    },

    eventsHeader: {
      fontSize: 12,
      lineHeight: 14,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.45,
    },

    eventsList: {
      gap: 2,
    },

    eventRow: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
      height: 17,
    },

    eventMarker: {
      width: 38,
      fontSize: 12,
      lineHeight: 14,
      fontFamily: "Inter_700Bold",
      textTransform: "lowercase",
      marginRight: 5,
    },

    eventTitle: {
      flex: 1,
      fontSize: 12,
      lineHeight: 15,
      fontFamily: "Inter_600SemiBold",
    },

    noEventsText: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: "Inter_600SemiBold",
    },
  });