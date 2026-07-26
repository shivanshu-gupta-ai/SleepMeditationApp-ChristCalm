/** Track active meditation player so we can stop on navigate/logout. */
import type { AudioPlayer } from "expo-audio";

let activePlayer: AudioPlayer | null = null;

export function setActiveMeditationPlayer(player: AudioPlayer | null): void {
  if (activePlayer && activePlayer !== player) {
    stopActiveMeditationPlayer();
  }
  activePlayer = player;
}

export function stopActiveMeditationPlayer(): void {
  const p = activePlayer;
  activePlayer = null;
  if (!p) return;
  try {
    p.pause();
  } catch {
    // ignore
  }
  try {
    (p as { clearLockScreenControls?: () => void }).clearLockScreenControls?.();
  } catch {
    // ignore
  }
  try {
    p.remove();
  } catch {
    // ignore
  }
}
