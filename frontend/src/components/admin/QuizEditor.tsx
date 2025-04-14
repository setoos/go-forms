import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Eye,
  Copy,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader,
  CheckCircle,
  X,
  Share2,
  FileText,
  Briefcase,
  BookOpen,
  EyeOffIcon,
  EyeIcon,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { showToast } from "../../lib/toast";
import {
  saveQuiz,
  validateQuiz,
  getQuiz,
  getQuizTemplate,
} from "../../lib/quiz";
import type { Quiz, Question, Option } from "../../types/quiz";
import { QUIZ_CATEGORIES } from "../../types/quiz";
import { quillFormats, quillModules } from "../../lib/quillConfig";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableQuestion } from "./DraggableQuestions";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useTheme } from "../../lib/theme";
import { usePrompt } from "../../lib/usePrompt";
import { useUnsavedChangesWarning } from "../../lib/useUnsavedChangesWarning";

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

// Cognitive level options
const cognitiveLevels = [
  { value: "recall", label: "Recall" },
  { value: "understanding", label: "Understanding" },
  { value: "application", label: "Application" },
  { value: "analysis", label: "Analysis" },
];

// Difficulty level options
const difficultyLevels = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  Marketing: <Briefcase className="h-5 w-5" />,
  Technology: <FileText className="h-5 w-5" />,
  Business: <Briefcase className="h-5 w-5" />,
  Education: <BookOpen className="h-5 w-5" />,
  Science: <FileText className="h-5 w-5" />,
  "General Knowledge": <FileText className="h-5 w-5" />,
  Other: <FileText className="h-5 w-5" />,
};

export default function QuizEditor({ initialQuiz, initialQuestions }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!initialQuiz);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<"questions" | "details" | "publish">(
    "details"
  );
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});
  const { points, setPoints } = useTheme();

  // Get template ID from URL query params
  const queryParams = new URLSearchParams(location.search);
  const templateId = queryParams.get("template");
  const editMode = queryParams.get("edit");

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
    }
  );

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions || []
  );
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [activeOptionEditors, setActiveOptionEditors] = useState<{
    [key: string]: boolean;
  }>({});

  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [retryCallback, setRetryCallback] = useState<null | (() => void)>(null);
  const [hiddenQuestions, setHiddenQuestions] = useState<Question[]>([]);

  if (location.pathname.includes("new") || location.pathname.includes('?template')) {
    useUnsavedChangesWarning(isDirty);

    usePrompt(isDirty, (retry) => {
      setRetryCallback(() => retry);
      setShowModal(true);
    });
  }

  // Load quiz data
  useEffect(() => {
    setIsDirty(true);
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

          if (templateData) {
            setQuiz({
              ...templateData.quiz,
              created_by: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setQuestions(templateData.questions);

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
    setQuiz((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      quiz_id: quiz.id,
      text: "",
      type: "multiple_choice",
      order: questions.length,
      points: points || 10,
      cognitive_level: "understanding",
      difficulty_level: "medium",
      required: true,
      created_at: new Date().toISOString(),
      options: [],
    };

    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(questions.length);
  };

  // Delete a question
  const handleDeleteQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);

    // Update order for remaining questions
    const updatedQuestions = newQuestions.map((q, i) => ({
      ...q,
      order: i,
    }));

    setQuestions(updatedQuestions);

    // If the expanded question was deleted, collapse all
    if (expandedQuestion === index) {
      setExpandedQuestion(null);
    } else if (expandedQuestion !== null && expandedQuestion > index) {
      // If a question before the expanded one was deleted, adjust the expanded index
      setExpandedQuestion(expandedQuestion - 1);
    }
  };

  // Duplicate a question
  const handleDuplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const newQuestion: Question = {
      ...questionToDuplicate,
      id: `temp-${Date.now()}`,
      text: `${questionToDuplicate.text} (Copy)`,
      order: questions.length,
      options: questionToDuplicate.options
        ? [
          ...questionToDuplicate.options.map((o) => ({
            ...o,
            id: `temp-${Date.now()}-${o.order}`,
          })),
        ]
        : [],
      matching_pairs: questionToDuplicate.matching_pairs
        ? [
          ...questionToDuplicate.matching_pairs.map((p) => ({
            ...p,
            id: `temp-${Date.now()}-${p.order}`,
          })),
        ]
        : [],
      ordering_items: questionToDuplicate.ordering_items
        ? [
          ...questionToDuplicate.ordering_items.map((i) => ({
            ...i,
            id: `temp-${Date.now()}-${i.order}`,
          })),
        ]
        : [],
      essay_rubrics: questionToDuplicate.essay_rubrics
        ? [
          ...questionToDuplicate.essay_rubrics.map((r) => ({
            ...r,
            id: `temp-${Date.now()}`,
          })),
        ]
        : [],
    };

    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(questions.length);
  };

  // Update a question
  const handleQuestionChange = (
    index: number,
    field: keyof Question,
    value: any
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    };

    // If changing question type, reset options
    if (field === "type") {
      newQuestions[index].options = [];
      newQuestions[index].matching_pairs = [];
      newQuestions[index].ordering_items = [];
      newQuestions[index].essay_rubrics = [];
      newQuestions[index].answer_key = null;
    }

    setQuestions(newQuestions);
  };

  // Add an option to a question
  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const options = newQuestions[questionIndex].options || [];

    const newOption: Option = {
      id: `temp-${Date.now()}-${options.length}`,
      question_id: newQuestions[questionIndex].id,
      text: "",
      score: 0,
      feedback: "",
      order: options.length,
      is_correct: false
    };

    newQuestions[questionIndex].options = [...options, newOption];
    setQuestions(newQuestions);

    // Set this option's editor as active
    setActiveOptionEditors((prev) => ({
      ...prev,
      [`${questionIndex}-${options.length}`]: true,
    }));
  };

  // Delete an option
  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    options.splice(optionIndex, 1);

    // Update order for remaining options
    const updatedOptions = options.map((o, i) => ({
      ...o,
      order: i,
    }));

    newQuestions[questionIndex].options = updatedOptions;
    setQuestions(newQuestions);

    // Remove this option's editor from active editors
    const editorKey = `${questionIndex}-${optionIndex}`;
    const newActiveEditors = { ...activeOptionEditors };
    delete newActiveEditors[editorKey];
    setActiveOptionEditors(newActiveEditors);
  };

  // Update an option
  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    field: keyof Option,
    value: any
  ) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];

    options[optionIndex] = {
      ...options[optionIndex],
      [field]: value,
    };

    // If changing score, update is_correct
    // if (field === 'score') {
    //   options[optionIndex].is_correct = value > 0;
    // }

    // If changing is_correct, update score
    // if (field === 'is_correct') {
    //   options[optionIndex].score = value ? 10 : 0;
    // }

    newQuestions[questionIndex].options = options;
    setQuestions(newQuestions);
  };

  // Toggle question expansion
  const toggleQuestionExpand = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  // Toggle option editor
  const toggleOptionEditor = (questionIndex: number, optionIndex: number) => {
    const key = `${questionIndex}-${optionIndex}`;
    setActiveOptionEditors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };


  // Handle image upload for the rich text editor
  const handleImageUpload = async () => {
    // Create a file input element
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/jpeg, image/png, image/gif");

    // When a file is selected
    input.onchange = async () => {
      if (!input.files || !input.files[0]) return;

      const file = input.files[0];

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        showToast(
          "Invalid file type. Please upload JPG, PNG, or GIF images.",
          "error"
        );
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image is too large. Maximum size is 5MB.", "error");
        return;
      }

      try {
        // Show loading toast
        showToast("Uploading image...", "info");

        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("quiz-images")
          .upload(`public/${fileName}`, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: publicURL } = supabase.storage
          .from("quiz-images")
          .getPublicUrl(`public/${fileName}`);

        if (!publicURL) throw new Error("Failed to get public URL");

        // Find the active editor
        const activeEditorKey = Object.keys(activeOptionEditors).find(
          (key) => activeOptionEditors[key]
        );
        if (activeEditorKey) {
          const [questionIndex, optionIndex] = activeEditorKey
            .split("-")
            .map(Number);
          const quill =
            quillRefs.current[
              `option-${questionIndex}-${optionIndex}`
            ]?.getEditor();

          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", publicURL.publicUrl);
            quill.setSelection(range.index + 1);
          }
        }

        showToast("Image uploaded successfully", "success");
      } catch (error) {
        console.error("Error uploading image:", error);
        showToast(
          "Error uploading image: " +
          (error instanceof Error ? error.message : "Unknown error"),
          "error"
        );
      }
    };

    // Trigger file selection
    input.click();
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
      if (activeStep === "questions") {
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

          if (
            question.type === "multiple_choice" &&
            (!question.options || question.options.length < 2)
          ) {
            showToast(`Question ${i + 1} needs at least two options`, "error");
            return;
          }

          if (question.type === 'multiple_choice' && !question.options?.some(o => o.is_correct)) {
            showToast(`Question ${i + 1} needs at least one correct option`, 'error');
            return;
          }

          if (!question.text.trim()) {
            showToast(`Question ${i + 1} is missing text`, "error");
            return;
          }

          if (
            question.type === "multiple_choice" &&
            (!question.options || question.options.length < 2)
          ) {
            showToast(`Question ${i + 1} needs at least two options`, "error");
            return;
          }
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
  }

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

  // Continue to details
  const handleContinueToDetails = async () => {
    const errors = await validateQuiz(quiz);
    if (errors.length > 0) {
      showToast(errors[0], "error");
      return;
    }
    setActiveStep("questions");
  };

  // Back to details
  const handleBackToDetails = () => {
    setActiveStep("details");
  };

  function addMatchingPair(questionIndex: number) {
    const newQuestions = [...questions];
    const currentPairs = newQuestions[questionIndex].matching_pairs || [];

    newQuestions[questionIndex].matching_pairs = [
      ...currentPairs,
      {
        id: crypto.randomUUID(), // ensure a unique ID for local updates
        question_id: newQuestions[questionIndex].id || "",
        left_item: "",
        right_item: "",
        order: currentPairs.length,
        created_at: new Date().toISOString(),
        feedback: "",
      },
    ];

    setQuestions(newQuestions);
  }

  function updateMatchingPairs(questionIndex: number, updatedPairs: any[]) {
    const newQuestions = [...questions];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      matching_pairs: updatedPairs,
    };
    setQuestions(newQuestions);
  }




  function addOrderingItem(questionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].ordering_items = [
      ...(newQuestions[questionIndex].ordering_items || []),
      {
        id: "",
        question_id: "",
        item: "",
        correct_position:
          (newQuestions[questionIndex].ordering_items?.length || 0) + 1,
        order: newQuestions[questionIndex].ordering_items?.length || 0,
        created_at: new Date().toISOString(),
        feedback: "",
      },
    ];
    setQuestions(newQuestions);
  }

  function addEssayRubric(questionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].essay_rubrics = [
      ...(newQuestions[questionIndex].essay_rubrics || []),
      {
        id: "",
        question_id: "",
        criteria: "",
        description: "",
        max_points: 5,
        created_at: new Date().toISOString(),
        feedback: "",
      },
    ];
    setQuestions(newQuestions);
  }

  function updateQuestion(index: number, updates: Partial<Question>) {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };

    // Reset question-specific data when type changes
    if (updates.type) {
      newQuestions[index].options = [];
      newQuestions[index].matching_pairs = [];
      newQuestions[index].ordering_items = [];
      newQuestions[index].essay_rubrics = [];
      newQuestions[index].answer_key = null;
      newQuestions[index].rubric = null;
    }

    setQuestions(newQuestions);
  }

  // const isHidden = (question: Question) => {
  //   return hiddenQuestions.some(q => q.id === question.id);
  // };


  // const toggleQuestionVisibility = (index: number) => {
  //   const questionToToggle = questions[index];

  //   if (isHidden(questionToToggle)) {
  //     setHiddenQuestions(prev => prev.filter(q => q.id !== questionToToggle.id));
  //   } else {
  //     setHiddenQuestions(prev => [...prev, questionToToggle]);
  //   }
  // };


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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
          {/* <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-4 py-2 rounded-lg ${saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-secondary hover:bg-primary"
              } text-white`}
          >
            {saving ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save GoForm
              </>
            )}
          </button> */}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-background rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div onClick={() => setActiveStep("details")} className="flex items-center cursor-pointer">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep === "details"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-600"
                }`}
            >
              1
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-text">Details</h3>
              <p className="text-sm text-gray-500">Configure GoForm settings</p>
            </div>
          </div>

          <div className="w-16 h-0.5 bg-gray-200"></div>

          <div onClick={() => setActiveStep("questions")} className="flex items-center cursor-pointer">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep === "questions"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-600"
                }`}
            >
              2
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-text">Questions</h3>
              <p className="text-sm text-gray-500">Add and edit questions</p>
            </div>
          </div>

          <div className="w-16 h-0.5 bg-gray-200"></div>

          <div onClick={() => setActiveStep("publish")} className="flex items-center cursor-pointer" >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep === "publish"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-600"
                }`}
            >
              3
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-text">Publish</h3>
              <p className="text-sm text-gray-500">Publish your GoForm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Step */}
      {activeStep === "questions" && (
        <div className="bg-background rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text">Questions</h2>
            <button
              onClick={handleAddQuestion}
              className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-4">
                <FileText className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-lg font-medium text-text mb-2">
                No questions yet
              </h3>
              <p className="text-gray-500 mb-4">
                Add your first question to get started
              </p>
              <div className="flex items-center space-x-2 justify-center">
                <button
                  onClick={handleAddQuestion}
                  className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
                >
                  Add Question
                </button>
                <button
                  onClick={() => navigate("/templates/library")}
                  className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
                >
                  Use Template
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }) => {
                  if (active.id !== over?.id) {
                    const oldIndex = questions.findIndex(q => q.id === active.id);
                    const newIndex = questions.findIndex(q => q.id === over?.id);
                    const newQuestions = arrayMove(questions, oldIndex, newIndex);
                    setQuestions(newQuestions);
                  }
                }}
              >

                <SortableContext
                  items={questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {questions.map((question, index) => (
                    <div key={question.id}>
                      <div className="flex items-center gap-5 w-full">
                        {/* <div className="flex items-center gap-3">
                          <span onClick={() => toggleQuestionVisibility(index)} className="font-bold text-primary my-auto cursor-pointer">
                            {isHidden(questions[index]) ? (
                              <EyeOffIcon className="size-5" />
                            ) : (
                              <EyeIcon className="size-5" />
                            )}
                          </span>

                        </div> */}
                        <div className="w-full">
                          <SortableQuestion
                            key={question.id}
                            setExpandedQuestion={setExpandedQuestion}
                            question={question}
                            index={index}
                            expandedQuestion={expandedQuestion}
                            toggleQuestionExpand={toggleQuestionExpand}
                            handleDuplicateQuestion={handleDuplicateQuestion}
                            handleDeleteQuestion={handleDeleteQuestion}
                          />
                        </div>
                      </div>
                      {expandedQuestion === index && (
                        <div className="p-4 border-t border-border">
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-text mb-1">
                              Question Text
                            </label>
                            <input
                              type="text"
                              value={question.text}
                              onChange={(e) =>
                                handleQuestionChange(index, "text", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                              placeholder="Enter question text"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-text mb-1">
                                Question Type
                              </label>
                              <select
                                value={question.type}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    index,
                                    "type",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                              >
                                {questionTypes.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-text mb-1">
                                Cognitive Level
                              </label>
                              <select
                                value={question.cognitive_level || "understanding"}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    index,
                                    "cognitive_level",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                              >
                                {cognitiveLevels.map((level) => (
                                  <option key={level.value} value={level.value}>
                                    {level.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-text mb-1">
                                Difficulty Level
                              </label>
                              <select
                                value={question.difficulty_level || "medium"}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    index,
                                    "difficulty_level",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                              >
                                {difficultyLevels.map((level) => (
                                  <option key={level.value} value={level.value}>
                                    {level.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-text mb-1">
                              Instructions (Optional)
                            </label>
                            <textarea
                              value={question.instructions || ""}
                              onChange={(e) =>
                                handleQuestionChange(
                                  index,
                                  "instructions",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                              placeholder="Enter instructions for this question"
                              rows={2}
                            />
                          </div>

                          {/* Multiple Choice Options */}
                          {question.type === "multiple_choice" && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-text">
                                  Options
                                </label>
                                <button
                                  onClick={() => handleAddOption(index)}
                                  className="text-sm text-secondary hover:text-primary"
                                >
                                  + Add Option
                                </button>
                              </div>


                              <div className="space-y-4">
                                {question.options?.map((option, optionIndex) => {
                                  const editorKey = `${index}-${optionIndex}`;
                                  const isExpanded = activeOptionEditors[editorKey];

                                  return (
                                    <div key={option.id} className="border border-border rounded-lg p-4 mb-4">
                                      {/* Always visible summary line */}
                                      <div className="flex items-center">
                                        <div
                                          onClick={() => toggleOptionEditor(index, optionIndex)}
                                          className="cursor-pointer flex items-center justify-between w-full"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium">Option {optionIndex + 1}</span>
                                          </div>
                                          <div className="flex items-center">
                                            <button
                                              className="p-1.5 text-gray-500 hover:text-text mr-1"
                                              title={isExpanded ? "Collapse option editor" : "Expand option editor"}
                                            >
                                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                          </div>
                                        </div>

                                        <button
                                          onClick={() => handleDeleteOption(index, optionIndex)}
                                          className="p-1.5 text-red-500 hover:text-red-700"
                                          title="Delete option"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>

                                      {/* Conditionally render editor section */}
                                      {isExpanded && (
                                        <div className="mt-4">
                                          <div className="mb-3 flex items-center gap-4">
                                            <label className="block text-sm font-medium text-text mb-1">Is Correct</label>
                                            <input
                                              type="checkbox"
                                              checked={option.is_correct}
                                              onChange={(e) =>
                                                handleOptionChange(index, optionIndex, "is_correct", e.target.checked)
                                              }
                                              className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                                            />
                                          </div>

                                          <div className="mb-3">
                                            <label className="block text-sm font-medium text-text mb-1">Option Text</label>
                                            <input
                                              type="text"
                                              value={option.text}
                                              onChange={(e) =>
                                                handleOptionChange(index, optionIndex, "text", e.target.value)
                                              }
                                              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                              placeholder="Option text"
                                            />
                                          </div>

                                          <div className="mb-3">
                                            <label className="block text-sm font-medium text-text mb-1">Score</label>
                                            <input
                                              type="number"
                                              value={option.score}
                                              onChange={(e) =>
                                                handleOptionChange(
                                                  index,
                                                  optionIndex,
                                                  "score",
                                                  parseInt(e.target.value) || 0
                                                )
                                              }
                                              className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                              placeholder="Score"
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-sm font-medium text-text mb-1">
                                              Feedback (Rich Content)
                                            </label>
                                            <ReactQuill
                                              ref={(el) => {
                                                quillRefs.current[`option-${index}-${optionIndex}`] = el;
                                              }}
                                              value={option.feedback || ""}
                                              onChange={(content) =>
                                                handleOptionChange(index, optionIndex, "feedback", content)
                                              }
                                              theme="snow"
                                              className="mb-4"
                                              modules={quillModules}
                                              formats={quillFormats}
                                              placeholder="Enter rich feedback content for this option..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                              This rich content will be displayed in the PDF report when this option is selected.
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                {(!question.options ||
                                  question.options.length === 0) ? (
                                  <button
                                    onClick={() => handleAddOption(index)}
                                    className="w-full py-2 border-2 border-dashed border-secondary rounded-lg text-gray-500 hover:text-text"
                                  >
                                    + Add Option
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAddOption(index)}
                                    className="py-2 px-4 border-2 border border-secondary rounded-md text-secondary mx-auto flex items-center"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span className="ml-2">Add Option</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {question.type === "matching" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Matching Pairs</h4>
                                <button
                                  onClick={() => addMatchingPair(index)}
                                  className="text-secondary hover:text-primary flex items-center gap-2"
                                >
                                  <Plus className="w-5 h-5" />
                                  <span className="text-secondary">Add Pair</span>
                                </button>
                              </div>

                              {question.matching_pairs?.map((pair, pairIndex) => (
                                <div
                                  key={`matching-${index}-${pairIndex}`}
                                  className="space-y-3 border p-4 rounded-md"
                                >
                                  <div className="flex gap-4">
                                    <input
                                      type="text"
                                      value={pair.left_item}
                                      onChange={(e) => {
                                        const updatedPairs = [...(question.matching_pairs || [])];
                                        updatedPairs[pairIndex] = {
                                          ...updatedPairs[pairIndex],
                                          left_item: e.target.value,
                                        };
                                        updateMatchingPairs(index, updatedPairs);
                                      }}
                                      className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                      placeholder="Left item"
                                    />
                                    <input
                                      type="text"
                                      value={pair.right_item}
                                      onChange={(e) => {
                                        const updatedPairs = [...(question.matching_pairs || [])];
                                        updatedPairs[pairIndex] = {
                                          ...updatedPairs[pairIndex],
                                          right_item: e.target.value,
                                        };
                                        updateMatchingPairs(index, updatedPairs);
                                      }}
                                      className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                      placeholder="Right item"
                                    />
                                    <button
                                      onClick={() => {
                                        const updatedPairs = [...(question.matching_pairs || [])];
                                        updatedPairs.splice(pairIndex, 1);
                                        updateMatchingPairs(index, updatedPairs);
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                      Feedback (Rich Content)
                                    </label>
                                    <ReactQuill
                                      value={pair.feedback || ""}
                                      onChange={(content) => {
                                        const updatedPairs = [...(question.matching_pairs || [])];
                                        updatedPairs[pairIndex] = {
                                          ...updatedPairs[pairIndex],
                                          feedback: content,
                                        };
                                        updateMatchingPairs(index, updatedPairs);
                                      }}
                                      placeholder="Enter rich feedback content for this pair..."
                                      theme="snow"
                                      className="mb-2"
                                      modules={quillModules}
                                      formats={quillFormats}
                                    />

                                    <p className="text-xs text-gray-500">
                                      This rich content will be displayed in the PDF report for this matching pair.
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {question.matching_pairs?.length !== 0 && (
                                // <div className="flex items-center ">
                                <button
                                  onClick={() => addMatchingPair(index)}
                                  className="text-secondary hover:text-primary mx-auto flex items-center gap-2 my-5 justify-center border border-secondary rounded-md px-4 py-2"
                                >
                                  <Plus className="w-5 h-5" />
                                  <span className="text-secondary">Add Pair</span>
                                </button>
                                // </div>
                              )}
                            </div>
                          )}



                          {question.type === "ordering" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Ordering Items</h4>
                                <button
                                  onClick={() => addOrderingItem(index)}
                                  className="text-secondary hover:text-primary flex items-center gap-2"
                                >
                                  <Plus className="w-5 h-5" />
                                  <span className="text-secondary">Add Item</span>
                                </button>
                              </div>

                              {question.ordering_items?.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="space-y-3 border p-4 rounded-md"
                                >
                                  <div className="flex gap-4">
                                    <input
                                      type="text"
                                      value={item.item}
                                      onChange={(e) => {
                                        const newQuestions = [...questions];
                                        newQuestions[index].ordering_items![
                                          itemIndex
                                        ].item = e.target.value;
                                        setQuestions(newQuestions);
                                      }}
                                      className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                      placeholder="Item text"
                                    />
                                    <input
                                      type="number"
                                      value={item.correct_position}
                                      onChange={(e) => {
                                        const newQuestions = [...questions];
                                        newQuestions[index].ordering_items![
                                          itemIndex
                                        ].correct_position = parseInt(
                                          e.target.value
                                        );
                                        setQuestions(newQuestions);
                                      }}
                                      className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                      placeholder="Position"
                                    />
                                    <button
                                      onClick={() => {
                                        const newQuestions = [...questions];
                                        newQuestions[index].ordering_items!.splice(
                                          itemIndex,
                                          1
                                        );
                                        setQuestions(newQuestions);
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                      Feedback (Rich Content)
                                    </label>
                                    <ReactQuill
                                      ref={(el) => {
                                        quillRefs.current[
                                          `ordering-${index}-${itemIndex}`
                                        ] = el;
                                      }}
                                      value={item.feedback || ""}
                                      onChange={(content) => {
                                        const newQuestions = [...questions];
                                        newQuestions[index].ordering_items![
                                          itemIndex
                                        ].feedback = content;
                                        setQuestions(newQuestions);
                                      }}
                                      placeholder="Enter feedback content for this item..."
                                      theme="snow"
                                      className="mb-2"
                                      modules={quillModules}
                                      formats={quillFormats}
                                    />
                                    <p className="text-xs text-gray-500">
                                      This feedback will appear in the PDF for this
                                      ordering item.
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {question.ordering_items?.length !== 0 && (
                                <button
                                  onClick={() => addOrderingItem(index)}
                                  className="text-secondary hover:text-primary flex items-center gap-2 mx-auto border border-secondary rounded-md px-4 py-2"
                                >
                                  <Plus className="w-5 h-5" />
                                  <span className="text-secondary">Add Item</span>
                                </button>
                              )}
                            </div>
                          )}


                          {question.type === "essay" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Rubric Criteria</h4>
                                <button
                                  onClick={() => addEssayRubric(index)}
                                  className="text-secondary hover:text-primary"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>

                              {question.essay_rubrics?.map(
                                (rubric, rubricIndex) => (
                                  <div
                                    key={rubricIndex}
                                    className="space-y-3 border p-4 rounded-md"
                                  >
                                    <div className="flex gap-4 flex-wrap">
                                      <input
                                        type="text"
                                        value={rubric.criteria}
                                        onChange={(e) => {
                                          const newQuestions = [...questions];
                                          newQuestions[index].essay_rubrics![
                                            rubricIndex
                                          ].criteria = e.target.value;
                                          setQuestions(newQuestions);
                                        }}
                                        className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                        placeholder="Criteria"
                                      />
                                      <input
                                        type="text"
                                        value={rubric.description || ""}
                                        onChange={(e) => {
                                          const newQuestions = [...questions];
                                          newQuestions[index].essay_rubrics![
                                            rubricIndex
                                          ].description = e.target.value;
                                          setQuestions(newQuestions);
                                        }}
                                        className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                        placeholder="Description"
                                      />
                                      <input
                                        type="number"
                                        value={rubric.max_points}
                                        onChange={(e) => {
                                          const newQuestions = [...questions];
                                          newQuestions[index].essay_rubrics![
                                            rubricIndex
                                          ].max_points = parseInt(e.target.value);
                                          setQuestions(newQuestions);
                                        }}
                                        className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                        placeholder="Points"
                                      />
                                      <button
                                        onClick={() => {
                                          const newQuestions = [...questions];
                                          newQuestions[index].essay_rubrics!.splice(
                                            rubricIndex,
                                            1
                                          );
                                          setQuestions(newQuestions);
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-text mb-1">
                                        Feedback (Rich Content)
                                      </label>
                                      <ReactQuill
                                        ref={(el) => {
                                          quillRefs.current[
                                            `essay-${index}-${rubricIndex}`
                                          ] = el;
                                        }}
                                        value={rubric.feedback || ""}
                                        onChange={(content) => {
                                          const newQuestions = [...questions];
                                          newQuestions[index].essay_rubrics![
                                            rubricIndex
                                          ].feedback = content;
                                          setQuestions(newQuestions);
                                        }}
                                        placeholder="Enter feedback for this rubric criterion..."
                                        theme="snow"
                                        className="mb-2"
                                        modules={quillModules}
                                        formats={quillFormats}
                                      />
                                      <p className="text-xs text-gray-500">
                                        This rich content will appear in the essay
                                        grading report.
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {question.type === "picture_based" && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                  Image URL
                                </label>
                                <input
                                  type="url"
                                  value={question.media_url || ""}
                                  onChange={(e) =>
                                    updateQuestion(index, {
                                      media_url: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                  placeholder="Enter image URL"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                  Feedback (Rich Content)
                                </label>
                                <ReactQuill
                                  ref={(el) => {
                                    quillRefs.current[`picture-${index}`] = el;
                                  }}
                                  value={question.feedback || ""}
                                  onChange={(content) =>
                                    updateQuestion(index, { feedback: content })
                                  }
                                  placeholder="Enter rich feedback content for this image-based question..."
                                  theme="snow"
                                  className="mb-2"
                                  modules={quillModules}
                                  formats={quillFormats}
                                />
                                <p className="text-xs text-gray-500">
                                  This feedback will be shown in the PDF when this
                                  question is answered.
                                </p>
                              </div>
                            </div>
                          )}

                          {(question.type === "true_false" || question.type === "fill_blank") && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                  Correct Answer
                                </label>
                                {question.type === "true_false" ? (
                                  <select
                                    value={
                                      question.answer_key?.correct_answer?.toString() || "true"
                                    }
                                    onChange={(e) =>
                                      updateQuestion(index, {
                                        answer_key: {
                                          ...question.answer_key,
                                          correct_answer: e.target.value === "true",
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                  >
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={question.answer_key?.correct_answer || ""}
                                    onChange={(e) =>
                                      updateQuestion(index, {
                                        answer_key: {
                                          ...question.answer_key,
                                          correct_answer: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                    placeholder="Enter correct answer"
                                  />
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-text mb-1">
                                  Feedback (Rich Content)
                                </label>
                                <ReactQuill
                                  ref={(el) => {
                                    quillRefs.current[`answer-${index}`] = el;
                                  }}
                                  value={question.feedback || ""}
                                  onChange={(content) =>
                                    updateQuestion(index, {
                                      feedback: content,
                                    })
                                  }
                                  placeholder="Enter explanation or feedback..."
                                  theme="snow"
                                  className="mb-2"
                                  modules={quillModules}
                                  formats={quillFormats}
                                />
                                <p className="text-xs text-gray-500">
                                  This explanation will appear in reports and after submission.
                                </p>
                              </div>
                            </div>
                          )}


                          {question.type === "definition" && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Feedback (Rich Content)
                                </label>

                                <ReactQuill
                                  ref={(el) => {
                                    if (el) {
                                      quillRefs.current[`definition-${index}`] = el;
                                    }
                                  }}
                                  value={question.feedback || ""}
                                  onChange={(content) =>
                                    updateQuestion(index, { feedback: content })
                                  }
                                  placeholder="Enter rich feedback content for this question..."
                                  theme="snow"
                                  className="mb-2"
                                  modules={quillModules}
                                  formats={quillFormats}
                                />

                                <p className="text-xs text-gray-500">
                                  This feedback will be shown in the PDF when this
                                  question is answered.
                                </p>
                              </div>
                            </div>
                          )}

                          {question.type === "complete_statement" && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Feedback (Rich Content)
                                </label>

                                <ReactQuill
                                  ref={(el) => {
                                    if (el) {
                                      quillRefs.current[
                                        `complete-statement-${index}`
                                      ] = el;
                                    }
                                  }}
                                  value={question.feedback || ""}
                                  onChange={(content) =>
                                    updateQuestion(index, { feedback: content })
                                  }
                                  placeholder="Enter rich feedback content for this complete statement question..."
                                  theme="snow"
                                  className="mb-2"
                                  modules={quillModules}
                                  formats={quillFormats}
                                />

                                <p className="text-xs text-gray-500">
                                  This feedback will be shown in the PDF when this
                                  question is answered.
                                </p>
                              </div>
                            </div>
                          )}

                          {question.type === "short_answer" && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Feedback (Rich Content)
                                </label>

                                <ReactQuill
                                  ref={(el) => {
                                    if (el) {
                                      quillRefs.current[`short-answer-${index}`] =
                                        el;
                                    }
                                  }}
                                  value={question.feedback || ""}
                                  onChange={(content) =>
                                    updateQuestion(index, { feedback: content })
                                  }
                                  placeholder="Enter rich feedback content for this short answer question..."
                                  theme="snow"
                                  className="mb-2"
                                  modules={quillModules}
                                  formats={quillFormats}
                                />

                                <p className="text-xs text-gray-500">
                                  This feedback will be shown in the PDF when this
                                  question is answered.
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
                            <div>
                              <label className="block text-sm font-medium text-text mb-1">
                                Points
                              </label>
                              <input
                                type="number"
                                value={question.points || points || 10}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  handleQuestionChange(index, "points", value);
                                  setPoints(value);
                                }}
                                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                placeholder="Points"
                                min={0}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-text mb-1">
                                Time Limit (seconds, optional)
                              </label>
                              <input
                                type="number"
                                value={question.time_limit || ""}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    index,
                                    "time_limit",
                                    e.target.value ? parseInt(e.target.value) : null
                                  )
                                }
                                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                placeholder="Time limit in seconds"
                                min={0}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}

          <div className="mt-8 flex justify-between gap-5">
            <button
              onClick={handleBackToDetails}
              className="flex items-center px-6 py-3 border border-border text-text rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Details
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center px-4 py-2 rounded-lg ${saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-secondary hover:bg-primary"
                  } text-white`}
              >
                {saving ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save GoForm
                  </>
                )}
              </button>
              <button
                onClick={() => setActiveStep("publish")}
                className="flex items-center px-6 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Step */}
      {activeStep === "details" && (
        <div className="bg-background rounded-lg shadow-md p-6 mb-8" >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-text mb-4">
              GoForm Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => handleQuizChange("title", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  placeholder="Enter GoForm title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Description
                </label>
                <textarea
                  value={quiz.description || ""}
                  onChange={(e) =>
                    handleQuizChange("description", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  placeholder="Enter GoForm description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Category
                  </label>
                  <select
                    value={quiz.category || ""}
                    onChange={(e) =>
                      handleQuizChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  >
                    <option value="">Select a category</option>
                    {QUIZ_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setExpandedSettings(!expandedSettings)}
                  className="flex items-center text-sm text-text hover:text-text"
                >
                  {expandedSettings ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  <Settings className="h-4 w-4 mr-1" />
                  Advanced Settings
                </button>

                {expandedSettings && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Time Limit (minutes, optional)
                        </label>
                        <input
                          type="number"
                          value={quiz.time_limit || ""}
                          onChange={(e) =>
                            handleQuizChange(
                              "time_limit",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                          placeholder="Time limit in minutes"
                          min={0}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Passing Score (%, optional)
                        </label>
                        <input
                          type="number"
                          value={quiz.passing_score || ""}
                          onChange={(e) =>
                            handleQuizChange(
                              "passing_score",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                          placeholder="Passing score percentage"
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-6 py-3 rounded-lg ${saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-secondary hover:bg-primary"
                } text-white`}
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save GoForm
                </>
              )}
            </button>
            <button
              onClick={handleContinueToDetails}
              className="flex items-center px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary"
            >
              {questions.length === 0 ? 'Add Questions' : 'View Questions'}
            </button>
          </div>
        </div>
      )}

      {activeStep === "publish" && (
        <div className="bg-background rounded-lg shadow-md p-6 mb-8">
          <label className="block text-sm font-medium text-text mb-1">
            Status
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={quiz.is_published}
                onChange={(e) =>
                  handleQuizChange("is_published", e.target.checked)
                }
                className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
              />
              <span className="ml-2 text-sm text-text">Published</span>
            </label>
          </div>
          <div className="flex items-center gap-2 mt-5 justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-4 py-2 rounded-lg ${saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-secondary hover:bg-primary"
                } text-white`}
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save GoForm
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
            <p className="my-5 text-balance">You have unsaved changes. Do you want to save them before leaving?</p>
            <div className="flex justify-between gap-4 mt-3">
              <button onClick={handleSave} className="bg-green-500 px-4 py-2 text-white rounded">Save</button>
              <button onClick={handleDiscard} className="bg-red-500 px-4 py-2 text-white rounded">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}