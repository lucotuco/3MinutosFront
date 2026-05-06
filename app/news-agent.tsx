import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  type MediaStream,
} from "react-native-webrtc";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";

type Status = "idle" | "connecting" | "connected" | "error";

function getEventText(event: any) {
  if (!event || typeof event !== "object") return "";

  if (event.type === "response.output_text.delta") {
    return event.delta || "";
  }

  if (event.type === "response.output_audio_transcript.delta") {
    return event.delta || "";
  }

  if (event.type === "conversation.item.input_audio_transcription.completed") {
    return event.transcript ? `\n\nVos: ${event.transcript}\n` : "";
  }

  if (event.type === "response.done") {
    return "\n";
  }

  return "";
}

export default function NewsAgentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);

  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [digestDate, setDigestDate] = useState<string | null>(null);

  const cleanup = useCallback(async () => {
    try {
      if (dcRef.current?.readyState === "open") {
        dcRef.current.send(
          JSON.stringify({
            type: "response.cancel",
          })
        );
      }
    } catch {}

    try {
      dcRef.current?.close?.();
    } catch {}

    try {
      pcRef.current?.getSenders?.().forEach((sender: any) => {
        sender.track?.stop?.();
      });
    } catch {}

    try {
      pcRef.current?.close?.();
    } catch {}

    try {
      localStreamRef.current?.getTracks?.().forEach((track) => {
        track.stop();
      });
    } catch {}

    try {
      remoteStreamRef.current?.getTracks?.().forEach((track) => {
        track.stop();
      });
    } catch {}

    dcRef.current = null;
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    startingRef.current = false;

    setStatus("idle");
  }, []);

  const startSession = useCallback(async () => {
    if (startingRef.current || pcRef.current) {
      return;
    }

    if (!userId) {
      Alert.alert("Sin usuario", "No encontramos tu sesión.");
      return;
    }

    startingRef.current = true;
    setStatus("connecting");
    setTranscript("");

    try {
      const secretResponse = await api.getNewsAgentClientSecret(userId);

      setDigestDate(secretResponse.digestDate);

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pcRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.addEventListener("track", (event: any) => {
        const [remoteStream] = event.streams || [];

        if (remoteStream) {
          remoteStreamRef.current = remoteStream;
        }
      });

      pc.addEventListener("connectionstatechange", () => {
        const state = pc.connectionState;

        if (state === "connected") {
          setStatus("connected");
        }

        if (
          state === "failed" ||
          state === "closed" ||
          state === "disconnected"
        ) {
          setStatus("idle");
        }
      });

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setStatus("connected");
      };

      dc.onmessage = (message: any) => {
        try {
          const event = JSON.parse(message.data);
          const text = getEventText(event);

          if (text) {
            setTranscript((prev) => prev + text);
          }
        } catch {}
      };

      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${secretResponse.clientSecret}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(errorText || "No se pudo conectar con Realtime.");
      }

      const answerSdp = await sdpResponse.text();

      await pc.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: answerSdp,
        })
      );
    } catch (error) {
      console.log("[news-agent] realtime error:", error);

      setStatus("error");

      Alert.alert(
        "No pudimos iniciar el agente",
        error instanceof Error
          ? error.message
          : "Revisá permisos de micrófono y conexión."
      );

      await cleanup();
    } finally {
      startingRef.current = false;
    }
  }, [cleanup, userId]);

  const stopSession = useCallback(async () => {
    await cleanup();
  }, [cleanup]);

  const isConnecting = status === "connecting";
  const isConnected = status === "connected";

  const s = makeStyles(colors);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            cleanup();
            router.back();
          }}
          style={[
            s.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={s.headerText}>
          <Text style={[s.title, { color: colors.text }]}>
            Agente de noticias
          </Text>

          <Text style={[s.subtitle, { color: colors.mutedText }]}>
            {digestDate
              ? `Contexto del digest: ${digestDate}`
              : "Conversá por voz sobre tus noticias."}
          </Text>
        </View>
      </View>

      <View style={s.center}>
        <TouchableOpacity
          activeOpacity={0.86}
          disabled={isConnecting}
          onPress={isConnected ? stopSession : startSession}
          style={[
            s.micButton,
            {
              backgroundColor: isConnected ? "#ef4444" : colors.primary,
              opacity: isConnecting ? 0.75 : 1,
            },
          ]}
        >
          {isConnecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Feather
              name={isConnected ? "square" : "mic"}
              size={38}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        <Text style={[s.statusText, { color: colors.text }]}>
          {status === "idle" && "Tocá para empezar a hablar"}
          {status === "connecting" && "Conectando con el agente..."}
          {status === "connected" && "Escuchando. Tocá para cortar."}
          {status === "error" && "Hubo un problema al conectar."}
        </Text>
      </View>

      <ScrollView
        style={[
          s.transcriptCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        contentContainerStyle={s.transcriptContent}
      >
        <Text style={[s.transcriptTitle, { color: colors.text }]}>
          Transcripción
        </Text>

        <Text style={[s.transcriptText, { color: colors.mutedText }]}>
          {transcript.trim() || "La conversación va a aparecer acá."}
        </Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: {
      flex: 1,
      paddingHorizontal: 18,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 22,
    },

    backBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    headerText: {
      flex: 1,
    },

    title: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
    },

    subtitle: {
      marginTop: 2,
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },

    center: {
      alignItems: "center",
      marginBottom: 24,
    },

    micButton: {
      width: 104,
      height: 104,
      borderRadius: 52,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },

    statusText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
    },

    transcriptCard: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 22,
      marginBottom: Platform.OS === "ios" ? 28 : 18,
    },

    transcriptContent: {
      padding: 16,
      paddingBottom: 28,
    },

    transcriptTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
    },

    transcriptText: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: "Inter_500Medium",
    },
  });