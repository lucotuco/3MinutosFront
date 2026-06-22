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
  DeviceEventEmitter,
} from "react-native";
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  type MediaStream,
} from "react-native-webrtc";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import InCallManager from 'react-native-incall-manager';

type Status = "idle" | "connecting" | "connected" | "error";

export default function NewsAgentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();

  const pcRef = useRef<any>(null);
  const dcRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const wiredListenerRef = useRef<any>(null);

  const introSentRef = useRef(false);
  const introInProgressRef = useRef(false);
  const responseInProgressRef = useRef(false);
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);
  const transcriptRef = useRef("");
  const pendingAssistantTranscriptRef = useRef("");
  const awaitingUserTranscriptRef = useRef(false);

  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [digestDate, setDigestDate] = useState<string | null>(null);
  const [speakerOn, setSpeakerOn] = useState(true);

  const setLocalMicEnabled = useCallback((enabled: boolean) => {
    try {
      localStreamRef.current?.getAudioTracks?.().forEach((track: any) => {
        track.enabled = enabled;
      });
    } catch {}
  }, []);

  const toggleSpeaker = useCallback(async () => {
    const nextState = !speakerOn;
    setSpeakerOn(nextState);

    // 1. Destrabamos el candado de Expo AV
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        // Si usamos altavoz (true), esto debe ser false. Y viceversa.
        playThroughEarpieceAndroid: !nextState, 
      });
    } catch (e) {
      console.log("Error destrabando expo-av:", e);
    }

    // 2. Le ordenamos el cambio a InCallManager
    InCallManager.setForceSpeakerphoneOn(nextState);
  }, [speakerOn]);

  const flushTranscriptToScreen = useCallback(() => {
    setTranscript(transcriptRef.current);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 50);
  }, []);

  const appendTranscript = useCallback(
    (text: string) => {
      if (!text) {
        return;
      }

      transcriptRef.current += text;
      flushTranscriptToScreen();
    },
    [flushTranscriptToScreen]
  );

  const cleanup = useCallback(async () => {
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }

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
      localStreamRef.current?.getTracks?.().forEach((track: any) => {
        track.stop();
      });
    } catch {}

    try {
      remoteStreamRef.current?.getTracks?.().forEach((track: any) => {
        track.stop();
      });
    } catch {}

    dcRef.current = null;
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    startingRef.current = false;
    introSentRef.current = false;
    introInProgressRef.current = false;
    responseInProgressRef.current = false;
    awaitingUserTranscriptRef.current = false;
    pendingAssistantTranscriptRef.current = "";

    setStatus("idle");
    InCallManager.stop();
  }, []);

  const startSession = useCallback(async () => {
    if (startingRef.current || pcRef.current) {
      return;
    }

    if (!userId) {
      Alert.alert("Sin usuario", "No encontramos tu sesión.");
      return;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: !speakerOn, 
      });
    } catch (e) {}

    // 2. Iniciamos InCallManager con Cancelación de Eco (audio) 
    // PERO con su ruteo automático APAGADO (auto: false).
    InCallManager.start({ media: 'audio', auto: false });
    InCallManager.setForceSpeakerphoneOn(speakerOn);

    startingRef.current = true;
    introSentRef.current = false;
    introInProgressRef.current = false;
    responseInProgressRef.current = false;
    awaitingUserTranscriptRef.current = false;
    pendingAssistantTranscriptRef.current = "";

    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }

    setStatus("connecting");
    transcriptRef.current = "";
    setTranscript("");

    try {
      const secretResponse = await api.getNewsAgentClientSecret(userId);
      setDigestDate(secretResponse.digestDate);

      const stream = await mediaDevices.getUserMedia({
        audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        }as any,
        video: false,
      });

      localStreamRef.current = stream;

      // Arrancamos con el mic apagado para que ningún ruido ambiente
      // corte la primera respuesta del agente.
      setLocalMicEnabled(false);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pcRef.current = pc;

      const sendClientEvent = (event: any) => {
        const dc = dcRef.current;

        if (!dc || dc.readyState !== "open") {
          return false;
        }

        dc.send(JSON.stringify(event));
        return true;
      };

      const enableMicAfterIntro = () => {
        if (!introInProgressRef.current) {
          return;
        }

        introInProgressRef.current = false;
        setLocalMicEnabled(true);
      };

      const sendAgentIntro = () => {
        if (introSentRef.current) {
          return;
        }

        const dc = dcRef.current;

        if (!dc || dc.readyState !== "open") {
          return;
        }

        if (introTimeoutRef.current) {
          clearTimeout(introTimeoutRef.current);
          introTimeoutRef.current = null;
        }

        introSentRef.current = true;
        introInProgressRef.current = true;
        responseInProgressRef.current = true;

        transcriptRef.current = "Dan está arrancando la conversación...\n\n";
        flushTranscriptToScreen();

        /*sendClientEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Arrancá vos la conversación. Saludame brevemente como Dan Agente Virtual y preguntame qué noticia del digest quiero conversar.",
              },
            ],
          },
        });*/

        sendClientEvent({
          type: "response.create",
          response: {
            output_modalities: ["audio"],
            instructions:
              "Respondé al mensaje inicial del usuario. Empezá vos la conversación. Saludá breve, cálido y cercano, como Dan Agente Virtual. Preguntá cuál de las noticias del resumen quiere discutir. No des un resumen largo todavía. No esperes a que el usuario hable primero.",
          },
        });
      };

      const scheduleAgentIntro = () => {
        if (introSentRef.current || introTimeoutRef.current) {
          return;
        }

        introTimeoutRef.current = setTimeout(() => {
          introTimeoutRef.current = null;
          sendAgentIntro();
        }, 350);
      };

      stream.getTracks().forEach((track: any) => {
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
          InCallManager.setForceSpeakerphoneOn(speakerOn);
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
        scheduleAgentIntro();
      };

      dc.onmessage = (message: any) => {
        try {
          const event = JSON.parse(message.data);

          if (event.type === "response.created") {
            responseInProgressRef.current = true;
          }

          if (event.type === "input_audio_buffer.committed") {
            awaitingUserTranscriptRef.current = true;
          }

          if (
            event.type ===
            "conversation.item.input_audio_transcription.completed"
          ) {
            const userText = event.transcript || "";

            awaitingUserTranscriptRef.current = false;

            if (userText.trim()) {
              appendTranscript(`\n\nVos: ${userText.trim()}\n`);
            }

            if (pendingAssistantTranscriptRef.current.trim()) {
              const pending = pendingAssistantTranscriptRef.current.trim();
              pendingAssistantTranscriptRef.current = "";

              appendTranscript(`\nDan: ${pending}\n`);
            }
          }

          if (event.type === "response.output_audio_transcript.done") {
            const assistantText = event.transcript || "";

            if (assistantText.trim()) {
              if (awaitingUserTranscriptRef.current) {
                pendingAssistantTranscriptRef.current = assistantText.trim();
              } else {
                appendTranscript(`\nDan: ${assistantText.trim()}\n`);
              }
            }
          }

          if (event.type === "response.done") {
            responseInProgressRef.current = false;
            enableMicAfterIntro();
          }

          if (
            event.type === "response.cancelled" ||
            event.type === "response.failed"
          ) {
            responseInProgressRef.current = false;
            enableMicAfterIntro();
          }

          if (event.type === "error") {
            console.log("[news-agent] realtime event error:", event);
            responseInProgressRef.current = false;
            enableMicAfterIntro();
          }
        } catch (error) {
          console.log("[news-agent] invalid realtime message:", error);
        }
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

      scheduleAgentIntro();
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
  }, [
    appendTranscript,
    cleanup,
    flushTranscriptToScreen,
    setLocalMicEnabled,
    userId,
  ]);

  const stopSession = useCallback(async () => {
    await cleanup();
  }, [cleanup]);

  const isConnecting = status === "connecting";
  const isConnected = status === "connected";

  const s = makeStyles(colors);

  return (
    <View
      style={[
        s.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <View style={s.header}>
        <TouchableOpacity
          activeOpacity={0.82}
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
          <Text style={[s.subtitle, { color: colors.muted }]}>
            {digestDate
              ? `Contexto del resumen: ${digestDate}`
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
              backgroundColor: isConnected ? "#EF4444" : colors.primary,
              opacity: isConnecting ? 0.75 : 1,
            },
          ]}
        >
          {isConnecting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Feather
              name={isConnected ? "square" : "mic"}
              size={34}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        <Text style={[s.statusText, { color: colors.text }]}>
          {status === "idle" && "Tocá para empezar a hablar"}
          {status === "connecting" && "Conectando con el agente..."}
          {status === "connected" && "Escuchando. Tocá para cortar."}
          {status === "error" && "Hubo un problema al conectar."}
        </Text>

        {isConnected && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleSpeaker}
            style={[
              s.speakerBtn,
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}
          >
            <Feather 
              name={speakerOn ? "volume-2" : "headphones"} 
              size={18} 
              color={colors.text} 
            />
            <Text style={[s.speakerBtnText, { color: colors.text }]}>
              {speakerOn ? "Altavoz" : "Auricular"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={[
          s.transcriptCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        contentContainerStyle={s.transcriptContent}
        onContentSizeChange={() => {
          scrollRef.current?.scrollToEnd?.({ animated: true });
        }}
      >
        <Text style={[s.transcriptTitle, { color: colors.text }]}>
          Transcripción
        </Text>

        <Text style={[s.transcriptText, { color: colors.text }]}>
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
    speakerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderWidth: 1,
      borderRadius: 999,
      marginTop: 20, 
    },
    speakerBtnText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
  });