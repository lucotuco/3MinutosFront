import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export function PushSoftPrompt({ visible, onAccept, onDecline }: Props) {
  const colors = useColors();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconRing, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="bell" size={26} color={colors.primary} />
          </View>

          {/* 👈 TÍTULO PROFESIONAL */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            Tu resumen diario, siempre a tiempo
          </Text>

          {/* 👈 MENSAJE CLARO Y DE VALOR */}
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            Recibe <Text style={{fontWeight: '600', color: colors.foreground}}>una única notificación diaria</Text> justo en el momento en que tu resumen personalizado esté preparado para escuchar.
          </Text>

          <TouchableOpacity activeOpacity={0.85} onPress={onAccept} style={[styles.btnPrimary, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnPrimaryText}>Activar recordatorio</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={onDecline} style={styles.btnSecondary}>
            <Text style={[styles.btnSecondaryText, { color: colors.mutedForeground }]}>Quizás más adelante</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  card: { width: "100%", maxWidth: 350, borderWidth: 1, borderRadius: 24, padding: 24, alignItems: "center", gap: 14 },
  iconRing: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  message: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 10 },
  btnPrimary: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  btnSecondary: { width: "100%", paddingVertical: 10, alignItems: "center" },
  btnSecondaryText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});