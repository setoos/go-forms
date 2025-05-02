import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings, Code, Eye, Wand2 } from 'lucide-react';
import { Question } from '../../types/aiTypes';
import Input from '../ui/NewInput';
import Button from '../ui/NewButton';

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updatedQuestion: Question) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onUpdate }) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showHtml, setShowHtml] = useState(false);

  const handleContentChange = (content: string) => {
    onUpdate({
      ...question,
      label: content
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    newOptions[index] = value;
    onUpdate({
      ...question,
      options: newOptions
    });
  };

  const handleAIPromptChange = (prompt: string) => {
    onUpdate({
      ...question,
      ai_prompt: prompt
    });
  };

  const renderWYSIWYGEditor = () => {
    if (showHtml) {
      return (
        <textarea
          value={question.label}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-32 p-2 border border-gray-300 rounded-lg font-mono text-sm"
        />
      );
    }

    return (
      <div className="border border-gray-300 rounded-lg">
        <div className="flex flex-wrap items-center border-b border-gray-300 p-2 bg-gray-50 gap-1">
          <button
            onClick={() => document.execCommand('bold')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => document.execCommand('italic')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => document.execCommand('underline')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Underline"
          >
            <u>U</u>
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <button
            onClick={() => document.execCommand('formatBlock', false, 'h2')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Heading"
          >
            H
          </button>
          <button
            onClick={() => document.execCommand('insertUnorderedList')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => document.execCommand('insertOrderedList')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Numbered List"
          >
            1. List
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <button
            onClick={() => document.execCommand('justifyLeft')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Align Left"
          >
            ←
          </button>
          <button
            onClick={() => document.execCommand('justifyCenter')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Align Center"
          >
            ↔
          </button>
          <button
            onClick={() => document.execCommand('justifyRight')}
            className="p-1.5 hover:bg-gray-200 rounded"
            type="button"
            title="Align Right"
          >
            →
          </button>
        </div>
        <div
          contentEditable
          dangerouslySetInnerHTML={{ __html: question.label }}
          onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
          className="p-2 min-h-[100px] focus:outline-none"
        />
      </div>
    );
  };

  const renderPreview = () => {
    switch (question.type) {
      case 'short-text':
        return (
          <input
            type="text"
            placeholder="Short answer text"
            className="w-full p-2 border border-gray-300 rounded-lg"
            disabled
          />
        );
      case 'long-text':
        return (
          <textarea
            placeholder="Long answer text"
            className="w-full p-2 border border-gray-300 rounded-lg"
            rows={4}
            disabled
          />
        );
      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  name={`preview-${question.id}`}
                  disabled
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">{option}</span>
              </div>
            ))}
          </div>
        );
      default:
        return <div>Preview not available for this question type</div>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={showHtml ? <Eye size={14} /> : <Code size={14} />}
            onClick={() => setShowHtml(!showHtml)}
          >
            {showHtml ? 'Visual Editor' : 'HTML Editor'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={isPreviewMode ? <Settings size={14} /> : <Eye size={14} />}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {isPreviewMode ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="mb-4">
            <div
              dangerouslySetInnerHTML={{ __html: question.label }}
              className="text-gray-900 mb-2"
            />
            {question.required && (
              <span className="text-red-500 text-sm">* Required</span>
            )}
          </div>
          {renderPreview()}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              {renderWYSIWYGEditor()}
            </div>

            {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options
                </label>
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        fullWidth
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = question.options?.filter((_, i) => i !== index);
                          onUpdate({ ...question, options: newOptions });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                      onUpdate({ ...question, options: newOptions });
                    }}
                  >
                    Add Option
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span className="ml-1">Advanced Settings</span>
            </button>

            {isAdvancedOpen && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => onUpdate({ ...question, required: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required field</span>
                  </label>
                </div>

                {question.type === 'multiple-choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer
                    </label>
                    <select
                      value={question.correct_answer as string}
                      onChange={(e) => onUpdate({ ...question, correct_answer: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">No correct answer</option>
                      {question.options?.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Evaluation Prompt
                  </label>
                  <div className="relative">
                    <textarea
                      value={question.ai_prompt || ''}
                      onChange={(e) => handleAIPromptChange(e.target.value)}
                      placeholder="Enter instructions for AI evaluation..."
                      className="w-full p-2 pr-8 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                    <Wand2
                      size={16}
                      className="absolute right-2 top-2 text-purple-500"
                    />
                  </div>
                </div>

                {question.ai_prompt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Score
                    </label>
                    <input
                      type="number"
                      value={question.max_score || 0}
                      onChange={(e) => onUpdate({ ...question, max_score: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="0"
                      max="100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Answer
                  </label>
                  <textarea
                    value={question.sample_answer || ''}
                    onChange={(e) => onUpdate({ ...question, sample_answer: e.target.value })}
                    placeholder="Enter a sample or ideal answer..."
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionEditor;