import Colors from "@/constants/colors";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: typeof Colors.light;
  isDark: boolean;
}

export const [ThemeProvider, useThemeContext] =
  createContextHook<ThemeContextValue>(() => {
    const systemColorScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeMode>("system");

    useEffect(() => {
      AsyncStorage.getItem("theme").then((stored) => {
        if (
          stored &&
          (stored === "light" || stored === "dark" || stored === "system")
        ) {
          setThemeState(stored);
        }
      });
    }, []);

    const setTheme = (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      AsyncStorage.setItem("theme", newTheme);
    };

    const isDark =
      theme === "system" ? systemColorScheme === "dark" : theme === "dark";

    const colors = isDark ? Colors.dark : Colors.light;

    return {
      theme,
      setTheme,
      colors,
      isDark,
    };
  });
