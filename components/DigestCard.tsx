import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View,Share } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  ArticleVote,
  DigestItem,
  VOTE_DOWN_REASONS,
  VOTE_DOWN_REASON_LABELS,
  VoteDownReason,
} from "@/services/api";
import { CATEGORIES } from "@/constants/categories";
import { usePostHog } from 'posthog-react-native';

interface DigestCardProps {
  item: DigestItem;
  index: number;
  /** El voto que ya tiene esta nota, traído del backend. Así los pulgares siguen marcados al reabrir la app. */
  vote?: ArticleVote | null;
  /** Guarda o cambia el voto. Si no viene, el pulgar solo se manda a la analítica. */
  onVote?: (articleId: string, vote: 1 | -1, reason: VoteDownReason | null) => Promise<void>;
  /** Saca el voto. */
  onRemoveVote?: (articleId: string) => Promise<void>;
}

const rankColors = ["#EF4444", "#3B82F6", "#22C55E"];

type SponsorData = {
  image: any;
  url: string;
};

const SPONSORS_BY_TOPIC: Record<string, SponsorData> = {
  'Política': { image: require('../assets/images/sponsor-politica.png'), url: 'https://www.ypf.com' },
  'Economía': { image: require('../assets/images/sponsor-economia.png'), url: 'https://www.mercadopago.com.ar' },
  'Internacional': { image: require('../assets/images/sponsor-internacional.png'), url: 'https://www.visa.com.ar' },
  'Deportes': { image: require('../assets/images/sponsor-deportes.png'), url: 'https://www.adidas.com.ar' },
  'Sociedad': { image: require('../assets/images/sponsor-sociedad.png'), url: 'https://www.osde.com.ar' },
  'Tecnología': { image: require('../assets/images/sponsor-tecnologia.png'), url: 'https://www.samsung.com/ar' },
  'Entretenimiento/Cultura': { image: require('../assets/images/sponsor-cultura.png'), url: 'https://www.netflix.com' },
  'Default': { image: require('../assets/images/banco-comercio.png'), url: 'https://www.bancodecomercio.com.ar/home' }
};

export function DigestCard({ item, index, vote = null, onVote, onRemoveVote }: DigestCardProps) {
  const colors = useColors();
  const posthog = usePostHog();

  const [expanded, setExpanded] = useState(false);
  const [expandTime, setExpandTime] = useState<number | null>(null);

  // El voto vive en el backend: acá solo se guarda una copia para que el botón responda al instante. Se
  // resincroniza cuando llega el del servidor, y se revierte si el guardado falla.
  const [localVote, setLocalVote] = useState<ArticleVote | null>(vote);
  const [askingReason, setAskingReason] = useState(false);
  const [savingVote, setSavingVote] = useState(false);

  useEffect(() => {
    setLocalVote(vote);
  }, [vote?.vote, vote?.reason, item.articleId]);

  const rankColor = rankColors[index % rankColors.length];
  const title = item.neutralTitle || item.title || "Sin título";
  const lead = item.neutralLead || item.lead || "";
  const summary = item.neutralSummary || item.summary || lead || "No hay más información disponible para esta noticia.";
  const isFallback = item.usedFallback;

  const getMainCategory = () => {
    if (item.category && SPONSORS_BY_TOPIC[item.category]) return item.category;
    if (SPONSORS_BY_TOPIC[item.topic]) return item.topic;
    const topicLower = (item.topic || "").toLowerCase().trim();
    for (const [mainCat, subTopics] of Object.entries(CATEGORIES)) {
      if (subTopics.some((t) => t.toLowerCase() === topicLower)) return mainCat;
    }
    return 'Default';
  };

  const mainCatKey = getMainCategory();
  const currentSponsor = SPONSORS_BY_TOPIC[mainCatKey] || SPONSORS_BY_TOPIC['Default'];

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (posthog) {
      posthog.capture('article_shared', { topic: item.topic, title });
    }

    // 👈 ACÁ PONÉS EL LINK REAL DE TU APP (Landing, Play Store o App Store)
    const appLink = "https://3minutos.app"; 

    const message = `📰 *${title}*\n\n${summary}\n\n—\n¿Querés leer más noticias como esta en 3 minutos? Descargá la app acá:\n👉 ${appLink}`;

    try {
      await Share.share({
        message,
        title: title,
      });
    } catch (error) {
      console.log("Error al compartir noticia:", error);
    }
  };

  const toggleExpanded = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => {
      const isNowExpanded = !prev;
      
      // 📊 ANALÍTICA: Medición de Tiempos (Dwell Time)
      if (isNowExpanded && posthog) {
        posthog.capture('article_expanded', { topic: item.topic, category: mainCatKey });
        setExpandTime(Date.now());
      } else if (!isNowExpanded && posthog && expandTime) {
        const seconds = Math.round((Date.now() - expandTime) / 1000);
        posthog.capture('article_read_time', { 
          topic: item.topic, 
          dwell_time_seconds: seconds 
        });
        setExpandTime(null);
      }
      return isNowExpanded;
    });
  };

  const reportarAnalitica = (vote: 1 | -1 | null, reason: VoteDownReason | null) => {
    if (!posthog) return;
    posthog.capture('article_feedback', {
      topic: item.topic,
      vote: vote === 1 ? 'up' : vote === -1 ? 'down' : 'removed',
      reason: reason ?? null,
      article_id: item.articleId || null,
    });
  };

  /**
   * Guarda el voto en el backend (y lo reporta a la analítica). El pulgar se marca al instante y se revierte si
   * el guardado falla: mostrarlo como votado cuando no se guardó sería peor que no mostrar nada.
   */
  const guardarVoto = async (next: ArticleVote | null, reason: VoteDownReason | null) => {
    const anterior = localVote;
    setLocalVote(next);
    setSavingVote(true);

    try {
      if (!item.articleId) return; // sin id no se puede atar el voto a una nota; queda solo en la analítica
      if (next === null) await onRemoveVote?.(item.articleId);
      else await onVote?.(item.articleId, next.vote, reason);
    } catch {
      setLocalVote(anterior); // el voto no se guardó: el botón no puede decir que sí
      setAskingReason(false);
      return;
    } finally {
      setSavingVote(false);
    }

    reportarAnalitica(next?.vote ?? null, reason);
  };

  const handleFeedback = async (type: 1 | -1) => {
    if (savingVote) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Tocar el pulgar que ya estaba marcado lo saca; tocar el otro, cambia el voto.
    if (localVote?.vote === type) {
      setAskingReason(false);
      await guardarVoto(null, null);
      return;
    }

    setAskingReason(type === -1);
    await guardarVoto({ articleId: item.articleId || '', vote: type, reason: null }, null);
  };

  const handleReason = async (reason: VoteDownReason) => {
    if (savingVote) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAskingReason(false);
    await guardarVoto({ articleId: item.articleId || '', vote: -1, reason }, reason);
  };

  const openSponsorUrl = async () => {
    /*if (!currentSponsor.url) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (posthog) posthog.capture('sponsor_clicked', { sponsor_category: mainCatKey });
    Linking.openURL(currentSponsor.url);*/
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (posthog) posthog.capture('sponsor_clicked', { sponsor_category: mainCatKey });
      
      const email = "lucasschlez@gmail.com";
      const subject = encodeURIComponent(`Anunciar en 3 Minutos - ${mainCatKey}`);
      const body = encodeURIComponent(`Hola Lucas,\n\nMe gustaría recibir información para pautar y anunciar en la sección "${mainCatKey}" de 3 Minutos.\n\n¡Gracias!`);
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.log("Error al abrir aplicación de correo:", error);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={toggleExpanded}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.leftColumn}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : null}

        {expanded && (
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={openSponsorUrl}
            style={[styles.sponsorContainerVertical, { borderColor: colors.border, backgroundColor: colors.background }]}
          >
            <Text style={[{ color: colors.text, fontSize: 13, textAlign: "center", fontFamily: "Inter_600SemiBold" }]}>Anuncia Aqui</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.textContent}>
        <View style={styles.topRow}>
          <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
            <Text style={styles.rankBadgeText}>{index + 1}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={[styles.topic, { color: rankColor }]} numberOfLines={1}>
              {isFallback && <Feather name="zap" size={10} color={rankColor} />} {(item.topic || "General").toUpperCase()}
              {isFallback ? " (SUGERIDO)" : ""}
            </Text>
            {isFallback && (
              <Text style={[styles.metaSmall, { color: colors.mutedForeground, fontStyle: "italic", marginTop: 2 }]} numberOfLines={2}>
                No encontramos noticias exactas, pero esto te puede interesar.
              </Text>
            )}
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={expanded ? undefined : 3}>
          {title}
        </Text>

        {lead && !expanded ? (
          <Text style={[styles.lead, { color: colors.accentForeground }]} numberOfLines={2}>{lead}</Text>
        ) : null}

        {expanded ? (
          <View style={styles.expandedBlock}>
            {lead ? <Text style={[styles.lead, { color: colors.accentForeground, marginBottom: 6 }]}>{lead}</Text> : null}
            <Text style={[styles.summary, { color: colors.mutedForeground }]}>{summary}</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.shareButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.secondary,
                },
              ]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={13} color={colors.primary} />
              <Text style={[styles.shareText, { color: colors.primary }]}>
                Compartir noticia
              </Text>
            </TouchableOpacity>

            {/* 👇 BLOQUE DE FEEDBACK: el pulgar se puede cambiar o sacar, y el de abajo pregunta por qué 👇 */}
            <View style={[styles.feedbackRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.feedbackText, { color: colors.mutedForeground }]} numberOfLines={2}>
                {localVote === null
                  ? "¿Te sirvió esta noticia?"
                  : localVote.vote === 1
                    ? "¡Gracias por tu opinión!"
                    : localVote.reason
                      ? `Anotado: ${VOTE_DOWN_REASON_LABELS[localVote.reason].toLowerCase()}`
                      : "¡Gracias por tu opinión!"}
              </Text>

              <View style={styles.feedbackActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={savingVote}
                  accessibilityRole="button"
                  accessibilityLabel="Me sirvió esta noticia"
                  accessibilityState={{ selected: localVote?.vote === 1 }}
                  onPress={() => handleFeedback(1)}
                  style={[
                    styles.feedbackBtn,
                    {
                      backgroundColor: localVote?.vote === 1 ? colors.primary + "22" : colors.background,
                      borderColor: localVote?.vote === 1 ? colors.primary : colors.border,
                      opacity: savingVote ? 0.5 : 1,
                    },
                  ]}
                >
                  <Feather name="thumbs-up" size={14} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={savingVote}
                  accessibilityRole="button"
                  accessibilityLabel="No me sirvió esta noticia"
                  accessibilityState={{ selected: localVote?.vote === -1 }}
                  onPress={() => handleFeedback(-1)}
                  style={[
                    styles.feedbackBtn,
                    {
                      backgroundColor: localVote?.vote === -1 ? colors.destructive + "22" : colors.background,
                      borderColor: localVote?.vote === -1 ? colors.destructive : colors.border,
                      opacity: savingVote ? 0.5 : 1,
                    },
                  ]}
                >
                  <Feather name="thumbs-down" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>

            {/* El motivo del pulgar abajo: es lo que dice qué parte del motor hay que corregir. Salteable. */}
            {askingReason && localVote?.vote === -1 && (
              <View style={styles.reasonBlock}>
                <View style={styles.reasonHeader}>
                  <Text style={[styles.reasonTitle, { color: colors.mutedForeground }]}>¿Por qué?</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Saltear el motivo"
                    onPress={() => setAskingReason(false)}
                    hitSlop={8}
                  >
                    <Text style={[styles.reasonSkip, { color: colors.mutedForeground }]}>Saltear</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.reasonChips}>
                  {VOTE_DOWN_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      activeOpacity={0.7}
                      disabled={savingVote}
                      accessibilityRole="button"
                      onPress={() => handleReason(reason)}
                      style={[
                        styles.reasonChip,
                        { borderColor: colors.border, backgroundColor: colors.background, opacity: savingVote ? 0.5 : 1 },
                      ]}
                    >
                      <Text style={[styles.reasonChipText, { color: colors.foreground }]}>
                        {VOTE_DOWN_REASON_LABELS[reason]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "stretch", borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8, gap: 12, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  leftColumn: { flexDirection: "column", alignItems: "center", gap: 12, width: 95 },
  image: { width: 95, height: 95, borderRadius: 12 },
  sponsorContainerVertical: { marginTop: "auto", width: "100%", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1 },
  textContent: { flex: 1, gap: 5 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rankBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  rankBadgeText: { color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_700Bold" },
  metaBlock: { flex: 1 },
  topic: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.35 },
  metaSmall: { fontSize: 10, fontFamily: "Inter_400Regular" },
  title: { fontSize: 16, lineHeight: 19, fontFamily: "Inter_700Bold" },
  lead: { fontSize: 13, lineHeight: 16, fontFamily: "Inter_500Medium" },
  expandedBlock: { marginTop: 2, gap: 7 },
  summary: { fontSize: 13, lineHeight: 17, fontFamily: "Inter_400Regular" },
  
  // Estilos del Feedback
  feedbackRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTopWidth: 1, gap: 8 },
  feedbackText: { fontSize: 12, fontFamily: "Inter_500Medium", flexShrink: 1 },
  feedbackActions: { flexDirection: "row", gap: 8 },
  feedbackBtn: { padding: 6, borderRadius: 8, borderWidth: 1 },
  reasonBlock: { marginTop: 8, gap: 6 },
  reasonHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reasonTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  reasonSkip: { fontSize: 11, fontFamily: "Inter_500Medium", textDecorationLine: "underline" },
  reasonChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reasonChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  reasonChipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  shareButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 8,
  },
  shareText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});