import { quillFormats, quillModules } from "../../lib/quillConfig";
import {  QuestionComponentProps, TrueFalseQuestion } from "../../types/quiz";
import React, { useRef } from "react";
import ReactQuill from "react-quill";

const TrueFalse = ({
  question,
  index,
  updateQuestion,
}: QuestionComponentProps) => {
    const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});
  return (
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
                checked={
                  question.answer_key?.correct_answer === (val === "true")
                }
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
            value={(question as TrueFalseQuestion).tf_feedback?.true || ""}
            onChange={(content) =>
              updateQuestion(index, {
                tf_feedback: {
                  ...(question as TrueFalseQuestion).tf_feedback,
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
            value={(question as TrueFalseQuestion).tf_feedback?.false || ""}
            onChange={(content) =>
              updateQuestion(index, {
                tf_feedback: {
                  ...(question as TrueFalseQuestion).tf_feedback,
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
  );
};

export default TrueFalse;
