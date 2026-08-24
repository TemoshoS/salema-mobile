import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { Vibration } from "react-native";

type ShakeOptions = {
  threshold?: number;
  requiredShakes?: number;
  shakeWindow?: number;
  cooldown?: number;
  updateInterval?: number;
  vibrationPattern?: number[];
};

export default function useShake(
  onShake: () => void,
  {
    threshold = 2.2,
    requiredShakes = 2,
    shakeWindow = 1200,
    cooldown = 5000,
    updateInterval = 50,
    vibrationPattern = [0, 300],
  }: ShakeOptions = {}
) {
  const lastMagnitude = useRef(0);
  const shakeCount = useRef(0);
  const firstShakeTime = useRef(0);
  const lastTriggerTime = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(updateInterval);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // Change in acceleration
      const delta = Math.abs(magnitude - lastMagnitude.current);
      lastMagnitude.current = magnitude;

      const now = Date.now();

      // Prevent repeated triggers
      if (now - lastTriggerTime.current < cooldown) {
        return;
      }

      if (delta > threshold) {
        if (shakeCount.current === 0) {
          firstShakeTime.current = now;
        }

        if (now - firstShakeTime.current > shakeWindow) {
          // Too slow, restart counting
          shakeCount.current = 1;
          firstShakeTime.current = now;
        } else {
          shakeCount.current++;
        }

        if (shakeCount.current >= requiredShakes) {
          shakeCount.current = 0;
          lastTriggerTime.current = now;

          // Vibrate immediately
          Vibration.vibrate(vibrationPattern);

          // Execute callback
          onShake();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [
    threshold,
    requiredShakes,
    shakeWindow,
    cooldown,
    updateInterval,
    vibrationPattern,
    onShake,
  ]);
}