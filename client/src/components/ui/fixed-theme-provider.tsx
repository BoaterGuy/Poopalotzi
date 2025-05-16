import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme, getThemeFromStorage, saveThemeToStorage, applyTheme } from "@/lib/fixed-theme-utils";

// Define the context type
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Create the provider component
export function FixedThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  // Initialize state with the theme from storage or default
  const [theme, setTheme] = useState<Theme>(getThemeFromStorage() || defaultTheme);

  // Apply the theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Create the value object with memoization to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      theme,
      setTheme: (newTheme: Theme) => {
        setTheme(newTheme);
        saveThemeToStorage(newTheme);
      },
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Create the hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}