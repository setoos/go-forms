import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { Brain } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { applyTheme, defaultTheme, useTheme } from "../../lib/theme";
import Cookies from "js-cookie";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { setTheme, setIsSignOut } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setIsSignOut(false);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError("Check your email for the confirmation link.");
      } else {
        const userData = await signIn(email, password);

        if (!userData?.user) {
          setError("Failed to sign in. Please check your credentials.");
          return;
        }

        // Fetch preferences after successful login
        const { data: preferences, error } = await supabase
          .from("user_preferences")
          .select("preferences")
          .eq("user_id", userData?.user.id)
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (preferences?.preferences?.theme) {
          Cookies.set("theme", JSON.stringify(preferences.preferences.theme));
          setTheme(preferences.preferences.theme);
          applyTheme(
            preferences.preferences.theme,
            preferences.preferences.isDarkMode || false
          );
        } else {
          applyTheme(defaultTheme, false);
        }

        // Navigate only after all logic is done
        navigate("/admin/quizzes");
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("invalid_credentials")) {
          setError("Invalid email or password");
        } else if (err.message.includes("email_taken")) {
          setError("This email is already registered");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/"
            className="flex items-center justify-center text-secondary hover:text-primary"
          >
            <Brain className="h-12 w-12" />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp
              ? "Start creating engaging quizzes today"
              : "Welcome back! Please sign in to continue"}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-text rounded-t-md focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-text rounded-b-md focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm"
                placeholder="Password"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? "btn-primary cursor-not-allowed"
                  : "btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2"
              }`}
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <div className="h-5 w-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                </span>
              ) : null}
              {isSignUp ? "Sign up" : "Sign in"}
            </button>
          </div>

          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-medium text-secondary hover:text-secondary"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
