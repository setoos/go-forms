import { Quiz } from "@/types/quiz";
import { Loader, Save } from "lucide-react";
import React from "react";

const PublishStep = ({
  quiz,
  handleQuizChange,
  handleSave,
  saving,
}: {
  quiz: Quiz;
  handleQuizChange: (key: keyof Quiz, value: any) => void;
  handleSave: () => void;
  saving: boolean;
}) => {
  return (
    <div className="bg-background rounded-lg shadow-md p-6 mb-8">
      <label className="block text-sm font-medium text-text mb-1">Status</label>
      <div className="flex items-center space-x-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={quiz.is_published}
            onChange={(e) => handleQuizChange("is_published", e.target.checked)}
            className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
          />
          <span className="ml-2 text-sm text-text">Published</span>
        </label>
      </div>
      <div className="flex items-center gap-2 mt-5 justify-end">
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
      </div>
    </div>
  );
};

export default PublishStep;
