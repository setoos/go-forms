import React, { useEffect, useState } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types/aiTypes';
import openai from '../../lib/openai';

interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  messages: ChatMessage[];
  currentFormType?: string;
}

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ 
  onSuggestionClick, 
  messages,
  currentFormType 
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generateSuggestions = async () => {
      if (messages.length === 0) return;

      setIsLoading(true);
      
      try {
        // Extract the last few messages for context
        const recentMessages = messages.slice(-4);
        const context = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

        // Call OpenAI to generate dynamic suggestions
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that suggests relevant follow-up messages for a form builder conversation. 
              Based on the conversation context, suggest 4 concise and natural follow-up messages that a user might want to send next.
              Keep suggestions short (max 10 words) and focused on form creation or modification.`
            },
            {
              role: 'user',
              content: `Conversation context (most recent messages first):\n${context}\n\nCurrent form type: ${currentFormType || 'not specified'}\n\nPlease suggest 4 relevant follow-up messages:`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          // Parse the response to extract suggestions (one per line, remove numbering)
          const generated = content
            .split('\n')
            .map(s => s
              .replace(/^\d+[\.\)]\s*/, '')
              .replace(/^['"](.*)['"]$/, '$1')
              .trim()
            )
            .filter(s => s.length > 0)
            .slice(0, 4);
          
          setSuggestions(generated);
        }
      } catch (error) {
        console.error('Error generating suggestions:', error);
        // Fallback to default suggestions if API call fails
        setSuggestions(getFallbackSuggestions());
      } finally {
        setIsLoading(false);
      }
    };

    // Only generate suggestions if there's enough conversation history
    if (messages.length > 0) {
      generateSuggestions();
    } else {
      setSuggestions(getFallbackSuggestions());
    }
  }, [messages, currentFormType]);

  const getFallbackSuggestions = (): string[] => {
    if (!currentFormType) {
      return [
        "Create a contact form for my website",
        "I need a customer satisfaction survey",
        "Make a quiz about digital marketing",
        "Build an employee skills assessment"
      ];
    }

    const type = currentFormType.toLowerCase();
    if (type.includes('contact')) {
      return [
        "Add a phone number field",
        "Include a message box",
        "Make email required",
        "Add a company name field"
      ];
    } else if (type.includes('survey')) {
      return [
        "Add a rating scale question",
        "Include a multiple choice question",
        "Add an open-ended feedback section",
        "Make it anonymous"
      ];
    } else if (type.includes('quiz')) {
      return [
        "Add multiple choice questions",
        "Include a time limit",
        "Show score at the end",
        "Add explanation for wrong answers"
      ];
    } else if (type.includes('assessment')) {
      return [
        "Add skill rating questions",
        "Include open-ended responses",
        "Enable AI evaluation",
        "Add performance criteria"
      ];
    }

    return [
      "What fields should I include?",
      "How should I structure this form?",
      "What's the main goal of this form?",
      "Who is the target audience?"
    ];
  };

  return (
    <div className="p-3 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <Lightbulb size={16} className="mr-1 text-yellow-500" />
        <span>Suggested prompts:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <div className="flex items-center text-sm text-gray-500">
            <Sparkles size={14} className="mr-1 animate-pulse" />
            Generating suggestions...
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="text-sm px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSuggestions;