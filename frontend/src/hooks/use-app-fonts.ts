import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";

/**
 * Loads Nest-style brand type + icon fonts.
 * Single family (Inter) — matches Nest’s SF Pro–like restraint.
 */
export function useAppFonts(): readonly [boolean, Error | null] {
  const [brandLoaded, brandError] = useFonts({
    Inter: Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
  });

  const [iconsLoaded, iconsError] = useIconFonts();

  const ready = brandLoaded && iconsLoaded;
  const error = brandError || iconsError || null;

  return [ready, error] as const;
}
