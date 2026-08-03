/**
 * Legacy route — redirects to unified auth (Create account tab).
 * Keeps old links and bookmarks working.
 */
import { Redirect } from "expo-router";

export default function SignUpRedirect() {
  return <Redirect href={{ pathname: "/(auth)/sign-in", params: { mode: "signup" } }} />;
}
