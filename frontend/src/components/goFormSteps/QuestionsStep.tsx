import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React, { useRef, useState } from "react";
import { SortableQuestion } from "../admin/DraggableQuestions";
import DragOptions from "../admin/DragOptions";
import { BaseQuestion, Question, QuestionComponentProps, QuestionType, Quiz } from "../../types/quiz";
import {
  ArrowLeft,
  EyeIcon,
  EyeOffIcon,
  FileText,
  Loader,
  Plus,
  Save,
  X,
} from "lucide-react";
import { showToast } from "../../lib/toast";
import { useTheme } from "../../lib/theme";
import { supabase } from "../../lib/supabase";
import ReactQuill from "react-quill";
import { validateQuiz } from "../../lib/quiz";
import Mcq from "../question-types/Mcq";
import Definition from "../question-types/Definition";
import CompleteStatement from "../question-types/CompleteStatement";
import PictureBased from "../question-types/PictureBased";
import Essay from "../question-types/Essay";
import Ordering from "../question-types/Ordering";
import Matching from "../question-types/Matching";
import ShortAnswer from "../question-types/ShortAnswer";
import FillBlank from "../question-types/FillBlank";
import TrueFalse from "../question-types/TrueFalse";

// Cognitive level options
const cognitiveLevels = [
  { value: "recall", label: "Recall" },
  { value: "understanding", label: "Understanding" },
  { value: "application", label: "Application" },
  { value: "analysis", label: "Analysis" },
];

const difficultyLevels = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const QuestionsStep = ({
  questions,
  expandedQuestion,
  setExpandedQuestion,
  quiz,
  setQuestions,
  questionTypes,
  activeStep,
  setActiveStep,
  handleSave,
  saving,
}: {
  questions: Question[];
  expandedQuestion: number | null;
  setExpandedQuestion: React.Dispatch<React.SetStateAction<number | null>>;
  quiz: Quiz;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  questionTypes: any[];
  activeStep: "configure" | "questions" | "details" | "publish";
  setActiveStep: React.Dispatch<
    React.SetStateAction<"configure" | "questions" | "details" | "publish">
  >;
  handleSave: () => void;
  saving: boolean;
}) => {
  const [isDirty, setIsDirty] = useState(false);
  const [isOptionExpanded, setIsOptionExpanded] = useState(false);
  const { points, setPoints } = useTheme();
  const [activeOptionEditors, setActiveOptionEditors] = useState<{
    [key: string]: boolean;
  }>({});
  const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDropField = (
    e: React.DragEvent,
    questionIndex: number,
    optionIndex: number
  ) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("fieldType");

    // Create a copy of the questions array to update the state immutably
    const updatedQuestions = [...questions];
    const targetQuestion = updatedQuestions[questionIndex];

    // Initialize addedFields if it doesn't exist
    if (!targetQuestion.addedFields) {
      targetQuestion.addedFields = [];
    }

    // Handle fields dropped at the question level (like "instruction")
    if (
      fieldType === "instruction" &&
      !targetQuestion.addedFields.includes(fieldType)
    ) {
      targetQuestion.addedFields.push(fieldType);
    }

    // Handle specific fields dropped on options (only for "multiple_choice" questions)
    if (targetQuestion.type === "multiple_choice") {
      const targetOption = targetQuestion.options?.[optionIndex];
      if (targetOption) {
        // Initialize addedFields for the option if it doesn't exist
        if (!targetOption.addedFields) {
          targetOption.addedFields = [];
        }

        // Only add "is_correct" if it's not already in addedFields
        if (
          fieldType === "is_correct" &&
          !targetOption.addedFields.includes("is_correct")
        ) {
          targetOption.addedFields.push("is_correct");

          // // Add "score" only if "is_correct" is present
          // if (!targetOption.addedFields.includes("score")) {
          //   targetOption.addedFields.push("score");
          // }
        }

        // Handle adding "score" separately if it was dropped
        if (
          fieldType === "score" &&
          !targetOption.addedFields.includes("score")
        ) {
          targetOption.addedFields.push("score");
        }
      }
    }

    // Update the state with the modified questions array
    setQuestions(updatedQuestions);
  };

  const toggleQuestionVisibility = async (index: number) => {
    const questionToToggle = questions[index];

    try {
      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("is_hide")
        .eq("id", questionToToggle.id)
        .single();

      if (fetchError || !data) {
        console.error("Fetch error:", fetchError);
        return;
      }

      const newHideState = !data.is_hide;

      const { error: updateError } = await supabase
        .from("questions")
        .update({ is_hide: newHideState })
        .eq("id", questionToToggle.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return;
      }

      setQuestions((prev) =>
        prev.map((q, i) => (i === index ? { ...q, is_hide: newHideState } : q))
      );
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const toggleQuestionExpand = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const duplicateQuestion = (
    questionToDuplicate: Question,
    questions: Question[]
  ): Question => {
    const base: BaseQuestion = {
      ...questionToDuplicate,
      id: `temp-${Date.now()}`,
      text: `${questionToDuplicate.text} (Copy)`,
      order: questions.length,
      created_at: new Date().toISOString(),
    };

    switch (questionToDuplicate.type) {
      case "multiple_choice":
        return {
          ...base,
          type: "multiple_choice",
          options: questionToDuplicate.options.map((o) => ({
            ...o,
            id: `temp-${Date.now()}-${o.order}`,
          })),
        };

      case "matching":
        return {
          ...base,
          type: "matching",
          matching_pairs:
            questionToDuplicate.matching_pairs?.map((p) => ({
              ...p,
              id: `temp-${Date.now()}-${p.order}`,
            })) || [],
        };

      case "ordering":
        return {
          ...base,
          type: "ordering",
          ordering_items:
            questionToDuplicate.ordering_items?.map((i) => ({
              ...i,
              id: `temp-${Date.now()}-${i.order}`,
            })) || [],
        };

      case "essay":
        return {
          ...base,
          type: "essay",
          essay_rubrics:
            questionToDuplicate.essay_rubrics?.map((r) => ({
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
    const newQuestion = duplicateQuestion(
      questionToDuplicate as Question,
      questions
    );

    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(questions.length);
  };

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
      if (value === "multiple_choice") {
        Object.assign(updatedQuestion, {
          options: [],
          answer_key: null,
          tf_feedback: undefined,
          matching_pairs: [],
          ordering_items: [],
          essay_rubrics: [],
        });
      } else if (value === "true_false") {
        Object.assign(updatedQuestion, {
          answer_key: { correct_answer: true },
          tf_feedback: {},
          options: undefined,
          matching_pairs: [],
          ordering_items: [],
          essay_rubrics: [],
        });
      }
    }

    newQuestions[index] = updatedQuestion as Question;
    setQuestions(newQuestions);
  };

  const handleRemoveField = (
    questionIndex: number,
    fieldType: string,
    optionIndex?: number
  ) => {
    const updatedQuestions = [...questions];
    const targetQuestion = updatedQuestions[questionIndex];

    const target =
      optionIndex !== undefined && targetQuestion.type === "multiple_choice"
        ? targetQuestion.options?.[optionIndex]
        : targetQuestion;

    if (target?.addedFields) {
      target.addedFields = target.addedFields.filter(
        (field) => field !== fieldType
      );

      // // If "is_correct" is removed, also remove "score" if it exists
      // if (fieldType === "is_correct" && target.addedFields.includes("score")) {
      //   target.addedFields = target.addedFields.filter(field => field !== "score");
      // }
    }

    setQuestions(updatedQuestions);
  };

  function updateQuestion(index: number, updates: Partial<Question>) {
    const currentQuestion = questions[index];
    const updatedQuestion = { ...currentQuestion, ...updates };

    // Reset fields based on the new type
    if (updates.type) {
      switch (updates.type) {
        case "multiple_choice":
          if ("options" in updatedQuestion) updatedQuestion.options = [];
          break;

        case "true_false":
          if ("tf_feedback" in updatedQuestion)
            updatedQuestion.tf_feedback = {};
          break;

        case "matching":
          if ("matching_pairs" in updatedQuestion)
            updatedQuestion.matching_pairs = [];
          break;

        case "ordering":
          if ("ordering_items" in updatedQuestion)
            updatedQuestion.ordering_items = [];
          break;

        case "essay":
          if ("essay_rubrics" in updatedQuestion)
            updatedQuestion.essay_rubrics = [];
          break;

        // Add more cases for other types if needed
      }

      updatedQuestion.answer_key = null;
    }

    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion as Question;
    setQuestions(newQuestions);
  }

  const handleBackToDetails = () => {
    setActiveStep("details");
  };

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

  const QUESTION_TYPES: Record<QuestionType, React.FC<QuestionComponentProps>> = {
    multiple_choice: Mcq,
    true_false: TrueFalse,
    matching: Matching,
    ordering: Ordering,
    essay: Essay,
    definition: Definition,
    complete_statement: CompleteStatement,
    picture_based: PictureBased,
    short_answer: ShortAnswer,
    fill_blank: FillBlank,
  };

  return (
    <div className="flex w-full">
      {questions.length !== 0 && expandedQuestion !== null && (
        <DragOptions isOptionExpanded={isOptionExpanded} />
      )}
      <div className="flex max-w-7xl w-full mx-auto px-4 py-10 gap-10 bg-background rounded-lg shadow-md p-6">
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
                    const oldIndex = questions.findIndex(
                      (q) => q.id === active.id
                    );
                    const newIndex = questions.findIndex(
                      (q) => q.id === over?.id
                    );
                    const newQuestions = arrayMove(
                      questions,
                      oldIndex,
                      newIndex
                    );
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
                      (quiz.quiz_type === "configure"
                        ? quiz.quiz_score !== undefined && quiz.question_count
                          ? quiz.quiz_score / quiz.question_count
                          : undefined
                        : undefined) ??
                      question.points ??
                      points ??
                      10;

                    const questionTypeKey =
                      quiz.quiz_type === "configure"
                        ? quiz.quiz_question_type
                        : question.type;

                    const QuestionTypeComponent =
                      questionTypeKey && QUESTION_TYPES[questionTypeKey];

                    return (
                      <div
                        key={question.id}
                        id={question.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropField(e, index, index)}
                      >
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
                                  handleQuestionChange(
                                    index,
                                    "text",
                                    e.target.value
                                  )
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
                                  value={
                                    quiz.quiz_question_type || question.type
                                  }
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      index,
                                      "type",
                                      e.target.value
                                    )
                                  }
                                  disabled={quiz.quiz_type === "configure"}
                                  className={`w-full px-3 py-2 border ${
                                    quiz.quiz_type === "configure"
                                      ? "cursor-not-allowed bg-gray-100"
                                      : ""
                                  } rounded-md focus:ring-secondary border-border focus:border-secondary`}
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
                                  value={
                                    question.cognitive_level || "understanding"
                                  }
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
                                    <option
                                      key={level.value}
                                      value={level.value}
                                    >
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
                                    <option
                                      key={level.value}
                                      value={level.value}
                                    >
                                      {level.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {question?.addedFields?.includes("instruction") && (
                              <div className="mb-3 relative border border-border rounded-md p-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveField(index, "instruction")
                                  }
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                  title="Remove Instruction"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <label className="block text-sm font-medium text-text mb-1">
                                  Instruction
                                </label>
                                <input
                                  type="text"
                                  value={question.instructions || ""}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      index,
                                      "instructions",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                                  placeholder="Instruction text"
                                />
                              </div>
                            )}

                            {QuestionTypeComponent && (
                              <QuestionTypeComponent
                                question={question}
                                index={index}
                                handleQuestionChange={handleQuestionChange}
                                handleDropField={handleDropField}
                                handleRemoveField={handleRemoveField}
                                quiz={quiz}
                                updateQuestion={updateQuestion}
                                questions={questions}
                                setQuestions={setQuestions}
                                activeOptionEditors={activeOptionEditors}
                                setActiveOptionEditors={setActiveOptionEditors}
                                setIsOptionExpanded={setIsOptionExpanded}
                              />
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
                                    handleQuestionChange(
                                      index,
                                      "points",
                                      value
                                    );
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
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : null
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
                    );
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
                className={`flex items-center px-4 py-2 rounded-lg ${
                  saving
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
    </div>
  );
};

export default QuestionsStep;
