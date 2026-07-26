/** Helpers for expo-audio recording → Transcribe upload. */

export function mediaMetaFromUri(uri: string): {
  ext: string;
  contentType: string;
  format: string;
} {
  const lower = (uri || "").toLowerCase();
  if (lower.includes(".webm") || lower.startsWith("blob:")) {
    return { ext: "webm", contentType: "audio/webm", format: "webm" };
  }
  if (lower.includes(".wav")) {
    return { ext: "wav", contentType: "audio/wav", format: "wav" };
  }
  if (lower.includes(".mp3")) {
    return { ext: "mp3", contentType: "audio/mpeg", format: "mp3" };
  }
  return { ext: "m4a", contentType: "audio/mp4", format: "mp4" };
}
