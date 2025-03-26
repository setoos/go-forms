import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./lib/theme.tsx";
import { AuthProvider, useAuth } from "./lib/auth.tsx";
import Navigation from "./components/Navigation.tsx";
import Welcome from "./components/Welcome.tsx";
import Quiz from "./components/Quiz.tsx";
import QuizView from "./components/QuizView.tsx";
import Results from "./components/Results.tsx";
import AuthForm from "./components/auth/AuthForm.tsx";
import QuizList from "./components/admin/QuizList.tsx";
import QuizEditor from "./components/admin/QuizEditor.tsx";
import QuizAnalytics from "./components/admin/QuizAnalytics.tsx";
import AnalyticsDashboard from "./components/admin/AnalyticsDashboard.tsx";
import UserSettings from "./components/settings/UserSettings.tsx";
import "./styles/theme.css";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background text-text">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/quiz/:id" element={<Quiz />} />
          <Route path="/quiz/view/:id" element={<QuizView />} />
          <Route path="/results" element={<Results />} />

          {/* Settings Routes */}
          <Route
            path="/settings/*"
            element={
              <PrivateRoute>
                <UserSettings />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Navigate to="/admin/quizzes" replace />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/quizzes"
            element={
              <PrivateRoute>
                <QuizList />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/quizzes/new"
            element={
              <PrivateRoute>
                <QuizEditor />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/quizzes/:id"
            element={
              <PrivateRoute>
                <QuizEditor />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/quizzes/:id/analytics"
            element={
              <PrivateRoute>
                <QuizAnalytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <PrivateRoute>
                <AnalyticsDashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
