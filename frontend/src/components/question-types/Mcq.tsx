import { quillFormats, quillModules } from "../../lib/quillConfig";
import { showToast } from "../../lib/toast";
import { Option, QuestionComponentProps } from "../../types/quiz";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import React from "react";
import ReactQuill from "react-quill";

const Mcq = ({
  questions,
  setQuestions,
  activeOptionEditors,
  setActiveOptionEditors,
  index,
  setIsOptionExpanded,
  question,
  handleDropField,
  handleRemoveField,
  quiz
}: QuestionComponentProps) => {
  const handleAddOption = (questionIndex: number) => {
    setIsOptionExpanded(true);
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ("options" in question) {
      const options = question.options || [];

      const newOption: Option = {
        id: `temp-${Date.now()}-${options.length}`,
        question_id: question.id,
        text: "",
        score: 0,
        feedback: "",
        order: options.length,
        is_correct: false,
      };

      question.options = [...options, newOption];
      newQuestions[questionIndex] = question;
      setQuestions(newQuestions);

      // Set this option's editor as active
      setActiveOptionEditors((prev) => ({
        ...prev,
        [`${questionIndex}-${options.length}`]: true,
      }));
    } else {
      console.warn("This question type does not support options.");
    }
  };

  const toggleOptionEditor = (
    index: number,
    optionIndex: number,
    isExpanded: boolean
  ) => {
    setIsOptionExpanded(!isExpanded);
    const editorKey : any = `${index}-${optionIndex}`;
    setActiveOptionEditors((prevState) => ({
      ...prevState,
      [editorKey]: !prevState[editorKey],
    }));
  };

  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];

    if ("options" in question) {
      const options = [...(question.options || [])];
      options.splice(optionIndex, 1);

      // Update order for remaining options
      const updatedOptions = options.map((o, i) => ({
        ...o,
        order: i,
      }));

      question.options = updatedOptions;
      newQuestions[questionIndex] = question;
      setQuestions(newQuestions);

      // Remove this option's editor from active editors
      const editorKey : any = `${questionIndex}-${optionIndex}`;
      const newActiveEditors = { ...activeOptionEditors };
      delete newActiveEditors[editorKey];
      setActiveOptionEditors(newActiveEditors);
    } else {
      console.warn("This question type does not support options.");
    }
  };

  const handleOptionChange = (
      questionIndex: number,
      optionIndex: number,
      field: keyof Option,
      value: any
    ) => {
      const newQuestions = [...questions];
      const question = newQuestions[questionIndex];
  
      if ("options" in question) {
        const options = [...(question.options || [])];
        options[optionIndex] = {
          ...options[optionIndex],
          [field]: value,
        };
  
        question.options = options;
        newQuestions[questionIndex] = question;
        setQuestions(newQuestions);
      } else {
        console.warn("This question type does not support options.");
      }
    };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-text">Options</label>
        <button
          onClick={() => handleAddOption(index)}
          className="text-sm text-secondary hover:text-primary"
        >
          + Add Option
        </button>
      </div>

      <div className="space-y-4">
        {question.type === "multiple_choice" &&
          question.options?.map((option, optionIndex) => {
            const editorKey : any = `${index}-${optionIndex}`;
            const isExpanded = activeOptionEditors[editorKey];
            return (
              <div
                key={option.id}
                className="border border-border rounded-lg p-4 mb-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropField(e, index, optionIndex)}
              >
                {/* Always visible summary line */}
                <div className="flex items-center">
                  <div
                    onClick={() =>
                      toggleOptionEditor(index, optionIndex, isExpanded)
                    }
                    className="cursor-pointer flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        Option {optionIndex + 1}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <button
                        className="p-1.5 text-gray-500 hover:text-text mr-1"
                        title={
                          isExpanded
                            ? "Collapse option editor"
                            : "Expand option editor"
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteOption(index, optionIndex)}
                    className="p-1.5 text-red-500 hover:text-red-700"
                    title="Delete option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Conditionally render editor section */}
                {isExpanded && (
                  <div className="mt-4">
                    {option.addedFields?.includes("is_correct") && (
                      <div className="mb-3 relative border border-border rounded-md p-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveField(index, "is_correct", optionIndex)
                          }
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Remove Is Correct"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <label className="block text-sm font-medium text-text mb-1">
                          Is Correct
                        </label>
                        <input
                          type="checkbox"
                          checked={option.is_correct || false}
                          onChange={(e) =>
                            handleOptionChange(
                              index,
                              optionIndex,
                              "is_correct",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-text mb-1">
                        Option Text
                      </label>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            optionIndex,
                            "text",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                        placeholder="Option text"
                      />
                    </div>

                    {option.addedFields?.includes("score") && (
                      <div className="mb-3 relative">
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveField(index, "score", optionIndex)
                          }
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Remove Score"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <label className="block text-sm font-medium text-text mb-1">
                          Score
                        </label>
                        <input
                          type="number"
                          value={option.score}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;

                            if (
                              quiz.quiz_type === "configure" &&
                              value > (question.points ?? 0)
                            ) {
                              showToast(
                                `Score can't be greater than the question's total points`,
                                "error"
                              );
                              return;
                            }

                            handleOptionChange(
                              index,
                              optionIndex,
                              "score",
                              value
                            );
                          }}
                          className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                          placeholder="Score"
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-text mb-1">
                        Feedback (Rich Content)
                      </label>
                      <ReactQuill
                        value={option.feedback || ""}
                        onChange={(content) =>
                          handleOptionChange(
                            index,
                            optionIndex,
                            "feedback",
                            content
                          )
                        }
                        theme="snow"
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Enter feedback for this option..."
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {question.type === "multiple_choice" &&
        (!question.options || question.options.length === 0) ? (
          <button
            onClick={() => handleAddOption(index)}
            className="w-full py-2 border-2 border-dashed border-secondary rounded-lg text-gray-500 hover:text-text"
          >
            + Add Option
          </button>
        ) : (
          <button
            onClick={() => handleAddOption(index)}
            className="py-2 px-4 border-2 border-dashed border-secondary rounded-md text-secondary mx-auto flex items-center"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-2">Add Option</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Mcq;
