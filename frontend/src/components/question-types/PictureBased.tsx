import { quillFormats, quillModules } from "../../lib/quillConfig";
import { QuestionComponentProps } from "../../types/quiz";
import React, { useRef } from "react";
import ReactQuill from "react-quill";

const PictureBased = ({
  index,
  question,
  updateQuestion,
}: QuestionComponentProps) => {
  const quillRefs = useRef<{ [key: string]: ReactQuill | null }>({});

  return (
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
            updateQuestion(index, {
              feedback: content,
            })
          }
          placeholder="Enter rich feedback content for this image-based question..."
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

export default PictureBased;
