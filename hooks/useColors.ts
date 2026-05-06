import colors from "@/constants/colors";
import { useColorScheme } from "./use-color-scheme";

type BasePalette = typeof colors.light;

export type AppPalette = BasePalette & {
  mutedText: string;
};

export function useColors(): AppPalette {
  const scheme = useColorScheme();

  const palette: BasePalette =
    scheme === "dark" && (colors as any).dark
      ? (colors as any).dark
      : colors.light;

  return {
    ...palette,

    // Alias viejo usado en varios componentes.
    // Evita que React Native caiga al color default negro.
    mutedText: palette.mutedForeground,
  };
}