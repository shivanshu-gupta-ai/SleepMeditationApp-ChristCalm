/**
 * Bundled meditation covers — edit files under:
 *   assets/meditations/covers/  (canonical)
 * then: cp assets/meditations/covers/*.jpg frontend/assets/meditations/covers/
 */
import type { ImageSourcePropType } from "react-native";

const LOCAL: Record<string, ImageSourcePropType> = {
  "med-1": require("../../assets/meditations/covers/med-1.jpg"),
  "med-2": require("../../assets/meditations/covers/med-2.jpg"),
  "med-3": require("../../assets/meditations/covers/med-3.jpg"),
  "med-4": require("../../assets/meditations/covers/med-4.jpg"),
  "med-5": require("../../assets/meditations/covers/med-5.jpg"),
  "med-6": require("../../assets/meditations/covers/med-6.jpg"),
  "med-7": require("../../assets/meditations/covers/med-7.jpg"),
  "med-8": require("../../assets/meditations/covers/med-8.jpg"),
  "med-9": require("../../assets/meditations/covers/med-9.jpg"),
  "med-10": require("../../assets/meditations/covers/med-10.jpg"),
};

/** Prefer bundled asset; fall back to remote cover URL from API. */
export function meditationCoverSource(
  id: string,
  remoteUrl?: string | null
): ImageSourcePropType {
  if (LOCAL[id]) return LOCAL[id];
  if (remoteUrl && /^https?:\/\//i.test(remoteUrl)) {
    return { uri: remoteUrl };
  }
  // last resort: first bundled cover
  return LOCAL["med-1"];
}

export function hasLocalCover(id: string): boolean {
  return Boolean(LOCAL[id]);
}
