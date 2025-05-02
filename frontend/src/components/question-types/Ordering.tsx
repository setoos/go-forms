import { quillFormats, quillModules } from "../../lib/quillConfig";
import { QuestionComponentProps } from "../../types/quiz";
import { Plus, Trash2 } from "lucide-react";
import React, { useRef } from "react";
import ReactQuill from "react-quill";

const Ordering = ({
  question,
  questions,
  index,
  setQuestions,
}: QuestionComponentProps) => {
  const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});

  function addOrderingItem(questionIndex: number) {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ("ordering_items" in question) {
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
  return (
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

      {question.type === "ordering" &&
        question.ordering_items?.map((item, itemIndex) => (
          <div key={itemIndex} className="space-y-3 border p-4 rounded-md">
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

                  if (
                    "ordering_items" in currentQuestion &&
                    currentQuestion.ordering_items
                  ) {
                    currentQuestion.ordering_items[itemIndex].item =
                      e.target.value;
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
                    ? question.ordering_items?.[itemIndex]?.correct_position ||
                      0
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
                    currentQuestion.ordering_items[itemIndex].correct_position =
                      updatedPosition;
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
                  quillRefs.current[`ordering-${index}-${itemIndex}`] = el;
                }}
                value={item.feedback || ""}
                onChange={(content) => {
                  const newQuestions = [...questions];
                  const currentQuestion = newQuestions[index];

                  if (
                    currentQuestion.type === "ordering" &&
                    Array.isArray(currentQuestion.ordering_items)
                  ) {
                    currentQuestion.ordering_items[itemIndex].feedback =
                      content;
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
                This feedback will appear in the PDF for this ordering item.
              </p>
            </div>
          </div>
        ))}
      {question.type === "ordering" &&
        question.ordering_items?.length !== 0 && (
          <button
            onClick={() => addOrderingItem(index)}
            className="text-secondary hover:text-primary flex items-center gap-2 mx-auto border border-secondary rounded-md px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            <span className="text-secondary">Add Item</span>
          </button>
        )}
    </div>
  );
};

export default Ordering;
