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
  LayoutTemplate,
  SlidersHorizontal,
  Brush,
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
import type {
  Quiz, Option, BaseQuestion, MultipleChoiceQuestion, Question,
  TrueFalseQuestion,
} from "../../types/quiz";
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

export default function QuizEditor({ initialQuiz, initialQuestions }: { initialQuiz: Quiz; initialQuestions: Question[] }) {
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
  const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});
  const { points, setPoints, setQuizType, setQuizQuestionType } = useTheme();

  // Get template ID from URL query params
  const queryParams = new URLSearchParams(location.search);
  const templateId = queryParams.get("template");
  const editMode = queryParams.get("edit");

  const [activeStep, setActiveStep] = useState<"configure" | "questions" | "details" | "publish">(
    id ? "details" : templateId ? 'questions' : "configure"
  );

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
  const [activeOptionEditors, setActiveOptionEditors] = useState<{
    [key: string]: boolean;
  }>({});

  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [retryCallback, setRetryCallback] = useState<null | (() => void)>(null);

  if (location.pathname.includes("new") || location.pathname.includes('?template') || !!id) {
    useUnsavedChangesWarning(isDirty);

    usePrompt(isDirty, (retry) => {
      setRetryCallback(() => retry);
      setShowModal(true);
    }, ['/templates/library']);
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

  // Add a new question
  const handleAddQuestion = () => {
    setIsDirty(true);
  
    // Check for max question limit
    if (
      quiz.quiz_type === "configure" &&
      questions.length === quiz.question_count
    ) {
      showToast("Your question limit exceeds!", "error");
      return;
    }
  
    const baseQuestion = {
      id: `temp-${Date.now()}`,
      quiz_id: quiz.id,
      text: "",
      order: questions.length,
      points: points || 10,
      cognitive_level: "understanding" as const,
      difficulty_level: "medium" as const,
      required: true,
      created_at: new Date().toISOString(),
    };
    
  
    let newQuestion: Question;
  
    switch (quiz.quiz_question_type) {
      case "true_false":
        newQuestion = {
          ...baseQuestion,
          type: "true_false",
          answer_key: { correct_answer: true },
          tf_feedback: {},
        };
        break;
      case "multiple_choice":
      default:
        newQuestion = {
          ...baseQuestion,
          type: "multiple_choice",
          options: [],
        };
        break;
    }
  
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

  const duplicateQuestion = (questionToDuplicate: Question, questions: Question[]): Question => {
    const base: BaseQuestion = {
      ...questionToDuplicate,
      id: `temp-${Date.now()}`,
      text: `${questionToDuplicate.text} (Copy)`,
      order: questions.length,
      created_at: new Date().toISOString(),
    };

    switch (questionToDuplicate.type) {
      case 'multiple_choice':
        return {
          ...base,
          type: 'multiple_choice',
          options: questionToDuplicate.options.map((o) => ({
            ...o,
            id: `temp-${Date.now()}-${o.order}`,
          })),
        };

      case 'matching':
        return {
          ...base,
          type: 'matching',
          matching_pairs: questionToDuplicate.matching_pairs?.map((p) => ({
            ...p,
            id: `temp-${Date.now()}-${p.order}`,
          })) || [],
        };

      case 'ordering':
        return {
          ...base,
          type: 'ordering',
          ordering_items: questionToDuplicate.ordering_items?.map((i) => ({
            ...i,
            id: `temp-${Date.now()}-${i.order}`,
          })) || [],
        };

      case 'essay':
        return {
          ...base,
          type: 'essay',
          essay_rubrics: questionToDuplicate.essay_rubrics?.map((r) => ({
            ...r,
            id: `temp-${Date.now()}`,
          })) || [],
        };

      default:
        // For types like true_false, fill_blank, etc. that don't require deep cloning
        return {
          ...base,
          type: questionToDuplicate.type,
        } as Question;
    }
  };

  const handleDuplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const newQuestion = duplicateQuestion(questionToDuplicate as Question, questions);

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
    const updatedQuestion = {
      ...newQuestions[index],
      [field]: value,
    };

    if (field === "type") {
      const resetFields: Partial<Question> = {
        options: [],
        matching_pairs: [],
        ordering_items: [],
        essay_rubrics: [],
        answer_key: null,
      };

      Object.assign(updatedQuestion, resetFields);
    }

    newQuestions[index] = updatedQuestion as Question;
    setQuestions(newQuestions);
  };

  // Add an option to a question
  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ('options' in question) {
      const options = question.options || [];

      const newOption: Option = {
        id: `temp-${Date.now()}-${options.length}`,
        question_id: question.id,
        text: "",
        score: 0,
        feedback: "",
        order: options.length,
        is_correct: false,
      };

      question.options = [...options, newOption];
      newQuestions[questionIndex] = question;
      setQuestions(newQuestions);

      // Set this option's editor as active
      setActiveOptionEditors((prev) => ({
        ...prev,
        [`${questionIndex}-${options.length}`]: true,
      }));
    } else {
      console.warn("This question type does not support options.");
    }
  };


  // Delete an option
  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ('options' in question) {
      const options = [...(question.options || [])];
      options.splice(optionIndex, 1);

      // Update order for remaining options
      const updatedOptions = options.map((o, i) => ({
        ...o,
        order: i,
      }));

      question.options = updatedOptions;
      newQuestions[questionIndex] = question;
      setQuestions(newQuestions);

      // Remove this option's editor from active editors
      const editorKey = `${questionIndex}-${optionIndex}`;
      const newActiveEditors = { ...activeOptionEditors };
      delete newActiveEditors[editorKey];
      setActiveOptionEditors(newActiveEditors);
    } else {
      console.warn("This question type does not support options.");
    }
  };


  // Update an option
  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    field: keyof Option,
    value: any
  ) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ('options' in question) {
      const options = [...(question.options || [])];
      options[optionIndex] = {
        ...options[optionIndex],
        [field]: value,
      };

      question.options = options;
      newQuestions[questionIndex] = question;
      setQuestions(newQuestions);
    } else {
      console.warn("This question type does not support options.");
    }
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
            (quiz.quiz_type === "configure" && !quiz.quiz_question_type && question.type === "multiple_choice") ||
            (quiz.quiz_type !== "configure" && question.type === "multiple_choice");

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
    const question = newQuestions[questionIndex];

    if ('matching_pairs' in question) {
      const currentPairs = question.matching_pairs || [];

      const newPair = {
        id: crypto.randomUUID(),
        question_id: question.id || "",
        left_item: "",
        right_item: "",
        order: currentPairs.length,
        created_at: new Date().toISOString(),
        feedback: "",
      };

      question.matching_pairs = [...currentPairs, newPair];
      newQuestions[questionIndex] = question;
      setQuestions(newQuestions);
    } else {
      console.warn("This question type does not support matching pairs.");
    }
  }


  function updateMatchingPairs(questionIndex: number, updatedPairs: any[]) {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ('matching_pairs' in question) {
      newQuestions[questionIndex] = {
        ...question,
        matching_pairs: updatedPairs,
      };
      setQuestions(newQuestions);
    } else {
      console.warn("This question type does not support matching pairs.");
    }
  }


  function addOrderingItem(questionIndex: number) {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ('ordering_items' in question) {
      const items = question.ordering_items || [];
      const newItem = {
        id: crypto.randomUUID(),
        question_id: question.id || "",
        item: "",
        correct_position: items.length + 1,
        order: items.length,
        created_at: new Date().toISOString(),
        feedback: "",
      };

      question.ordering_items = [...items, newItem];
      newQuestions[questionIndex] = question;
      setQuestions(newQuestions);
    } else {
      console.warn("This question type does not support ordering items.");
    }
  }


  function addEssayRubric(questionIndex: number) {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ('essay_rubrics' in question) {
      const rubrics = question.essay_rubrics || [];
      const newRubric = {
        id: crypto.randomUUID(),
        question_id: question.id || "",
        criteria: "",
        description: "",
        max_points: 5,
        created_at: new Date().toISOString(),
        feedback: "",
      };

      question.essay_rubrics = [...rubrics, newRubric];
      newQuestions[questionIndex] = question;
      setQuestions(newQuestions);
    } else {
      console.warn("This question type does not support essay rubrics.");
    }
  }


  function updateQuestion(index: number, updates: Partial<Question>) {
    const currentQuestion = questions[index];
    const updatedQuestion = { ...currentQuestion, ...updates };

    // Reset fields based on the new type
    if (updates.type) {
      switch (updates.type) {
        case "multiple_choice":
          if ('options' in updatedQuestion) updatedQuestion.options = [];
          break;

        case "true_false":
          if ('tf_feedback' in updatedQuestion) updatedQuestion.tf_feedback = {};
          break;

        case "matching":
          if ('matching_pairs' in updatedQuestion) updatedQuestion.matching_pairs = [];
          break;

        case "ordering":
          if ('ordering_items' in updatedQuestion) updatedQuestion.ordering_items = [];
          break;

        case "essay":
          if ('essay_rubrics' in updatedQuestion) updatedQuestion.essay_rubrics = [];
          break;

        // Add more cases for other types if needed
      }

      updatedQuestion.answer_key = null;
    }

    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion as Question;
    setQuestions(newQuestions);
  }


  const toggleQuestionVisibility = async (index: number) => {
    const questionToToggle = questions[index];

    try {
      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('is_hide')
        .eq('id', questionToToggle.id)
        .single();

      if (fetchError || !data) {
        console.error('Fetch error:', fetchError);
        return;
      }

      const newHideState = !data.is_hide;

      const { error: updateError } = await supabase
        .from('questions')
        .update({ is_hide: newHideState })
        .eq('id', questionToToggle.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return;
      }

      setQuestions(prev =>
        prev.map((q, i) =>
          i === index ? { ...q, is_hide: newHideState } : q
        )
      );
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleNext = async () => {

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
          quiz.quiz_question_type === "multiple_choice" &&
          (!question.options || question.options.length < 2)
        ) {
          showToast(`Question ${i + 1} needs at least two options`, "error");
          return;
        }

        if (!question.text.trim()) {
          showToast(`Question ${i + 1} is missing text`, "error");
          return;
        }
      }

    }

    setActiveStep("publish");
  };

  const handleTemplateClick = () => {
    localStorage.setItem("quiz_type", "template");
    navigate('/templates/library');
  };

  const handleConfigureClick = () => {
    setActiveStep("details");
    handleQuizChange("quiz_type", "configure");
    handleQuizChange("quiz_question_type", "multiple_choice");
    handleQuizChange("question_count", 10);
    handleQuizChange("quiz_score", 100);
    setQuizType("configure");
  };

  const handleCustomizeClick = () => {
    setActiveStep("details");
    handleQuizChange("quiz_type", "customize");
  };


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

          <div onClick={() => setActiveStep("configure")} className="flex items-center cursor-pointer">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep === "configure"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-600"
                }`}
            >
              1
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-text">Configure</h3>
              <p className="text-sm text-gray-500">Configure GoForm settings</p>
            </div>
          </div>

          <div className="w-16 h-0.5 bg-gray-200"></div>


          <div onClick={() => setActiveStep("details")} className="flex items-center cursor-pointer">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep === "details"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-600"
                }`}
            >
              2
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-text">Details</h3>
              <p className="text-sm text-gray-500">Details of your GoForm</p>
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
              3
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
              4
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
        <div className="flex max-w-7xl mx-auto px-4 py-10 gap-10 bg-background rounded-lg shadow-md p-6">
          <div className="w-full h-[calc(100vh-40vh)] overflow-y-auto scroll-smooth px-3">
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
                    {questions.map((question, index) => {

                      const calculatedPoints =
                        (quiz.quiz_type === 'configure'
                          ? (quiz.quiz_score !== undefined && quiz.question_count
                            ? quiz.quiz_score / quiz.question_count
                            : undefined)
                          : undefined) ??
                        question.points ??
                        points ??
                        10;
                      return (
                        <div key={question.id} id={question.id}>
                          <div className="flex items-center gap-5 w-full">
                            <div className="flex items-center gap-3">
                              <span
                                onClick={() => toggleQuestionVisibility(index)}
                                className="font-bold text-primary my-auto cursor-pointer"
                              >
                                {questions[index].is_hide ? (
                                  <EyeOffIcon className="size-5" />
                                ) : (
                                  <EyeIcon className="size-5" />

                                )}
                              </span>
                            </div>

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
                                    value={quiz.quiz_question_type || question.type}
                                    onChange={(e) =>
                                      handleQuestionChange(
                                        index,
                                        "type",
                                        e.target.value
                                      )
                                    }
                                    disabled={quiz.quiz_type === 'configure'}
                                    className={`w-full px-3 py-2 border ${quiz.quiz_type === 'configure' ? 'cursor-not-allowed bg-gray-100' : ''} rounded-md focus:ring-secondary border-border focus:border-secondary`}
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
                              {(quiz.quiz_question_type || question.type) === "multiple_choice" && (
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
                                    {question.type === "multiple_choice" && question.options?.map((option, optionIndex) => {
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
                                                  onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 0;

                                                    if (
                                                      quiz.quiz_type === "configure" &&
                                                      value > (question.points ?? 0)
                                                    ) {
                                                      showToast(`Score can't be greater than the question's total points`, "error");
                                                      return;
                                                    }

                                                    handleOptionChange(index, optionIndex, "score", value);
                                                  }}

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
                                    {(question.type === "multiple_choice" && (!question.options ||
                                      question.options.length === 0)) ? (
                                      <button
                                        onClick={() => handleAddOption(index)}
                                        className="w-full py-2 border-2 border-dashed border-secondary rounded-lg text-gray-500 hover:text-text"
                                      >
                                        + Add Option
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleAddOption(index)}
                                        className="py-2 px-4 border-2 border-dashed border-secondary rounded-md text-secondary mx-auto flex items-center"
                                      >
                                        <Plus className="w-4 h-4" />
                                        <span className="ml-2">Add Option</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {(quiz.quiz_question_type || question.type) === "true_false" && (
                                <div className="mb-4">
                                  <div className="mb-6">
                                    <label className="block text-sm font-medium text-text mb-2">
                                      Correct Answer
                                    </label>
                                    <div className="flex items-center space-x-6">
                                      {["true", "false"].map((val) => (
                                        <label key={val} className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`correct-answer-${index}`}
                                            value={val}
                                            checked={question.answer_key?.correct_answer === (val === "true")}
                                            onChange={() =>
                                              updateQuestion(index, {
                                                answer_key: {
                                                  ...question.answer_key,
                                                  correct_answer: val === "true",
                                                },
                                              })
                                            }
                                            className="text-secondary focus:ring-secondary"
                                          />
                                          <span>{val.charAt(0).toUpperCase() + val.slice(1)}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-6">
                                    <div>
                                      <label className="block text-sm font-medium text-text mb-1">
                                        Feedback for True
                                      </label>
                                      <ReactQuill
                                        ref={(el) => {
                                          quillRefs.current[`feedback-true-${index}`] = el;
                                        }}
                                        value={question.tf_feedback?.true || ""}
                                        onChange={(content) =>
                                          updateQuestion(index, {
                                            tf_feedback: {
                                              ...question.tf_feedback,
                                              true: content,
                                            },
                                          })
                                        }
                                        placeholder="Feedback when answer is True"
                                        theme="snow"
                                        className="mb-2"
                                        modules={quillModules}
                                        formats={quillFormats}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-text mb-1">
                                        Feedback for False
                                      </label>
                                      <ReactQuill
                                        ref={(el) => {
                                          quillRefs.current[`feedback-false-${index}`] = el;
                                        }}
                                        value={question.tf_feedback?.false || ""}
                                        onChange={(content) =>
                                          updateQuestion(index, {
                                            tf_feedback: {
                                              ...question.tf_feedback,
                                              false: content,
                                            },
                                          })
                                        }
                                        placeholder="Feedback when answer is False"
                                        theme="snow"
                                        className="mb-2"
                                        modules={quillModules}
                                        formats={quillFormats}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {(quiz.quiz_question_type || question.type) === "matching" && (
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

                                  {question.type === "matching" && question.matching_pairs?.map((pair, pairIndex) => (
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
                                  {question.type === "matching" && question.matching_pairs?.length !== 0 && (
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



                              {(quiz.quiz_question_type || question.type) === "ordering" && (
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

                                  {question.type === "ordering" && question.ordering_items?.map((item, itemIndex) => (
                                    <div
                                      key={itemIndex}
                                      className="space-y-3 border p-4 rounded-md"
                                    >
                                      <div className="flex gap-4">
                                        <input
                                          type="text"
                                          value={
                                            question.type === "ordering"
                                              ? question.ordering_items?.[itemIndex]?.item || ""
                                              : ""
                                          }
                                          onChange={(e) => {
                                            if (question.type !== "ordering") return;

                                            const newQuestions = [...questions];
                                            const currentQuestion = newQuestions[index];

                                            if ("ordering_items" in currentQuestion && currentQuestion.ordering_items) {
                                              currentQuestion.ordering_items[itemIndex].item = e.target.value;
                                              setQuestions(newQuestions);
                                            }
                                          }}
                                          className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                          placeholder="Item text"
                                        />

                                        <input
                                          type="number"
                                          value={
                                            question.type === "ordering"
                                              ? question.ordering_items?.[itemIndex]?.correct_position || 0
                                              : 0
                                          }
                                          onChange={(e) => {
                                            if (question.type !== "ordering") return;

                                            const newQuestions = [...questions];
                                            const currentQuestion = newQuestions[index];

                                            if (
                                              "ordering_items" in currentQuestion &&
                                              Array.isArray(currentQuestion.ordering_items)
                                            ) {
                                              const updatedPosition = parseInt(e.target.value);
                                              currentQuestion.ordering_items[itemIndex].correct_position = updatedPosition;
                                              setQuestions(newQuestions);
                                            }
                                          }}
                                          className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                          placeholder="Position"
                                        />
                                        <button
                                          onClick={() => {
                                            const newQuestions = [...questions];
                                            const currentQuestion = newQuestions[index];

                                            if (
                                              currentQuestion.type === "ordering" &&
                                              Array.isArray(currentQuestion.ordering_items)
                                            ) {
                                              currentQuestion.ordering_items.splice(itemIndex, 1);
                                              setQuestions(newQuestions);
                                            }
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
                                            const currentQuestion = newQuestions[index];

                                            if (
                                              currentQuestion.type === "ordering" &&
                                              Array.isArray(currentQuestion.ordering_items)
                                            ) {
                                              currentQuestion.ordering_items[itemIndex].feedback = content;
                                              setQuestions(newQuestions);
                                            }
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
                                  {question.type === "ordering" && question.ordering_items?.length !== 0 && (
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


                              {(quiz.quiz_question_type || question.type) === "essay" && (
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

                                  {question.type === "essay" && question.essay_rubrics?.map(
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
                                              const currentQuestion = newQuestions[index];

                                              if (
                                                currentQuestion.type === "essay" &&
                                                Array.isArray(currentQuestion.essay_rubrics)
                                              ) {
                                                currentQuestion.essay_rubrics[rubricIndex].criteria = e.target.value;
                                                setQuestions(newQuestions);
                                              }
                                            }}

                                            className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                            placeholder="Criteria"
                                          />
                                          <input
                                            type="text"
                                            value={rubric.description || ""}
                                            onChange={(e) => {
                                              const newQuestions = [...questions];
                                              const currentQuestion = newQuestions[index];

                                              if (
                                                currentQuestion.type === "essay" &&
                                                Array.isArray(currentQuestion.essay_rubrics)
                                              ) {
                                                currentQuestion.essay_rubrics[rubricIndex].description = e.target.value;
                                                setQuestions(newQuestions);
                                              }
                                            }}
                                            className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                            placeholder="Description"
                                          />
                                          <input
                                            type="number"
                                            value={rubric.max_points || ""}
                                            onChange={(e) => {
                                              const newQuestions = [...questions];
                                              const currentQuestion = newQuestions[index];

                                              if (
                                                currentQuestion.type === "essay" &&
                                                Array.isArray(currentQuestion.essay_rubrics)
                                              ) {
                                                currentQuestion.essay_rubrics[rubricIndex].max_points = parseInt(e.target.value, 10);
                                                setQuestions(newQuestions);
                                              }
                                            }}
                                            className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                            placeholder="Points"
                                          />
                                          <button
                                            onClick={() => {
                                              const newQuestions = [...questions];
                                              const currentQuestion = newQuestions[index];

                                              if (
                                                currentQuestion.type === "essay" &&
                                                Array.isArray(currentQuestion.essay_rubrics)
                                              ) {
                                                currentQuestion.essay_rubrics.splice(rubricIndex, 1);
                                                setQuestions(newQuestions);
                                              }
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
                                              const currentQuestion = newQuestions[index];

                                              if (
                                                currentQuestion.type === "essay" &&
                                                Array.isArray(currentQuestion.essay_rubrics)
                                              ) {
                                                currentQuestion.essay_rubrics[rubricIndex].feedback = content;
                                                setQuestions(newQuestions);
                                              }
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

                              {(quiz.quiz_question_type || question.type) === "picture_based" && (
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

                              {(quiz.quiz_question_type || question.type) === "fill_blank" && (
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
                              )}

                              {(quiz.quiz_question_type || question.type) === "definition" && (
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

                              {(quiz.quiz_question_type || question.type) === "complete_statement" && (
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

                              {(quiz.quiz_question_type || question.type) === "short_answer" && (
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
                                    value={calculatedPoints}
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
                      )
                    })}
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
                  onClick={() => handleNext()}
                  className="flex items-center px-6 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <aside className="w-64 sticky top-20 self-start p-4 bg-white border border-gray-200 rounded-md shadow-sm h-[calc(100vh-40vh)] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide px-2">
              Table of Contents
            </h3>
            <ul className="text-sm space-y-1">
              {questions.map((q, index) => (
                <li key={q.id}>
                  <a
                    href={`#${q.id}`}
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent text-text transition text-sm font-medium truncate"
                    title={q.text}
                  >
                    <span className="text-text text-xs">{index + 1}</span>
                    <span className="truncate">{q.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>

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
                {quiz.quiz_type === 'configure' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text mb-1">
                      Question Type
                    </label>
                    <select
                      value={quiz.quiz_question_type}
                      onChange={(e) => {
                        handleQuizChange("quiz_question_type", e.target.value);
                        setQuizQuestionType(e.target.value);
                      }}
                      disabled={quiz.quiz_type === 'configure' && !!id}
                      className={`w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary ${quiz.quiz_type === 'configure' && !!id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      {questionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {quiz.quiz_type === 'configure' && (
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      No. of Questions
                    </label>
                    <input
                      type="number"
                      value={quiz.question_count || 10}
                      onChange={(e) => handleQuizChange("question_count", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                      placeholder="No. of Questions"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      Quiz Score
                    </label>
                    <input
                      type="number"
                      value={quiz.quiz_score || 100}
                      onChange={(e) => handleQuizChange("quiz_score", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                      placeholder="Score"
                      min={0}
                    />
                  </div>
                </div>
              )}


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
              Save & Next
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

      {activeStep === "configure" && (
        <div className="bg-background rounded-lg shadow-md px-6 py-10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Use Template Card */}
            <div onClick={() => handleTemplateClick()} className="bg-white rounded-2xl shadow hover:shadow-lg transition duration-300 border border-accent cursor-pointer px-6 py-10">
              <div className="flex items-center gap-2 mb-2">
                <LayoutTemplate className="text-primary w-5 h-5" />
                <h3 className="text-xl font-semibold text-gray-800">Use Template</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Choose from pre-made templates to kickstart your setup quickly and efficiently.
              </p>
            </div>

            {/* Configure Card */}
            <div onClick={() => handleConfigureClick()} className="bg-white rounded-2xl shadow hover:shadow-lg transition duration-300 border border-accent cursor-pointer px-6 py-10">
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="text-primary w-5 h-5" />
                <h3 className="text-xl font-semibold text-gray-800">Configure</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Set up the details and options to tailor the experience for your needs.
              </p>
            </div>

            {/* Customize Card */}
            <div onClick={() => handleCustomizeClick()} className="bg-white rounded-2xl shadow hover:shadow-lg transition duration-300 border border-accent cursor-pointer px-6 py-10">
              <div className="flex items-center gap-2 mb-2">
                <Brush className="text-primary w-5 h-5" />
                <h3 className="text-xl font-semibold text-gray-800">Customize</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Personalize the interface and behavior to match your unique preferences.
              </p>
            </div>
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