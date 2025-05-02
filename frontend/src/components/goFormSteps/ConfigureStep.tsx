import { Quiz } from "@/types/quiz";
import { Brush, LayoutTemplate, SlidersHorizontal } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const ConfigureStep = ({
  setActiveStep,
  handleQuizChange,
  setQuizType,
}: {
  setActiveStep: React.Dispatch<
    React.SetStateAction<"configure" | "questions" | "details" | "publish">
  >;
  handleQuizChange: (key: keyof Quiz, value: any) => void;
  setQuizType: (type: string) => void;
}) => {
  const navigate = useNavigate();

  const handleTemplateClick = () => {
    localStorage.setItem("quiz_type", "template");
    navigate("/templates/library");
  };

  const handleConfigureClick = () => {
    setActiveStep("details");
    handleQuizChange("quiz_type", "configure");
    handleQuizChange("quiz_question_type", "multiple_choice");
    handleQuizChange("question_count", 10);
    handleQuizChange("quiz_score", 100);
    setQuizType("configure");
  };

  const handleCustomizeClick = () => {
    setActiveStep("details");
    handleQuizChange("quiz_type", "customize");
  };

  return (
    <div className="bg-background rounded-lg shadow-md px-6 py-10 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Use Template Card */}
        <div
          onClick={() => handleTemplateClick()}
          className="bg-white rounded-2xl shadow hover:shadow-lg transition duration-300 border border-accent cursor-pointer px-6 py-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <LayoutTemplate className="text-primary w-5 h-5" />
            <h3 className="text-xl font-semibold text-gray-800">
              Use Template
            </h3>
          </div>
          <p className="text-gray-600 text-sm">
            Choose from pre-made templates to kickstart your setup quickly and
            efficiently.
          </p>
        </div>

        {/* Configure Card */}
        <div
          onClick={() => handleConfigureClick()}
          className="bg-white rounded-2xl shadow hover:shadow-lg transition duration-300 border border-accent cursor-pointer px-6 py-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="text-primary w-5 h-5" />
            <h3 className="text-xl font-semibold text-gray-800">Configure</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Set up the details and options to tailor the experience for your
            needs.
          </p>
        </div>

        {/* Customize Card */}
        <div
          onClick={() => handleCustomizeClick()}
          className="bg-white rounded-2xl shadow hover:shadow-lg transition duration-300 border border-accent cursor-pointer px-6 py-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Brush className="text-primary w-5 h-5" />
            <h3 className="text-xl font-semibold text-gray-800">Customize</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Personalize the interface and behavior to match your unique
            preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigureStep;
