/** Bundled meditation covers (sync from assets/meditations/covers via scripts). */
import type { ImageSourcePropType } from "react-native";

const LOCAL: Record<string, ImageSourcePropType> = {
  shanti: require("../../assets/meditations/covers/shanti.jpg"),
  sun: require("../../assets/meditations/covers/sun.jpg"),
  "bamboo-flute": require("../../assets/meditations/covers/bamboo-flute.jpg"),
  aura: require("../../assets/meditations/covers/aura.jpg"),
  contentment: require("../../assets/meditations/covers/contentment.jpg"),
  happy: require("../../assets/meditations/covers/happy.jpg"),
  "laugh-sing-1": require("../../assets/meditations/covers/laugh-sing-1.jpg"),
  "laugh-sing-2": require("../../assets/meditations/covers/laugh-sing-2.jpg"),
  panchakosha: require("../../assets/meditations/covers/panchakosha.jpg"),
  space: require("../../assets/meditations/covers/space.jpg"),
  "transforming-emotions": require("../../assets/meditations/covers/transforming-emotions.jpg"),
  "tick-tick": require("../../assets/meditations/covers/tick-tick.jpg"),
  "ambient-track": require("../../assets/meditations/covers/ambient-track.jpg"),
  "yoga-nidra": require("../../assets/meditations/covers/yoga-nidra.jpg"),
};

const BY_MED_ID: Record<string, ImageSourcePropType> = {
  "med-anxious-shanti": LOCAL.shanti,
  "med-fearful-transforming-emotions": LOCAL["transforming-emotions"],
  "med-sad-contentment": LOCAL.contentment,
  "med-sad-laugh-sing-1": LOCAL["laugh-sing-1"],
  "med-lonely-aura": LOCAL.aura,
  "med-hopeful-sun": LOCAL.sun,
  "med-overwhelmed-panchakosha": LOCAL.panchakosha,
  "med-overwhelmed-tick-tick": LOCAL["tick-tick"],
  "med-peaceful-space": LOCAL.space,
  "med-peaceful-ambient-track": LOCAL["ambient-track"],
  "med-grateful-happy": LOCAL.happy,
  "med-grateful-laugh-sing-2": LOCAL["laugh-sing-2"],
  "med-cant_sleep-bamboo-flute": LOCAL["bamboo-flute"],
  "med-cant_sleep-yoga-nidra": LOCAL["yoga-nidra"],
};

export function meditationCoverSource(
  id: string,
  remoteUrl?: string | null,
  coverFile?: string | null
): ImageSourcePropType {
  // API cover_file is <track>.jpg
  const fromFile = coverFile?.replace(/\.jpe?g$/i, "") || "";
  if (fromFile && LOCAL[fromFile]) return LOCAL[fromFile];
  if (BY_MED_ID[id]) return BY_MED_ID[id];
  if (LOCAL[id]) return LOCAL[id];
  // med-anxious-shanti → track suffix
  const trackGuess = id.includes("-") ? id.split("-").slice(2).join("-") : "";
  if (trackGuess && LOCAL[trackGuess]) return LOCAL[trackGuess];
  if (remoteUrl && /^https?:\/\//i.test(remoteUrl)) {
    return { uri: remoteUrl };
  }
  return LOCAL.shanti;
}


