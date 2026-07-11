import { Redirect } from "expo-router";

/** Legacy route — wisdom chat replaces AI prayer. */
export default function AIPrayerRedirect() {
  return <Redirect href="/(tabs)/wisdom" />;
}
