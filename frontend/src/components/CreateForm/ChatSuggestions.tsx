import React from 'react';
import { Lightbulb } from 'lucide-react';

interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  currentContext?: string;
}

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ onSuggestionClick, currentContext }) => {
  // Base suggestions for different form types
  const suggestions = {
    initial: [
      "Create a contact form for my website",
      "I need a customer satisfaction survey",
      "Make a quiz about digital marketing",
      "Build an employee skills assessment"
    ],
    contact: [
      "Add a phone number field",
      "Include a message box",
      "Make email required",
      "Add a company name field"
    ],
    survey: [
      "Add a rating scale question",
      "Include a multiple choice question",
      "Add an open-ended feedback section",
      "Make it anonymous"
    ],
    quiz: [
      "Add multiple choice questions",
      "Include a time limit",
      "Show score at the end",
      "Add explanation for wrong answers"
    ],
    assessment: [
      "Add skill rating questions",
      "Include open-ended responses",
      "Enable AI evaluation",
      "Add performance criteria"
    ]
  };

  // Determine which suggestions to show based on context
  const getSuggestions = () => {
    if (!currentContext) return suggestions.initial;
    
    if (currentContext.toLowerCase().includes('contact')) return suggestions.contact;
    if (currentContext.toLowerCase().includes('survey')) return suggestions.survey;
    if (currentContext.toLowerCase().includes('quiz')) return suggestions.quiz;
    if (currentContext.toLowerCase().includes('assessment')) return suggestions.assessment;
    
    return suggestions.initial;
  };

  return (
    <div className="p-3 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <Lightbulb size={16} className="mr-1 text-yellow-500" />
        <span>Suggested prompts:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {getSuggestions().map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="text-sm px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSuggestions;