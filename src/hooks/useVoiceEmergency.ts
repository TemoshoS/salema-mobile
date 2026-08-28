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

  const isListeningRef = useRef(false);
  const isStarting = useRef(false);
  const isStopping = useRef(false);
  const shouldListen = useRef(false);

  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrigger = useRef(0);

  // Keep the latest callback without changing the recognition callbacks
  const onEmergencyRef = useRef(onEmergency);

  useEffect(() => {
    onEmergencyRef.current = onEmergency;
  }, [onEmergency]);

  const commandList = useMemo(() => {
    const list =
      commands && commands.length > 0
        ? commands
        : command
        ? [command]
        : ["salema help"];

    return list
      .map((c) =>
        c
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);
  }, [command, commands]);

  const commandListRef = useRef(commandList);

  useEffect(() => {
    commandListRef.current = commandList;
  }, [commandList]);

  const clearRestartTimer = useCallback(() => {
    if (restartTimer.current) {
      clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
  }, []);

  const startRecognition = useCallback(async () => {
    if (!shouldListen.current) return;

    if (isStarting.current || isListeningRef.current) {
      return;
    }

    try {
      isStarting.current = true;

      console.log("🎤 Starting speech recognition...");

      await ExpoSpeechRecognitionModule.start({
        lang: language,
        continuous: false,
        interimResults: true,
      });

      console.log("🎤 Speech recognition started");
    } catch (error) {
      console.log("🎤 Start error:", error);
    } finally {
      isStarting.current = false;
    }
  }, [language]);

  const scheduleRestart = useCallback(() => {
    if (!shouldListen.current) return;

    clearRestartTimer();

    restartTimer.current = setTimeout(() => {
      restartTimer.current = null;

      if (!shouldListen.current) return;

      startRecognition();
    }, 700);
  }, [clearRestartTimer, startRecognition]);

  useSpeechRecognitionEvent("result", (event) => {
    console.log(
      "🎤 RESULT:",
      JSON.stringify(event, null, 2)
    );

    const results = event.results ?? [];

    const transcript = results
      .map((result) => result.transcript)
      .join(" ")
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!transcript) return;

    console.log("🎤 Heard:", transcript);
    console.log("🎤 Commands:", commandListRef.current);

    const matched = commandListRef.current.some((phrase) =>
      transcript.includes(phrase)
    );

    if (!matched) {
      console.log("🎤 No emergency phrase matched");
      return;
    }

    const now = Date.now();

    if (now - lastTrigger.current < cooldown) {
      console.log("🎤 Emergency ignored because of cooldown");
      return;
    }

    lastTrigger.current = now;

    console.log("🚨 EMERGENCY PHRASE DETECTED");

    Vibration.vibrate(vibrationPattern);

    onEmergencyRef.current();
  });

  useSpeechRecognitionEvent("start", () => {
    console.log("🎤 Voice recognition started");

    isListeningRef.current = true;
    setIsListening(true);
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("🎤 Voice recognition ended");

    isListeningRef.current = false;
    setIsListening(false);

    if (shouldListen.current) {
      scheduleRestart();
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("🎤 Voice recognition error:", event);

    isListeningRef.current = false;
    setIsListening(false);

    if (shouldListen.current) {
      scheduleRestart();
    }
  });

  const startListening = useCallback(async () => {
    if (shouldListen.current) {
      return;
    }

    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        console.warn("🎤 Microphone permission denied");
        return;
      }

      shouldListen.current = true;

      clearRestartTimer();

      await startRecognition();
    } catch (error) {
      console.error(
        "🎤 Failed to start voice recognition:",
        error
      );
    }
  }, [clearRestartTimer, startRecognition]);

  const stopListening = useCallback(async () => {
    shouldListen.current = false;

    clearRestartTimer();

    if (isStopping.current) {
      return;
    }

    try {
      isStopping.current = true;

      console.log("🎤 Stopping voice recognition");

      ExpoSpeechRecognitionModule.stop();

      isListeningRef.current = false;
      setIsListening(false);
    } catch (error) {
      console.log("🎤 Stop error:", error);
    } finally {
      isStopping.current = false;
      isStarting.current = false;
    }
  }, [clearRestartTimer]);

  useEffect(() => {
    return () => {
      shouldListen.current = false;

      clearRestartTimer();

      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (error) {
        console.log("🎤 Cleanup stop error:", error);
      }
    };
  }, [clearRestartTimer]);

  return {
    isListening,
    startListening,
    stopListening,
  };
}

