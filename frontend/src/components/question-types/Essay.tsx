import { quillFormats, quillModules } from "../../lib/quillConfig";
import { QuestionComponentProps } from "../../types/quiz";
import { Plus, Trash2 } from "lucide-react";
import React, { useRef } from "react";
import ReactQuill from "react-quill";

const Essay = ({
  question,
  questions,
  index,
  setQuestions,
}: QuestionComponentProps) => {
  const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});

  function addEssayRubric(questionIndex: number) {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ("essay_rubrics" in question) {
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
  return (
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

      {question.type === "essay" &&
        question.essay_rubrics?.map((rubric, rubricIndex) => (
          <div key={rubricIndex} className="space-y-3 border p-4 rounded-md">
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
                    currentQuestion.essay_rubrics[rubricIndex].criteria =
                      e.target.value;
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
                    currentQuestion.essay_rubrics[rubricIndex].description =
                      e.target.value;
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
                    currentQuestion.essay_rubrics[rubricIndex].max_points =
                      parseInt(e.target.value, 10);
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
                  quillRefs.current[`essay-${index}-${rubricIndex}`] = el;
                }}
                value={rubric.feedback || ""}
                onChange={(content) => {
                  const newQuestions = [...questions];
                  const currentQuestion = newQuestions[index];

                  if (
                    currentQuestion.type === "essay" &&
                    Array.isArray(currentQuestion.essay_rubrics)
                  ) {
                    currentQuestion.essay_rubrics[rubricIndex].feedback =
                      content;
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
                This rich content will appear in the essay grading report.
              </p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Essay;
