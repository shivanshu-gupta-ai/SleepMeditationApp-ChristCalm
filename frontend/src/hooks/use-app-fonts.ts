import { useFonts } from "expo-font";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";

/**
 * Loads brand typefaces + vector icon fonts.
 * Returns [ready, error] — gate splash until ready.
 */
export function useAppFonts(): readonly [boolean, Error | null] {
  const [brandLoaded, brandError] = useFonts({
    Outfit: Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
    Figtree: Figtree_400Regular,
    "Figtree-Medium": Figtree_500Medium,
    "Figtree-SemiBold": Figtree_600SemiBold,
    "Figtree-Bold": Figtree_700Bold,
    CormorantGaramond: CormorantGaramond_400Regular,
    "CormorantGaramond-Italic": CormorantGaramond_400Regular_Italic,
    "CormorantGaramond-MediumItalic": CormorantGaramond_500Medium_Italic,
    "CormorantGaramond-SemiBold": CormorantGaramond_600SemiBold,
  });

  const [iconsLoaded, iconsError] = useIconFonts();

  const ready = brandLoaded && iconsLoaded;
  const error = brandError || iconsError || null;

  return [ready, error] as const;
}
