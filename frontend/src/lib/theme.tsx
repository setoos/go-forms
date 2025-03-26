import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from "./supabase.ts";
import { showToast } from "./toast.ts";

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  branding?: {
    logo?: string;
    logoHeight?: number;
    favicon?: string;
  };
}

export const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#6b21a8', 
    secondary: '#9333ea',
    accent: '#e9d5ff',
    background: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  branding: {
    logoHeight: 40,
  },
};

export const darkTheme: ThemeConfig = {
  colors: {
    primary: '#9333ea',
    secondary: '#c084fc',
    accent: '#2d1a45',
    background: '#1f2937',
    text: '#f9fafb',
    border: '#374151',
  },
  fonts: defaultTheme.fonts,
  branding: defaultTheme.branding,
};

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (newTheme: Partial<ThemeConfig>) => Promise<void>;
  resetTheme: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  updateTheme: async () => {},
  resetTheme: () => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
  setTheme: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

function applyTheme(theme: ThemeConfig, isDarkMode: boolean) {
  const root = document.documentElement;
  const baseTheme = isDarkMode ? darkTheme : defaultTheme;
  const mergedTheme = {
    ...baseTheme,
    ...theme,
    colors: { ...baseTheme.colors, ...theme.colors },
    fonts: { ...baseTheme.fonts, ...theme.fonts },
    branding: { ...baseTheme.branding, ...theme.branding },
  };
  
  // Apply colors with contrast checking
  Object.entries(mergedTheme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
    
    // Add contrast colors for text
    if (key === 'primary' || key === 'secondary') {
      root.style.setProperty(
        `--color-${key}-contrast`,
        isLightColor(value) ? '#1f2937' : '#ffffff'
      );
    }
  });
  
  Object.entries(mergedTheme.fonts).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });

  root.classList.toggle('dark', isDarkMode);
}

// Helper function to determine if a color is light
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 155;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const updateTheme = async (newTheme: Partial<ThemeConfig>) => {
    try {
      const updatedTheme = {
        ...theme,
        ...newTheme,
        colors: { ...theme.colors, ...(newTheme.colors || {}) },
        fonts: { ...theme.fonts, ...(newTheme.fonts || {}) },
        branding: { ...theme.branding, ...(newTheme.branding || {}) },
      };

      setTheme(updatedTheme);
      applyTheme(updatedTheme, isDarkMode);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: {
            theme: updatedTheme,
            isDarkMode,
          },
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      showToast('Theme updated successfully', 'success');
    } catch (error) {
      console.error('Error updating theme:', error);
      showToast('Failed to update theme', 'error');
    }
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    setIsDarkMode(false);
    applyTheme(defaultTheme, false);
  };

  const toggleDarkMode = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    applyTheme(theme, newIsDark);
  };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          applyTheme(defaultTheme, false);
          return;
        }

        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', user.id)
          .single();

        if (preferences?.preferences?.theme) {
          setTheme(preferences.preferences.theme);
          setIsDarkMode(preferences.preferences.isDarkMode || false);
          applyTheme(preferences.preferences.theme, preferences.preferences.isDarkMode || false);
        } else {
          applyTheme(defaultTheme, false);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        applyTheme(defaultTheme, false);
      }
    };

    loadTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      updateTheme,
      resetTheme,
      isDarkMode,
      toggleDarkMode,
      setTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}