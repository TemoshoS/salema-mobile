import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vibration } from "react-native";

type VoiceEmergencyOptions = {
  command?: string;
  commands?: string[];
  language?: string;
  cooldown?: number;
  vibrationPattern?: number[];
};

export default function useVoiceEmergency(
  onEmergency: () => void,
  {
    command,
    commands,
    language = "en-ZA",
    cooldown = 5000,
    vibrationPattern = [0, 300],
  }: VoiceEmergencyOptions = {}
) {
  const [isListening, setIsListening] = useState(false);

  const lastTrigger = useRef(0);
  const restarting = useRef(false);

  const commandList = useMemo(() => {
    const list =
      commands && commands.length > 0
        ? commands
        : command
        ? [command]
        : ["salema help"];

    return list.map((c) =>
      c
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    );
  }, [command, commands]);

  const restartRecognition = useCallback(
    async (delay: number) => {
      if (restarting.current) return;

      restarting.current = true;

      setTimeout(async () => {
        try {
          await ExpoSpeechRecognitionModule.start({
            lang: language,
            continuous: true,
            interimResults: true,
          });

          console.log("🎤 Restarted listening");
        } catch (e) {
          console.log("Restart failed:", e);
        } finally {
          restarting.current = false;
        }
      }, delay);
    },
    [language]
  );

  useSpeechRecognitionEvent("result", (event) => {
    console.log("RESULT EVENT", JSON.stringify(event, null, 2));
    const now = Date.now();

    if (now - lastTrigger.current < cooldown) {
      return;
    }

    const transcript =
      event.results
        ?.map((r) => r.transcript)
        .join(" ")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim() ?? "";

    if (!transcript) return;

    console.log("🎤 Heard:", transcript);

    const matched = commandList.some((phrase) =>
      transcript.includes(phrase)
    );

    if (!matched) return;

    lastTrigger.current = now;

    Vibration.vibrate(vibrationPattern);

    console.log("🚨 Emergency Triggered");

    onEmergency();
  });

  useSpeechRecognitionEvent("start", () => {
    console.log("🎤 Voice recognition started");
    setIsListening(true);
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("🎤 Voice recognition stopped");
    setIsListening(false);

    restartRecognition(500);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("🎤 Voice recognition error:", event);

    setIsListening(false);

    restartRecognition(1000);
  });

  const startListening = useCallback(async () => {
    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        console.warn("Microphone permission denied.");
        return;
      }

      if (isListening || restarting.current) return;

      await ExpoSpeechRecognitionModule.start({
        lang: language,
        continuous: true,
        interimResults: true,
      });
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
    }
  }, [isListening, language]);

  const stopListening = useCallback(async () => {
    try {
      restarting.current = false;

      if (isListening) {
        await ExpoSpeechRecognitionModule.stop();
      }

      setIsListening(false);
    } catch (error) {
      console.error("Failed to stop voice recognition:", error);
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
  };
}