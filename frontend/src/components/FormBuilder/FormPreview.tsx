import React from 'react';
import { Form, Question } from '../../types/aiTypes';
import { motion } from 'framer-motion';

interface FormPreviewProps {
  form: Form;
}

const FormPreview: React.FC<FormPreviewProps> = ({ form }) => {
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'short-text':
        return (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Short answer text"
          />
        );
      
      case 'long-text':
        return (
          <textarea
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Long answer text"
          />
        );
      
      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  id={`option-${question.id}-${index}`}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor={`option-${question.id}-${index}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`option-${question.id}-${index}`}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`option-${question.id}-${index}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      
      case 'dropdown':
        return (
          <select
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an option</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'rating-scale':
        return (
          <div className="flex space-x-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <button
                key={index}
                className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {index + 1}
              </button>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
          {form.description && (
            <p className="mt-2 text-gray-600">{form.description}</p>
          )}
        </div>

        <div className="p-6 space-y-6">
          {form.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900">
                    {question.label}
                  </label>
                  {question.required && (
                    <span className="text-red-500 text-sm">*</span>
                  )}
                </div>
              </div>
              <div>{renderQuestion(question)}</div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FormPreview;