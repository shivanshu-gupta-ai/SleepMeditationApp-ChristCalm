import React, { useEffect, useRef, useState } from "react";
import { Text, type TextStyle, type StyleProp } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ScarcityTimerProps = {
  initialSeconds: number;
  storageKey: string;
  onExpire?: () => void;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/**
 * Persisted countdown (AsyncStorage expiry timestamp).
 * Survives backgrounding; does not reset while the key remains.
 */
export function ScarcityTimer({
  initialSeconds,
  storageKey,
  onExpire,
  style,
  testID = "scarcity-timer",
}: ScarcityTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [ready, setReady] = useState(false);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    let cancelled = false;
    expiredRef.current = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const remaining = Math.max(
            0,
            Math.floor((Number(stored) - Date.now()) / 1000)
          );
          if (!cancelled) setSecondsLeft(remaining);
        } else {
          const expiry = Date.now() + initialSeconds * 1000;
          await AsyncStorage.setItem(storageKey, String(expiry));
          if (!cancelled) setSecondsLeft(initialSeconds);
        }
      } catch {
        if (!cancelled) setSecondsLeft(initialSeconds);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSeconds, storageKey]);

  useEffect(() => {
    if (!ready) return;
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [ready, secondsLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <Text
      style={[{ fontVariant: ["tabular-nums"] }, style]}
      testID={testID}
      accessibilityRole="timer"
      accessibilityLabel={`${minutes} minutes ${seconds} seconds remaining`}
    >
      {label}
    </Text>
  );
}

export default ScarcityTimer;
