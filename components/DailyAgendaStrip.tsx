import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import * as Calendar from "expo-calendar";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type Props = {
  weatherLabel?: string;
  weatherIcon?: keyof typeof Feather.glyphMap;
};

export function DailyAgendaStrip({ weatherLabel, weatherIcon = "cloud" }: Props) {
  const colors = useColors();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [events, setEvents] = useState<Calendar.Event[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. CHEQUEO SILENCIOSO AL INICIAR
  useEffect(() => {
    async function checkPermissionSilently() {
      try {
        const { status } = await Calendar.getCalendarPermissionsAsync();
        if (status === "granted") {
          setHasPermission(true);
          await fetchUpcomingEvents();
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.log("Error chequeando calendario en silencio:", error);
        setHasPermission(false);
      }
    }

    checkPermissionSilently();
  }, []);

  // 2. BUSCAR EVENTOS DE HASTA UNA SEMANA ADELANTE
  async function fetchUpcomingEvents() {
    setLoading(true);
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = calendars.map((c) => c.id);

      if (calendarIds.length === 0) {
        setEvents([]);
        return;
      }

      // 👈 EMPETZAMOS DESDE AHORA MISMO (para ignorar reuniones que ya terminaron hoy)
      const startDate = new Date();

      // 👈 TERMINAMOS EXACTAMENTE DENTRO DE 7 DÍAS A LA MEDIANOCHE
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);

      const upcomingEvents = await Calendar.getEventsAsync(calendarIds, startDate, endDate);
      
      // Ordenamos cronológicamente de la más próxima a la más lejana
      upcomingEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.log("Error buscando eventos próximos:", error);
    } finally {
      setLoading(false);
    }
  }

  // 3. GATILLO: SE EJECUTA RECIÉN AL TOCAR EL BOTÓN "CONECTAR"
  async function handleConnectCalendar() {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === "granted") {
        setHasPermission(true);
        await fetchUpcomingEvents();
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.log("Error pidiendo permisos:", error);
    }
  }

  // 4. FORMATEADOR INTELIGENTE DE FECHA (Ej: "Hoy 14:30", "Mañ 10:00", "Lun 16:00")
  function formatEventTime(dateStr: string | Date) {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const timeStr = eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (eventDate.toDateString() === today.toDateString()) {
      return `Hoy ${timeStr}`;
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return `Mañ ${timeStr}`;
    } else {
      // Saca las 3 primeras letras del día en español (ej: "lun", "mar") y capitaliza
      const dayStr = eventDate.toLocaleDateString("es-ES", { weekday: "short" });
      const cleanDay = dayStr.replace(".", ""); // A veces iOS le pone punto ("lun.")
      return `${cleanDay.charAt(0).toUpperCase() + cleanDay.slice(1)} ${timeStr}`;
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      
      {/* ================================================================= */}
      {/* COLUMNA IZQUIERDA: CLIMA (SIEMPRE FIJO E INTOCABLE)               */}
      {/* ================================================================= */}
      <View style={[styles.leftColumn, { borderColor: colors.border }]}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
          <Feather name={weatherIcon} size={22} color={colors.primary} />
        </View>
        <Text style={[styles.weatherText, { color: colors.foreground }]} numberOfLines={2}>
          {weatherLabel || "Tu clima hoy"}
        </Text>
      </View>

      {/* ================================================================= */}
      {/* COLUMNA DERECHA: AGENDA A 7 DÍAS (MÁXIMO 3 EVENTOS)               */}
      {/* ================================================================= */}
      <View style={styles.rightColumn}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name="calendar" size={14} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Próximos</Text>
          </View>
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {hasPermission === false ? (
          <View style={styles.disconnectedContainer}>
            <Text style={[styles.disconnectedText, { color: colors.mutedForeground }]}>
              No conectada
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConnectCalendar}
              style={[styles.connectBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.connectBtnText}>Conectar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {events.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Sin eventos en 7 días
              </Text>
            ) : (
              <View style={styles.eventsList}>
                {/* 👈 CORTAMOS EN 3 EVENTOS EXACTOS */}
                {events.slice(0, 3).map((event, idx) => {
                  return (
                    <View key={event.id || idx} style={styles.eventRow}>
                      <Text style={[styles.eventTime, { color: colors.primary }]}>
                        {formatEventTime(event.startDate)}
                      </Text>
                      <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {event.title}
                      </Text>
                    </View>
                  );
                })}
                
                {/* Si hay más de 3 en la semana, muestra un indicador sutil */}
                {events.length > 3 && (
                  <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
                    + {events.length - 3} más esta semana
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginVertical: 8,
    minHeight: 110, // Aumenté 10px para dar aire extra si hay 3 reuniones
  },
  leftColumn: {
    width: "38%", // Ajusté un pelín para darle 2% más de espacio a la agenda
    justifyContent: "center",
    alignItems: "flex-start",
    paddingRight: 10,
    borderRightWidth: 1,
    gap: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  weatherText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  rightColumn: {
    width: "62%",
    paddingLeft: 12,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 8,
  },
  disconnectedText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  connectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  eventsContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  eventsList: {
    gap: 5, // Un poco más apretadito para que entren bien las 3 filas
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventTime: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    width: 62, // Ahora le damos más ancho para que entre "Hoy 14:30" o "Lun 10:00"
  },
  eventTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  moreText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
});