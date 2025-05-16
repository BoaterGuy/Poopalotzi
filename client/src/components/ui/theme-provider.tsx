// Simple light-only theme provider as a replacement
import React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children 
}) => {
  return <>{children}</>;
};

// Simple hook that does nothing but maintains API compatibility
export const useTheme = () => {
  return {
    theme: "light",
    setTheme: () => {},
  };
};