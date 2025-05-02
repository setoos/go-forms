import { quillFormats, quillModules } from "../../lib/quillConfig";
import { QuestionComponentProps } from "../../types/quiz";
import React, { useRef } from "react";
import ReactQuill from "react-quill";

const CompleteStatement = ({
  index,
  question,
  updateQuestion,
}: QuestionComponentProps) => {
  const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feedback (Rich Content)
        </label>

        <ReactQuill
          ref={(el) => {
            if (el) {
              quillRefs.current[`complete-statement-${index}`] = el;
            }
          }}
          value={question.feedback || ""}
          onChange={(content) =>
            updateQuestion(index, {
              feedback: content,
            })
          }
          placeholder="Enter rich feedback content for this complete statement question..."
          theme="snow"
          className="mb-2"
          modules={quillModules}
          formats={quillFormats}
        />

        <p className="text-xs text-gray-500">
          This feedback will be shown in the PDF when this question is answered.
        </p>
      </div>
    </div>
  );
};

export default CompleteStatement;
