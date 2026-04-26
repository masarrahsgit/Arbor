import { useColorScheme } from "react-native";
import Colors from "./colors";

export type Theme = typeof Colors.light;

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? Colors.dark : Colors.light;
}

export { Colors };
