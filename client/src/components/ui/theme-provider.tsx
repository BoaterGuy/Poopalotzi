import React from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => {},
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children,
  defaultTheme = "light", 
  storageKey = "poopalotzi-ui-theme",
  ...props
}) => {
  // Use a simple state without any effects that might cause problems
  const [theme, setTheme] = React.useState<Theme>("light");
  
  // Create the context value explicitly
  const value = React.useMemo(() => ({
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  }), [theme, storageKey]);

  // Return the provider with the memoized value
  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export const useTheme = (): ThemeProviderState => {
  const context = React.useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};