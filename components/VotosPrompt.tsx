import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Aviso de que las noticias se pueden puntuar. Se muestra UNA sola vez (la marca queda en AsyncStorage con la
 * clave `votos_prompt_visto`, ver app/(tabs)/index.tsx).
 *
 * El texto le pide que vote lo que lee, no que evalúe el producto: a quien se le pide "ayudame a probar esto"
 * vota pensando en el que pregunta y marca cosas raras; a quien se le dice "tocá el pulgar según si te sirvió"
 * vota como usuario. La diferencia es entre datos y cortesía.
 */
export function VotosPrompt({ visible, onClose }: Props) {
  const colors = useColors();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconRing, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="thumbs-up" size={26} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Ahora podés puntuar las noticias
          </Text>

          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            Cuando abrís una noticia vas a ver{" "}
            <Text style={{ fontWeight: "600", color: colors.foreground }}>dos pulgares</Text> abajo.
            Tocá el que corresponda según si te sirvió o no. Con eso elegimos mejor las que te mostramos
            cada día.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            accessibilityRole="button"
            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.btnPrimaryText}>Entendido</Text>
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
});
