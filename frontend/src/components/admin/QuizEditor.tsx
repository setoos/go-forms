import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Copy,
  AlertTriangle,
  Loader,
  CheckCircle,
  X,
  Share2,
} from "lucide-react";
import "../../quill/ImageResizeBlot";
import { useAuth } from "../../lib/auth";
import { showToast } from "../../lib/toast";
import {
  saveQuiz,
  validateQuiz,
  getQuiz,
  getQuizTemplate,
} from "../../lib/quiz";
import type { Quiz, Question } from "../../types/quiz";
import { useTheme } from "../../lib/theme";
import { usePrompt } from "../../lib/usePrompt";
import { useUnsavedChangesWarning } from "../../lib/useUnsavedChangesWarning";
import QuestionsStep from "../goFormSteps/QuestionsStep";
import DetailsStep from "../goFormSteps/DetailsStep";
import PublishStep from "../goFormSteps/PublishStep";
import ConfigureStep from "../goFormSteps/ConfigureStep";

// Question type options
const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "short_answer", label: "Short Answer" },
  { value: "matching", label: "Matching" },
  { value: "ordering", label: "Ordering" },
  { value: "essay", label: "Essay" },
  { value: "picture_based", label: "Picture-Based" },
  { value: "complete_statement", label: "Complete Statement" },
  { value: "definition", label: "Definition" },
];

type StepKey = "configure" | "details" | "questions" | "publish";

interface Step {
  key: StepKey;
  label: string;
  description: string;
}

const steps: Step[] = [
  {
    key: "configure",
    label: "Configure",
    description: "Configure GoForm settings",
  },
  {
    key: "details",
    label: "Details",
    description: "Details of your GoForm",
  },
  {
    key: "questions",
    label: "Questions",
    description: "Add and edit questions",
  },
  {
    key: "publish",
    label: "Publish",
    description: "Publish your GoForm",
  },
];

export default function QuizEditor({
  initialQuiz,
  initialQuestions,
}: {
  initialQuiz: Quiz;
  initialQuestions: Question[];
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!initialQuiz);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const { setQuizType } = useTheme();

  // Get template ID from URL query params
  const queryParams = new URLSearchParams(location.search);
  const templateId = queryParams.get("template");
  const editMode = queryParams.get("edit");

  const [activeStep, setActiveStep] = useState<
    "configure" | "questions" | "details" | "publish"
  >(id ? "details" : templateId ? "questions" : "configure");

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz>(
    initialQuiz || {
      id: "",
      title: "",
      description: "",
      category: "",
      time_limit: null,
      passing_score: null,
      status: "draft",
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user?.id || "",
      version: 1,
      approval_status: "pending",
      share_id: null,
      quiz_score: null,
      quiz_type: null,
      quiz_question_type: null,
      question_count: null,
    }
  );

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions || []
  );
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [retryCallback, setRetryCallback] = useState<null | (() => void)>(null);

  if (
    location.pathname.includes("new") ||
    location.pathname.includes("?template") ||
    !!id
  ) {
    useUnsavedChangesWarning(isDirty);

    usePrompt(
      isDirty,
      (retry) => {
        setRetryCallback(() => retry);
        setShowModal(true);
      },
      ["/templates/library"]
    );
  }

  // Load quiz data
  useEffect(() => {
    if (!user) {
      setError("You must be logged in to create or edit GoForms");
      setLoading(false);
      return;
    }

    if (initialQuiz && initialQuestions) {
      // If props are provided, use them
      setQuiz(initialQuiz);
      setQuestions(initialQuestions);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        if (templateId) {
          // Load from template
          const templateData = await getQuizTemplate(templateId);
          setIsDirty(true);

          if (templateData) {
            setQuiz({
              ...templateData.quiz,
              created_by: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setQuestions(templateData.questions);

            const type = localStorage.getItem("quiz_type");
            if (type) handleQuizChange("quiz_type", type);

            // If edit mode is specified, set the active step
            if (editMode === "questions") {
              setActiveStep("questions");
            } else if (editMode === "details") {
              setActiveStep("details");
            }
          }
        } else if (id && id !== "new") {
          // Load existing quiz
          const { quiz: loadedQuiz, questions: loadedQuestions } =
            await getQuiz(id);

          if (loadedQuiz.created_by !== user.id) {
            setError("You do not have permission to edit this GoForm");
            setLoading(false);
            return;
          }

          setQuiz(loadedQuiz);
          setQuestions(loadedQuestions);
        } else {
          // New quiz
          setQuiz({
            ...quiz,
            created_by: user.id,
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading GoForm:", error);
        setError("Failed to load GoForm data");
        setLoading(false);
      }
    };

    loadData();
  }, [id, user, templateId, editMode, initialQuiz, initialQuestions]);

  // Handle quiz field changes
  const handleQuizChange = (field: keyof Quiz, value: any) => {
    setIsDirty(true);
    setQuiz((prev) => ({ ...prev, [field]: value }));
  };

  // Save the quiz
  const handleSave = async () => {
    if (location.pathname.includes("new")) {
      setIsDirty(false);
      setShowModal(false);
      retryCallback?.();
    }
    try {
      // Validate quiz
      const errors = await validateQuiz(quiz);
      if (errors.length > 0) {
        showToast(errors[0], "error");
        return;
      }

      // Validate questions
      if (activeStep !== "details" && activeStep !== "configure") {
        if (questions.length === 0) {
          showToast("Please add at least one question", "error");
          return;
        }

        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];

          if (!question.text.trim()) {
            showToast(`Question ${i + 1} is missing text`, "error");
            return;
          }
          const isMultipleChoice =
            (quiz.quiz_type === "configure" &&
              !quiz.quiz_question_type &&
              question.type === "multiple_choice") ||
            (quiz.quiz_type !== "configure" &&
              question.type === "multiple_choice");

          if (
            isMultipleChoice &&
            (!question.options || question.options.length < 2)
          ) {
            showToast(`Question ${i + 1} needs at least two options`, "error");
            return;
          }

          // if (question.type === 'multiple_choice' && !question.options?.some(o => o.is_correct)) {
          //   showToast(`Question ${i + 1} needs at least one correct option`, 'error');
          //   return;
          // }

          if (!question.text.trim()) {
            showToast(`Question ${i + 1} is missing text`, "error");
            return;
          }
        }
      }

      if (quiz.quiz_type === "configure" && activeStep === "details") {
        if (!quiz.quiz_question_type) {
          showToast("Please select a question type", "error");
          return;
        }
        if (!quiz.quiz_score) {
          showToast("Please select a score", "error");
          return;
        }
        if (!quiz.question_count) {
          showToast("Please add at least one question", "error");
          return;
        }
      }
      setSaving(true);

      // Save quiz
      const orderedQuestions = questions.map((q, index) => ({
        ...q,
        order: index,
      }));

      // Save quiz with ordered questions
      const quizId = await saveQuiz(quiz, orderedQuestions);

      showToast("GoForm saved successfully", "success");
    } catch (error) {
      console.error("Error saving GoForm:", error);
      showToast("Failed to save GoForm", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setIsDirty(false);
    setShowModal(false);
    retryCallback?.();
    setRetryCallback(null);
  };

  const handleCancel = () => {
    setRetryCallback(null);
    setShowModal(false);
  };

  // Preview the quiz
  const handlePreview = () => {
    if (quiz.id) {
      window.open(`/quiz/${quiz.id}`, "_blank");
    } else {
      showToast("Please save the GoForm first to preview it", "error");
    }
  };

  // Share the quiz
  const handleShare = async () => {
    if (!quiz.id) {
      showToast("Please save the GoForm first to share it", "error");
      return;
    }

    try {
      // Generate share URL
      const shareId =
        quiz.share_id || `${window.location.origin}/quiz/${quiz.id}`;
      setShareUrl(`${globalThis.location.origin}/quiz/${shareId}`);
      setShowShareModal(true);
    } catch (error) {
      console.error("Error sharing GoForm:", error);
      showToast("Failed to share GoForm", "error");
    }
  };

  // Copy share URL
  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Share URL copied to clipboard", "success");
    } catch (error) {
      console.error("Error copying share URL:", error);
      showToast("Failed to copy share URL", "error");
    }
  };

  const handleCreateTemplate = () => {
    navigate(`/create-template/${id}`, {
      state: {
        quizId: id,
        questions: questions,
        quiz: quiz,
      },
    });
  };

  const STEPS = {
    configure: ConfigureStep,
    questions: QuestionsStep,
    details: DetailsStep,
    publish: PublishStep,
  };

  const StepComponent = STEPS[activeStep];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-background rounded-lg shadow-xl p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/admin/quizzes")}
            className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-primary transition-colors"
          >
            Back to GoForms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/admin/quizzes")}
            className="mr-4 p-2 text-gray-600 hover:text-text rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text mt-5">
              {id === "new" || templateId ? "Create GoForm" : "Edit GoForm"}
            </h1>
            <p className="text-gray-600">
              {activeStep === "questions"
                ? "Add and edit questions"
                : "Configure GoForm settings"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {quiz.id && (
            <>
              {quiz.quiz_type !== "template" && (
                <button
                  onClick={() => handleCreateTemplate()}
                  className={`flex items-center px-6 py-2 bg-secondary text-white rounded-lg hover:bg-primary ${
                    questions.length === 0 ? "cursor-not-allowed" : ""
                  }`}
                  disabled={questions.length === 0}
                >
                  Save as Template
                </button>
              )}
              <button
                onClick={handlePreview}
                className="flex items-center px-4 py-2 border border-border rounded-lg text-text hover:bg-gray-50"
              >
                <Eye className="h-5 w-5 mr-2" />
                Preview
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 border border-border rounded-lg text-text hover:bg-gray-50"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </button>
            </>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-background rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div
                onClick={() => setActiveStep(step.key)}
                className="flex items-center cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activeStep === step.key
                      ? "bg-secondary text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-text">{step.label}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>

              {index !== steps.length - 1 && (
                <div className="w-16 h-0.5 bg-gray-200 mx-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <StepComponent
        questions={questions}
        expandedQuestion={expandedQuestion}
        setExpandedQuestion={setExpandedQuestion}
        quiz={quiz}
        setQuestions={setQuestions}
        questionTypes={questionTypes}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        handleSave={handleSave}
        saving={saving}
        handleQuizChange={handleQuizChange}
        setQuizType={setQuizType}
        id={id || null}
        expandedSettings={expandedSettings}
        setExpandedSettings={setExpandedSettings}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Share GoForm</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-1">
                Share URL
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-border rounded-l-md focus:ring-secondary focus:border-secondary"
                />
                <button
                  onClick={handleCopyShareUrl}
                  className="px-3 py-2 bg-secondary text-white rounded-r-md hover:bg-primary"
                >
                  {copied ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-200 text-text rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded shadow max-w-sm text-center relative">
            <button
              onClick={handleCancel}
              className="absolute top-2 right-2 text-gray-500 hover:text-text"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="my-5 text-balance">
              You have unsaved changes. Do you want to save them before leaving?
            </p>
            <div className="flex justify-end gap-4 mt-3">
              <button
                onClick={handleSave}
                className="bg-primary px-4 py-2 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={handleDiscard}
                className="bg-gray-400 px-4 py-2 text-white rounded"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
