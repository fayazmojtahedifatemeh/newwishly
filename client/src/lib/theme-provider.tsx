import { createContext, useContext, useEffect, useState } from "react";

type Theme = "lavender-light" | "mint-light" | "peach-light" | "midnight-dark" | "forest-dark" | "plum-dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "lavender-light",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("wishly-theme");
    return (stored as Theme) || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.removeAttribute("data-theme");
    root.classList.remove("dark");
    
    // Apply new theme
    root.setAttribute("data-theme", theme);
    
    // Add dark class for dark themes
    if (theme.includes("dark")) {
      root.classList.add("dark");
    }
    
    localStorage.setItem("wishly-theme", theme);
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
