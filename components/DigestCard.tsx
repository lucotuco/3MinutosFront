import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { DigestItem } from "@/services/api";
import { CATEGORIES } from "@/constants/categories";
import { usePostHog } from 'posthog-react-native';

interface DigestCardProps {
  item: DigestItem;
  index: number;
}

const rankColors = ["#EF4444", "#3B82F6", "#22C55E"];

type SponsorData = {
  image: any;
  url: string;
};

// Dejo los comodines del Banco de Comercio, vos después le ponés los tuyos.
const SPONSORS_BY_TOPIC: Record<string, SponsorData> = {
  'Política': {
    image: require('../assets/images/sponsor-politica.png'), 
    url: 'https://www.ypf.com',
  },
  'Economía': {
    image: require('../assets/images/sponsor-economia.png'), 
    url: 'https://www.mercadopago.com.ar',
  },
  'Internacional': {
    image: require('../assets/images/sponsor-internacional.png'), 
    url: 'https://www.visa.com.ar',
  },
  'Deportes': {
    image: require('../assets/images/sponsor-deportes.png'), 
    url: 'https://www.adidas.com.ar',
  },
  'Sociedad': {
    image: require('../assets/images/sponsor-sociedad.png'), 
    url: 'https://www.osde.com.ar',
  },
  'Tecnología': {
    image: require('../assets/images/sponsor-tecnologia.png'), 
    url: 'https://www.samsung.com/ar',
  },
  'Entretenimiento/Cultura': {
    image: require('../assets/images/sponsor-cultura.png'), 
    url: 'https://www.netflix.com',
  },
  'Default': { 
    image: require('../assets/images/banco-comercio.png'),
    url: 'https://www.bancodecomercio.com.ar/home',
  }
};

export function DigestCard({ item, index }: DigestCardProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const posthog = usePostHog();

  const rankColor = rankColors[index % rankColors.length];

  const title = item.neutralTitle || item.title || "Sin título";
  const lead = item.neutralLead || item.lead || "";
  const summary =
    item.neutralSummary ||
    item.summary ||
    lead ||
    "No hay más información disponible para esta noticia.";

  const isFallback = item.usedFallback;

  // --- SOLUCIÓN AL FALLBACK: Buscamos a qué categoría pertenece el sub-tópico ---
  const getMainCategory = () => {
    if (item.category && SPONSORS_BY_TOPIC[item.category]) return item.category;
    if (SPONSORS_BY_TOPIC[item.topic]) return item.topic;

    const topicLower = (item.topic || "").toLowerCase().trim();
    
    // Iteramos por las categorías buscando si "Videojuegos" está adentro de "Tecnología", etc.
    for (const [mainCat, subTopics] of Object.entries(CATEGORIES)) {
      if (subTopics.some((t) => t.toLowerCase() === topicLower)) {
        return mainCat;
      }
    }
    return 'Default';
  };

  const mainCatKey = getMainCategory();
  const currentSponsor = SPONSORS_BY_TOPIC[mainCatKey] || SPONSORS_BY_TOPIC['Default'];

  const toggleExpanded = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => {
      const isNowExpanded = !prev;
      if (isNowExpanded && posthog) {
        posthog.capture('article_expanded', { topic: item.topic });
      }
      return isNowExpanded;
    });
  };

  const openSponsorUrl = async () => {
    if (!currentSponsor.url) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (posthog) {
      posthog.capture('sponsor_clicked', { sponsor_category: mainCatKey });
    }

    Linking.openURL(currentSponsor.url);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={toggleExpanded}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* --- COLUMNA IZQUIERDA: Foto + Sponsor Expandido --- */}
      <View style={styles.leftColumn}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}

        {/* Solo mostramos el sponsor si la tarjeta está abierta */}
        {expanded && (
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={openSponsorUrl}
            style={[styles.sponsorContainerVertical, { borderColor: colors.border, backgroundColor: colors.background }]}
          >
            <Text style={[styles.sponsorLabel, { color: colors.mutedForeground }]}>PRESENTADO POR</Text>
            <Image 
              source={currentSponsor.image} 
              style={styles.sponsorImageVertical} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* --- COLUMNA DERECHA: Textos de la Noticia --- */}
      <View style={styles.textContent}>
        <View style={styles.topRow}>
          <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
            <Text style={styles.rankBadgeText}>{index + 1}</Text>
          </View>

          <View style={styles.metaBlock}>
            <Text style={[styles.topic, { color: rankColor }]} numberOfLines={1}>
              {isFallback && <Feather name="zap" size={10} color={rankColor} />}{" "}
              {(item.topic || "General").toUpperCase()}
              {isFallback ? " (SUGERIDO)" : ""}
            </Text>

            {isFallback && (
              <Text
                style={[
                  styles.metaSmall,
                  { color: colors.mutedForeground, fontStyle: "italic", marginTop: 2 },
                ]}
                numberOfLines={2}
              >
                No encontramos noticias exactas, pero esto te puede interesar.
              </Text>
            )}
          </View>

          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </View>

        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={expanded ? undefined : 3}
        >
          {title}
        </Text>

        {lead && !expanded ? (
          <Text
            style={[styles.lead, { color: colors.accentForeground }]}
            numberOfLines={2}
          >
            {lead}
          </Text>
        ) : null}

        {expanded ? (
          <View style={styles.expandedBlock}>
            {lead ? (
              <Text style={[styles.lead, { color: colors.accentForeground, marginBottom: 6 }]}>
                {lead}
              </Text>
            ) : null}
            <Text style={[styles.summary, { color: colors.mutedForeground }]}>
              {summary}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch", 
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },
  leftColumn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    width: 95, 
  },
  image: {
    width: 95,
    height: 95,
    borderRadius: 12,
  },
  // --- ESTILOS DEL SPONSOR VERTICAL ---
  sponsorContainerVertical: {
    // 2. ADD THIS LINE
    marginTop: "auto",
    width: "100%",
    // 3. CHANGE THIS LINE from "flex-end" to "center"
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  sponsorLabel: {
    fontSize:10,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 10,
  },
  sponsorImageVertical: {
    width: 80,
    height: 40, // Más altura para que el logo se luzca
  },
  // ------------------------------------
  textContent: {
    flex: 1,
    gap: 5,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  metaBlock: {
    flex: 1,
  },
  topic: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.35,
  },
  metaSmall: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontFamily: "Inter_700Bold",
  },
  lead: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: "Inter_500Medium",
  },
  expandedBlock: {
    marginTop: 2,
    gap: 7,
  },
  summary: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
  },
});