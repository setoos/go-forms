import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabase";
import { showToast } from "./toast";
import Cookies from "js-cookie";
import { Quiz } from "../types/quiz";
import { User } from "@supabase/supabase-js";

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
    logoText?: string;
    titleText?: string;
  };
}

export const defaultTheme: ThemeConfig = {
  colors: {
    primary: "#EB7E1A",
    secondary: "#EB7E1C",
    accent: "#e9d5ff",
    background: "#ffffff",
    text: "#1f2937",
    border: "#e5e7eb",
  },
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },
  branding: {
    logoHeight: 40,
  },
};

export const darkTheme: ThemeConfig = {
  colors: {
    primary: "#9333ea",
    secondary: "#c084fc",
    accent: "#2d1a45",
    background: "#1f2937",
    text: "#f9fafb",
    border: "#374151",
  },
  fonts: defaultTheme.fonts,
  branding: defaultTheme.branding,
};

interface QuizSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  created_at: string;
  quiz_id: string;
}

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (newTheme: Partial<ThemeConfig>) => Promise<void>;
  resetTheme: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  params: Record<string, string | undefined>;
  setParams: (params: Record<string, string | undefined>) => void;
  isSignOut: boolean;
  setIsSignOut: (isSignOut: boolean) => void;
  isResultSent: boolean;
  setIsResultSent: (isResultSent: boolean) => void;
  quizzes: Quiz[];
  setQuizzes: (quizzes: Quiz[]) => Promise<void>;
  loading: boolean;
  setLoading: (isLoading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  loadQuizzes: () => void;
  selectedQuiz: string;
  setSelectedQuiz: (quizId: string) => void;
  quizSubmissions: QuizSubmission[];
  setQuizSubmissions: (submissions: QuizSubmission[]) => void;
  answers: Record<string, string | number | boolean | null>;
  setAnswers: (
    answers: Record<string, string | number | boolean | null>
  ) => void;
  scores: Record<string, number>;
  setScores: (scores: Record<string, number>) => void;
  themeLoading: boolean;
  setThemeLoading: (loading: boolean) => void;
  points: number;
  setPoints: (points: number) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  updateTheme: async () => { },
  resetTheme: () => { },
  isDarkMode: false,
  toggleDarkMode: () => { },
  setTheme: () => { },
  params: {},
  setParams: () => { },
  isSignOut: false,
  setIsSignOut: () => { },
  isResultSent: false,
  setIsResultSent: () => { },
  quizzes: [],
  setQuizzes: async () => { },
  loading: false,
  setLoading: () => { },
  error: "",
  setError: () => { },
  loadQuizzes: () => { },
  selectedQuiz: "",
  setSelectedQuiz: () => { },
  quizSubmissions: [],
  setQuizSubmissions: () => { },
  answers: {},
  setAnswers: () => { },
  scores: {},
  setScores: () => { },
  themeLoading: false,
  setThemeLoading: () => { },
  points: 10,
  setPoints: () => { },
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function applyTheme(theme: ThemeConfig, isDarkMode: boolean) {
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
    if (key === "primary" || key === "secondary") {
      root.style.setProperty(
        `--color-${key}-contrast`,
        isLightColor(value) ? "#1f2937" : "#ffffff"
      );
    }
  });

  Object.entries(mergedTheme.fonts).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });

  root.classList.toggle("dark", isDarkMode);
}

// Helper function to determine if a color is light
function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const savedTheme = Cookies.get("theme")
    ? JSON.parse(Cookies.get("theme")!)
    : defaultTheme;

  const [theme, setTheme] = useState<ThemeConfig>(savedTheme);
  const [params, setParams] = useState<Record<string, string | undefined>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSignOut, setIsSignOut] = useState(false);
  const [isResultSent, setIsResultSent] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [themeLoading, setThemeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string | undefined>(
    undefined
  );
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, string | number | boolean | null>
  >({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [points, setPoints] = useState(10);


  const updateQuizzes = (newQuizzes: Quiz[]): Promise<void> => {
    setQuizzes(newQuizzes);
    return Promise.resolve();
  };

  useEffect(() => {
    setThemeLoading(true);
    setTheme(savedTheme);
    applyTheme(savedTheme, isDarkMode);
    async function fetchData() {
      const {
        data: { user: _user },
      } = await supabase.auth.getUser();

      if (!_user) {
        setTheme(defaultTheme);
        applyTheme(defaultTheme, isDarkMode);
      }
    }
    fetchData();
    setThemeLoading(false);
  }, []);

  const updateTheme = async (newTheme: Partial<ThemeConfig>) => {
    try {
      const updatedTheme = {
        ...theme,
        ...newTheme,
        colors: { ...theme?.colors, ...(newTheme.colors || {}) },
        fonts: { ...theme?.fonts, ...(newTheme.fonts || {}) },
        branding: { ...theme?.branding, ...(newTheme.branding || {}) },
      };

      setTheme(updatedTheme);
      applyTheme(updatedTheme, isDarkMode);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          preferences: {
            theme: updatedTheme,
            isDarkMode,
          },
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) throw error;
      showToast("Theme updated successfully", "success");
    } catch (error) {
      console.error("Error updating theme:", error);
      showToast("Failed to update theme", "error");
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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (params?.shareId) {
            applyTheme(defaultTheme, false);

            const { data: quizData, error: quizError } = await supabase
              .from("quizzes")
              .select("created_by")
              .eq("share_id", params?.shareId)
              .single();

            if (quizError) {
              console.error("Error fetching quiz data:", quizError.message);
              return;
            }

            const userId = quizData.created_by;

            const { data: preferences } = await supabase
              .from("user_preferences")
              .select("preferences")
              .eq("user_id", userId)
              .single();

            if (preferences?.preferences?.theme) {
              setTheme(preferences.preferences.theme);
              setIsDarkMode(preferences.preferences.isDarkMode || false);
              applyTheme(
                preferences.preferences.theme,
                preferences.preferences.isDarkMode || false
              );
            } else {
              applyTheme(defaultTheme, false);
            }
          } else {
            applyTheme(defaultTheme, false);
          }
          return;
        }

        const { data: preferences } = await supabase
          .from("user_preferences")
          .select("preferences")
          .eq("user_id", user.id)
          .single();

        if (preferences?.preferences?.theme) {
          setLoading(false);
          setTheme(preferences.preferences.theme);
          setIsDarkMode(preferences.preferences.isDarkMode || false);
          applyTheme(
            preferences.preferences.theme,
            preferences.preferences.isDarkMode || false
          );
        } else {
          applyTheme(defaultTheme, false);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
        applyTheme(defaultTheme, false);
      } finally {
        setThemeLoading(false);
        setLoading(false);
      }
    };

    loadTheme();
  }, [params]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setThemeLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      setThemeLoading(false);
    };

    fetchUser();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);

  async function loadQuizzes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    try {
      setLoading(true);
      setError(null);

      // Ensure user is authenticated
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error: fetchError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("created_by", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching quizzes:", fetchError);
        throw new Error("Failed to load quizzes. Please try again.");
      }

      setQuizzes(data || []);
    } catch (error) {
      console.error("Error loading quizzes:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load quizzes"
      );
      showToast("Failed to load quizzes", "error");
    } finally {
      setLoading(false);
    }
  }

  async function quizResponses() {
    try {
      setLoading(true);

      if (!user) {
        throw new Error("User not authenticated");
      }

      if (!selectedQuiz) {
        throw new Error("No quiz selected");
      }

      const { data, error } = await supabase
        .from("quiz_responses")
        .select("*")
        .eq("quiz_id", selectedQuiz)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quiz responses:", error);
        throw new Error("Failed to load quiz responses. Please try again.");
      }

      setQuizSubmissions(data || []);
    } catch (error) {
      console.error("Error loading quizzes:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load quizzes"
      );
      showToast("Failed to load quizzes", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && selectedQuiz) {
      quizResponses();
    }
  }, [user, selectedQuiz]);

  return (
    <ThemeContext.Provider
      value={{
        theme: theme || defaultTheme,
        updateTheme,
        resetTheme,
        isDarkMode,
        toggleDarkMode,
        setTheme,
        setParams,
        params,
        isSignOut,
        setIsSignOut,
        isResultSent,
        setIsResultSent,
        quizzes,
        setQuizzes: updateQuizzes,
        loading,
        setLoading,
        error: error || "",
        setError,
        loadQuizzes,
        selectedQuiz: selectedQuiz || "",
        setSelectedQuiz,
        quizSubmissions,
        setQuizSubmissions,
        answers,
        setAnswers,
        scores,
        setScores,
        themeLoading,
        setThemeLoading,
        points, setPoints
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
