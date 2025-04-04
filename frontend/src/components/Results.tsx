import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, Link, useParams } from "react-router-dom";
import {
  Brain,
  Download,
  ArrowRight,
  Send,
  FileSpreadsheet,
  Mail,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { calculateScore, getScoreResponse } from "../lib/utils.ts";
import { generatePDF } from "../lib/pdf.ts";
import { sendResultsEmail } from "../lib/email.ts";
import { supabase } from "../lib/supabase.ts";
import { showToast } from "../lib/toast.ts";
import { useTheme } from "../lib/theme.tsx";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { setIsResultSent, isResultSent } = useTheme();

  const answers = useMemo(
    () => location.state?.answers || {},
    [location.state]
  );
  const score = location.state?.score || calculateScore(answers);
  const quizId = location.state?.quizId;
  const completionTime = location.state?.completionTime;
  const isSampleQuiz = location.state?.isSampleQuiz || false;
  const showUserInfoForm = isResultSent || false;
  const { message, recommendation } = getScoreResponse(score);
  const { setParams } = useTheme();
  const { id } = useParams();

  console.log("showUserInfoForm", location.state.answers);

  useEffect(() => {
    setParams({ shareId: id });
  }, [id]);

  const handleSendEmail = useCallback(
    async (response?: ResponseType) => {
      if (sendingEmail) return;
      setSendingEmail(true);

      try {
        const success = await sendResultsEmail(
          response || {
            id: crypto.randomUUID(),
            quiz_id: quizId,
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            answers,
            score,
            completion_time: completionTime,
            timestamp: new Date().toISOString(),
          }
        );

        if (success) {
          setEmailSent(true);
        } else {
          throw new Error("Failed to send email");
        }
      } catch (error) {
        console.error("Error sending email:", error);
        showToast("Failed to send email", "error");
      } finally {
        setSendingEmail(false);
      }
    },
    [sendingEmail, quizId, userInfo, answers, score, completionTime]
  );

  useEffect(() => {
    // Auto-send email if we have user info
    if (!showUserInfoForm && userInfo.email && !emailSent) {
      handleSendEmail();
    }
  }, [userInfo.email, showUserInfoForm, emailSent, handleSendEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!isSampleQuiz && quizId) {
        const { error } = await supabase.from("quiz_responses").insert({
          quiz_id: quizId,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          answers,
          score,
          completion_time: completionTime,
        });

        if (error) throw error;
      }

      const response = {
        id: crypto.randomUUID(),
        quiz_id: quizId,
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        answers,
        score,
        completion_time: completionTime,
        timestamp: new Date().toISOString(),
      };

      // Send email with results
      await handleSendEmail(response);
      setIsResultSent(false);

      showToast("Results saved successfully!", "success");
    } catch (error) {
      console.error("Error saving results:", error);
      showToast("Failed to save results", "error");
    } finally {
      setSaving(false);
    }
  };

  interface ResponseType {
    id: string;
    quiz_id: string;
    name: string;
    email: string;
    phone: string;
    answers: Record<string, number>;
    score: number;
    completion_time: number;
    timestamp: string;
  }

  const handleDownload = async (format: "pdf" | "csv") => {
    try {
      if (format === "pdf") {
        await generatePDF({
          id: crypto.randomUUID(),
          quiz_id: quizId,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          answers,
          score,
          completion_time: completionTime,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Generate CSV
        const csvContent = [
          ["Question", "Score"],
          ...Object.entries(answers).map(([q, s]) => [q, s]),
        ]
          .map((row) => row.join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quiz-results-${new Date().toISOString()}.csv`;
        a.click();
        globalThis.URL.revokeObjectURL(url);
      }
      showToast(`Results downloaded successfully!`, "success");
    } catch (error) {
      console.error("Error downloading results:", error);
      showToast("Failed to download results", "error");
    }
  };

  if (showUserInfoForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent via-white to-accent py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-background rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <Brain className="h-16 w-16 text-secondary" />
            </div>

            <h1 className="text-3xl font-bold text-center text-text mb-2">
              Quiz Complete!
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Please provide your details to view your results and get your
              personalized report.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={userInfo.name}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent0 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={userInfo.email}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent0 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={userInfo.phone}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent0 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full flex items-center justify-center px-6 py-3 rounded-lg ${
                  saving
                    ? "bg-secondary cursor-not-allowed"
                    : "bg-secondary hover:bg-primary"
                } text-white transition-colors`}
              >
                <Send className="w-5 h-5 mr-2" />
                {saving ? "Saving..." : "View Results"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent via-white to-accent py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-gray-600 hover:text-text transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>
          <div className="bg-background rounded-lg shadow-xl p-8 mb-8">
            <div className="flex items-center justify-center mb-8">
              <Brain className="h-16 w-16 text-secondary" />
            </div>

            <h1 className="text-3xl font-bold text-center text-text mb-4">
              Your Marketing Awareness Score
            </h1>

            <div className="flex justify-center mb-8">
              <div className="text-6xl font-bold text-secondary">
                {score}
                <span className="text-2xl text-gray-500">/100</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-xl font-semibold text-text mb-2">{message}</p>
              <p className="text-gray-600">{recommendation}</p>
              {completionTime && (
                <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Completed in: {Math.floor(completionTime / 60)}m{" "}
                  {completionTime % 60}s
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleDownload("pdf")}
                  className="flex items-center justify-center px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </button>

                <button
                  onClick={() => handleDownload("csv")}
                  className="flex items-center justify-center px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  Download CSV
                </button>
              </div>

              {!emailSent && (
                <button
                  onClick={() => handleSendEmail()}
                  disabled={sendingEmail}
                  className={`flex items-center justify-center px-6 py-3 border-2 border-secondary rounded-lg transition-colors ${
                    sendingEmail
                      ? "text-gray-400 border-gray-400 cursor-not-allowed"
                      : "text-secondary hover:bg-accent"
                  }`}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  {sendingEmail ? "Sending..." : "Send Results to Email"}
                </button>
              )}

              {isSampleQuiz ? (
                <button
                  onClick={() => navigate("/auth")}
                  className="flex items-center justify-center px-6 py-3 border-2 border-secondary text-secondary rounded-lg hover:bg-accent transition-colors"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Sign Up to Create Your Own Quiz
                </button>
              ) : (
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center justify-center px-6 py-3 border-2 border-secondary text-secondary rounded-lg hover:bg-accent transition-colors"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Take Another Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Results;
