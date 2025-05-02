import { quillFormats, quillModules } from "../../lib/quillConfig";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import ReactQuill from "react-quill";
import { QuestionComponentProps } from "../../types/quiz";

const Matching = ({
  question,
  index,
  questions,
  setQuestions,
}: QuestionComponentProps) => {
    
    
  function addMatchingPair(questionIndex: number) {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ("matching_pairs" in question) {
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

    if ("matching_pairs" in question) {
      newQuestions[questionIndex] = {
        ...question,
        matching_pairs: updatedPairs,
      };
      setQuestions(newQuestions);
    } else {
      console.warn("This question type does not support matching pairs.");
    }
  }


  return (
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

      {question.type === "matching" &&
        question.matching_pairs?.map((pair, pairIndex) => (
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
                This rich content will be displayed in the PDF report for this
                matching pair.
              </p>
            </div>
          </div>
        ))}
      {question.type === "matching" &&
        question.matching_pairs?.length !== 0 && (
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
  );
};

export default Matching;
