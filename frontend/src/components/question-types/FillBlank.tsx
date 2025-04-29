import { quillFormats, quillModules } from "../../lib/quillConfig";
import { QuestionComponentProps } from "../../types/quiz";
import React, { useRef } from "react";
import ReactQuill from "react-quill";

const FillBlank = ({
  question,
  index,
  updateQuestion,
}: QuestionComponentProps) => {
  const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});
  return (
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
  );
};

export default FillBlank;
