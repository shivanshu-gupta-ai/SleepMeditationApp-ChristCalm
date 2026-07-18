/**
 * Active meditation audio session.
 * Ensures playback stops when leaving the player, logging out, or ending the session.
 * expo-audio can keep playing on web if we only navigate away without pause/remove.
 */
import type { AudioPlayer } from "expo-audio";

let activePlayer: AudioPlayer | null = null;

export function setActiveMeditationPlayer(player: AudioPlayer | null): void {
  if (activePlayer && activePlayer !== player) {
    stopActiveMeditationPlayer();
  }
  activePlayer = player;
}

/** Pause + release the active player. Safe to call anytime. */
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
    // clear lock-screen / now-playing if used
    (p as { clearLockScreenControls?: () => void }).clearLockScreenControls?.();
  } catch {
    // ignore
  }
  try {
    p.remove();
  } catch {
    // ignore — hook may also release on unmount
  }
}

export function hasActiveMeditationPlayer(): boolean {
  return activePlayer != null;
}
