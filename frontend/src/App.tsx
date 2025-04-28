import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './lib/theme';
import { AuthProvider, useAuth } from './lib/auth';
import Welcome from './components/Welcome';
import Quiz from './components/Quiz';
import QuizView from './components/QuizView';
import Results from './components/Results';
import ResultsSuccess from './components/ResultsSuccess';
import AuthForm from './components/auth/AuthForm';
import QuizList from './components/admin/QuizList';
import QuizEditor from './components/admin/QuizEditor';
import QuizAnalytics from './components/admin/QuizAnalytics';
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';
import UserSettings from './components/settings/UserSettings';
import ReportTemplatesPage from './components/admin/ReportTemplatesPage';
import TemplateList from './components/admin/TemplateList';
import TemplateEditor from './components/admin/TemplateEditor';
import TemplatePreview from './components/TemplatePreview';
import InstaFormsLibrary from './components/forms/InstaFormsLibrary';
import InstaFormsHome from './components/forms/InstaFormsHome';
import FormCategoryPage from './components/forms/FormCategoryPage';
import FormTemplateDetails from './components/forms/FormTemplateDetails';
import DashboardLayout from './components/DashboardLayout';
import Breadcrumbs from './components/Breadcrumbs';
import QuizTemplateLibrary from './components/templates/QuizTemplateLibrary';
import QuizTemplateCustomizer from './components/templates/QuizTemplateCustomizer';
import QuizTemplateCategoryPage from './components/templates/QuizTemplateCategoryPage';
import QuizTemplateFeatures from './components/templates/QuizTemplateFeatures';
import QuizTemplateHome from './components/templates/QuizTemplateHome';
import BillingReport from './components/admin/BillingReport';
import QuizSubmissions from './components/admin/QuizSubmissions';
import SubmissionDetail from './components/admin/SubmissionDetail';
import 'react-quill/dist/quill.snow.css';
import { Loader } from 'lucide-react';
import TemplateForm from './components/admin/TemplateForm';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function App() {
  const { themeLoading, loading } = useTheme();


  if (themeLoading && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Welcome />} />
              <Route path="auth" element={<AuthForm />} />
              <Route path="quiz/:id" element={<Quiz />} />
              <Route path="quiz/view/:id" element={<QuizView />} />
              <Route path="results" element={<Results />} />
              <Route path="results/success" element={<ResultsSuccess />} />

              {/* Templates Routes */}
              <Route path="templates" element={<QuizTemplateHome />} />
              <Route path="create-template/:id" element={<TemplateForm />} />
              <Route path="templates/library" element={<QuizTemplateLibrary />} />
              <Route path="templates/category/:categoryId" element={<QuizTemplateCategoryPage />} />
              <Route path="templates/features" element={<QuizTemplateFeatures />} />
              <Route path="templates/customize" element={
                <PrivateRoute>
                  <QuizTemplateCustomizer />
                </PrivateRoute>
              } />

              {/* Forms Routes */}
              <Route path="forms" element={<InstaFormsHome />} />
              <Route path="forms/templates" element={<InstaFormsLibrary />} />
              <Route path="forms/categories/:categoryId" element={<FormCategoryPage />} />
              <Route path="forms/templates/:id" element={<FormTemplateDetails />} />

              {/* Settings Routes */}
              <Route
                path="settings/*"
                element={
                  <PrivateRoute>
                    <UserSettings />
                  </PrivateRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="admin"
                element={
                  <PrivateRoute>
                    <Navigate to="/admin/quizzes" replace />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/quizzes"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <QuizList />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/quizzes/new"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <QuizEditor initialQuiz={null} initialQuestions={null} />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/quizzes/:id"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <QuizEditor initialQuiz={null} initialQuestions={null} />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/quizzes/:id/analytics"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <QuizAnalytics />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/analytics"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <AnalyticsDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/billing-report"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <BillingReport />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/templates"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <TemplateList />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/templates/new"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <TemplateEditor />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/templates/:id"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <TemplateEditor />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/templates/preview/:id"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <TemplatePreview />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/reports"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <ReportTemplatesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/submissions"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <QuizSubmissions />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin/submissions/:id"
                element={
                  <PrivateRoute>
                    <Breadcrumbs />
                    <SubmissionDetail />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;