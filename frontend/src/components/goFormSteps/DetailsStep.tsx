import { validateQuiz } from "../../lib/quiz";
import { useTheme } from "../../lib/theme";
import { showToast } from "../../lib/toast";
import { Question, Quiz, QUIZ_CATEGORIES } from "../../types/quiz";
import { ChevronDown, ChevronUp, Loader, Save, Settings } from "lucide-react";
import React from "react";

const DetailsStep = ({
  quiz,
  handleQuizChange,
  handleSave,
  saving,
  id,
  setQuestions,
  setExpandedQuestion,
  questionTypes,
  expandedSettings,
  setExpandedSettings,
  setActiveStep,
}: {
  quiz: Quiz;
  handleQuizChange: (key: keyof Quiz, value: any) => void;
  handleSave: () => void;
  saving: boolean;
  id: string | null;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setExpandedQuestion: React.Dispatch<React.SetStateAction<number | null>>;
  questionTypes: any[];
  expandedSettings: boolean;
  setExpandedSettings: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveStep: React.Dispatch<React.SetStateAction<"configure" | "questions" | "details" | "publish">>;
}) => {
  const { setQuizQuestionType } = useTheme();

  const handleContinueToDetails = async () => {
    const errors = await validateQuiz(quiz);
    if (errors.length > 0) {
      showToast(errors[0], "error");
      return;
    }
    setActiveStep("questions");
  };

  return (
    <div className="bg-background rounded-lg shadow-md p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text mb-4">GoForm Details</h2>

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
              onChange={(e) => handleQuizChange("description", e.target.value)}
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
                onChange={(e) => handleQuizChange("category", e.target.value)}
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
            {quiz.quiz_type === "configure" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-1">
                  Question Type
                </label>
                <select
                  value={quiz.quiz_question_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    handleQuizChange("quiz_question_type", newType);
                    setQuizQuestionType(newType);

                    setQuestions([]);
                    setExpandedQuestion(null);
                  }}
                  disabled={quiz.quiz_type === "configure" && !!id}
                  className={`w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary ${
                    quiz.quiz_type === "configure" && !!id
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
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
          {quiz.quiz_type === "configure" && (
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  No. of Questions
                </label>
                <input
                  type="number"
                  value={quiz.question_count || 10}
                  onChange={(e) =>
                    handleQuizChange("question_count", parseInt(e.target.value))
                  }
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
                  onChange={(e) =>
                    handleQuizChange("quiz_score", parseInt(e.target.value))
                  }
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
          className={`flex items-center px-6 py-3 rounded-lg ${
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
          onClick={handleContinueToDetails}
          className="flex items-center px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary"
        >
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default DetailsStep;
