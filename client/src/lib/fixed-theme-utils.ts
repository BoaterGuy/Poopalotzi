// A simplified theme utility to avoid React hook errors
export type Theme = "dark" | "light" | "system";

export const getThemeFromStorage = (): Theme => {
  if (typeof window === "undefined") return "light";
  try {
    const storedValue = window.localStorage.getItem("poopalotzi-ui-theme") as Theme;
    return storedValue || "light";
  } catch (error) {
    return "light";
  }
};

export const saveThemeToStorage = (theme: Theme): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("poopalotzi-ui-theme", theme);
    applyTheme(theme);
  } catch (error) {
    console.error("Error saving theme:", error);
  }
};

export const applyTheme = (theme: Theme): void => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  
  // Always set to light mode for now until we fix dark mode
  root.classList.add("light");
  
  // Set the theme color meta tag
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", "#0B1F3A"); // Deep Navy color
  }
};