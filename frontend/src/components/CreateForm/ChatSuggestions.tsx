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
      setIsLoading(true);
      
      try {
        const recentMessages = messages.slice(-4);
        const context = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

        // Call OpenAI to generate dynamic suggestions
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an AI form building expert that suggests relevant actions for form creation and modification.
              ${messages.length === 0 ? 'Suggest initial form creation ideas.' : 'Based on the conversation context, suggest relevant next steps.'}
              Suggestions should be concise (max 8 words), natural, and actionable.
              Focus on form structure, fields, validation, and user experience.
              Consider the form type if specified: ${currentFormType || 'not specified'}`
            },
            {
              role: 'user',
              content: messages.length === 0 
                ? 'Suggest 4 creative ways to start building a form:'
                : `Recent conversation:\n${context}\n\nSuggest 4 relevant next steps:`
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
        console.error('Error generating primary suggestions:', error);
        // Try with a simpler model and prompt as backup
        try {
          const backupPrompt = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a form building assistant. Generate 4 suggestions for ${currentFormType || 'form'} creation.`
              },
              {
                role: 'user',
                content: 'What are the next steps for building this form?'
              }
            ],
            temperature: 0.5,
            max_tokens: 100,
          });

          const backupContent = backupPrompt.choices[0]?.message?.content;
          if (backupContent) {
            const backupSuggestions = backupContent
              .split('\n')
              .map(s => s.replace(/^\d+[.)]\s*/, '').trim())
              .filter(s => s.length > 0)
              .slice(0, 4);
            setSuggestions(backupSuggestions);
          } else {
            setSuggestions([]);
          }
        } catch (backupError) {
          console.error('Error generating backup suggestions:', backupError);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    generateSuggestions();
  }, [messages, currentFormType]);

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