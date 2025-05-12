import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Bot, User, Loader, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/NewButton';
import { ChatMessage, Form } from '../../types/aiTypes';
import { FormGenerator } from '../../services/formGenerator';
import { VoiceRecognition } from '../../services/voiceRecognition';
import { TextToSpeech } from '../../services/textToSpeech';
import FormBuilderWrapper from './FormBuilderWrapper';
import ChatSuggestions from './ChatSuggestions';
import openai from '../../lib/openai';
import { useAuth } from '../../lib/auth';

interface ChatInterfaceProps {
  onFormGenerated?: (formData: Form) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onFormGenerated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [generatedForm, setGeneratedForm] = useState<Form | null>(null);
  const [formRequirements, setFormRequirements] = useState<{
    type?: string;
    purpose?: string;
    questionFormat?: string[];
    isComplete: boolean;
  }>({
    isComplete: false
  });
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showVoiceTooltip, setShowVoiceTooltip] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeMessageShown = useRef(false);
  const { user } = useAuth();
  const voiceRecognitionRef = useRef<VoiceRecognition | null>(null);
  const textToSpeechRef = useRef<TextToSpeech | null>(null);

  // Generate welcome message on component mount
  useEffect(() => {
    const generateWelcomeMessage = async () => {
      // Prevent multiple welcome messages in development with StrictMode
      if (welcomeMessageShown.current) return;
      welcomeMessageShown.current = true;
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert form creation assistant. Welcome the user and ask them what kind of form they'd like to create. Be friendly and professional."
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        });

        // Only add the message if we don't have any messages yet
        setMessages(prev => {
          if (prev.length === 0) {
            return [{
              id: Date.now().toString(),
              role: 'assistant',
              content: completion.choices[0]?.message?.content || 
                     "Hi there! I'm here to help you create a form. What kind of form would you like to create?",
              timestamp: new Date()
            }];
          }
          return prev;
        });
      } catch (error) {
        console.error('Error generating welcome message:', error);
        // Fallback message if API call fails
        setMessages(prev => {
          if (prev.length === 0) {
            return [{
              id: Date.now().toString(),
              role: 'assistant',
              content: "Hi there! I'm here to help you create a form. What kind of form would you like to create?",
              timestamp: new Date()
            }];
          }
          return prev;
        });
      } finally {
        setIsInitializing(false);
      }
    };

    generateWelcomeMessage();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let lastFinalText = '';
    
    voiceRecognitionRef.current = new VoiceRecognition(
      (text, isFinal) => {
        if (!isMounted) return;
        
        if (isFinal) {
          lastFinalText = text;
          setInput(text);
        } else {
          // Only update with interim results if they add new information
          if (text && text !== lastFinalText) {
            setInput(text);
          }
        }
        
        if (inputRef.current) {
          inputRef.current.focus();
        }
      },
      (error) => {
        if (!isMounted) return;
        console.error('Voice recognition error:', error);
        setIsRecording(false);
      },
      (isListening) => {
        if (!isMounted) return;
        if (!isListening) {
          lastFinalText = '';
        } else {
          setInput('');
        }
        setIsRecording(isListening);
        setShowVoiceTooltip(isListening);
      }
    );

    textToSpeechRef.current = new TextToSpeech();

    return () => {
      isMounted = false;
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stop();
      }
      if (textToSpeechRef.current) {
        textToSpeechRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.toggle();
    }
  };

  const toggleSpeaking = (message: ChatMessage) => {
    if (!textToSpeechRef.current) return;

    if (speakingMessageId === message.id) {
      textToSpeechRef.current.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    if (isSpeaking) {
      textToSpeechRef.current.stop();
    }

    textToSpeechRef.current.speak(
      message.content,
      () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
    );
    
    setIsSpeaking(true);
    setSpeakingMessageId(message.id);
  };

  const generateFormFromChat = async (formData: any) => {
    try {
      // Map the form data from the AI to our form structure
      const generatedForm: Form = {
        id: crypto.randomUUID(),
        title: formData.title || 'Untitled Form',
        description: formData.description || '',
        type: formData.type,
        tier: 'capture', // Default tier, can be enhanced based on form type
        evaluation_mode: 'none',
        questions: formData.questions.map((q: any, index: number) => ({
          id: crypto.randomUUID(),
          type: q.type,
          label: q.label,
          required: q.required !== false, // Default to true if not specified
          options: q.options || [],
          order: index,
          logic: []
        })),
        settings: {
          requireIdentity: false,
          enableBranching: false,
          enableScoring: false,
          enableAI: true,
          enableVoice: true,
          enableWebhooks: false
        },
        analytics: {
          views: 0,
          submissions: 0,
          completionRate: 0
        },
        created_at: new Date(),
        updated_at: new Date(),
        is_template: false,
        sharing_enabled: false,
        share_link: ''
      };
      
      if (user) {
        const formWithUser = {
          ...generatedForm,
          user_id: user.id,
          sharing_enabled: false,
          is_template: false
        };
        
        setGeneratedForm(formWithUser);
        if (onFormGenerated) {
          onFormGenerated(formWithUser);
        }

        return formWithUser;
      }
    } catch (error) {
      console.error('Error generating form:', error);
      return null;
    }
  };

  const simulateAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      // First, analyze the user's message to understand the form requirements
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert form creation assistant. Your goal is to help users create forms by analyzing their request and generating a complete form in one go.
            
            Follow these steps:
            1. Analyze the user's message to understand:
               - Type of form (e.g., contact form, survey, quiz, feedback form, registration, application, order form)
               - Purpose and subject of the form
               - Any specific requirements or preferences mentioned
               
            2. Generate a complete form with appropriate fields based on the analysis
            
            Be concise but thorough in your response.`
          },
          ...messages.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          })),
          {
            role: "user",
            content: userMessage
          }
        ],
        functions: [
          {
            name: "generate_complete_form",
            description: "Generate a complete form based on the user's request",
            parameters: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  description: "Type of form (e.g., contact, survey, quiz, feedback, registration, application, order)",
                  enum: ["contact", "survey", "quiz", "feedback", "registration", "application", "order", "event", "membership", "donation"]
                },
                title: {
                  type: "string",
                  description: "Title of the form"
                },
                description: {
                  type: "string",
                  description: "Detailed description of the form's purpose"
                },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["short-text", "long-text", "email", "phone", "number", "date", "time", "datetime", "multiple-choice", "checkbox", "dropdown", "rating", "file-upload", "signature"]
                      },
                      label: {
                        type: "string"
                      },
                      required: {
                        type: "boolean",
                        default: true
                      },
                      options: {
                        type: "array",
                        items: {
                          type: "string"
                        }
                      },
                      description: {
                        type: "string"
                      }
                    },
                    required: ["type", "label"]
                  }
                }
              },
              required: ["type", "title", "questions"]
            }
          }
        ],
        // function_call: { name: "generate_complete_form" }
      });

      const responseMessage = completion.choices[0].message;
      
      // If we got a function call, process the form generation
      if (responseMessage.function_call && responseMessage.function_call.name === 'generate_complete_form') {
        const functionArgs = JSON.parse(responseMessage.function_call.arguments);
        
        // Generate the form with the collected information
        const form = await generateFormFromChat(functionArgs);
        if (form) {
          const successMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `I've created a "${form.title}" form based on your request. It includes ${form.questions.length} questions. You can now customize it in the Form Editor or use it as is.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, successMessage]);
          setShowSuggestions(true);
          return;
        }
      }
      
      // If we get here, either no function was called or form generation failed
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseMessage.content || "I'll help you create your form. Could you provide more details about what you need?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error in AI response:', error);
      
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I encountered an error while processing your request. Could you try again with more details about the form you'd like to create?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false); // Hide suggestions when user sends a message
    
    simulateAIResponse(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (generatedForm) {
    return (
      <FormBuilderWrapper 
        initialForm={generatedForm} 
        onBack={() => setGeneratedForm(null)} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center"
      >
        <div className="flex items-center">
          <Bot className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-medium">Form Creation Assistant</h3>
        </div>
        <div className="flex items-center">
          <Sparkles className="h-4 w-4 text-blue-600 mr-1" />
          <span className="text-xs text-gray-500">AI-Powered</span>
        </div>
      </motion.div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div 
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-4 ${
                message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
              }`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-gray-200 text-gray-800 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${message.role === 'user' ? 'text-blue-100' : 'text-gray-600'}`}>
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => toggleSpeaking(message)}
                      className="p-1 rounded-full text-gray-600 hover:bg-gray-300"
                    >
                      {speakingMessageId === message.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className={`text-xs mt-1 text-right ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <AnimatePresence>
          {isLoading && !isInitializing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start mb-4"
            >
              <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-tl-none max-w-[80%] p-3">
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messageEndRef} />
      </div>
      
      {showSuggestions && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
        <ChatSuggestions 
          onSuggestionClick={handleSuggestionClick} 
          messages={messages}
          currentFormType={formRequirements.type}
        />
      )}
      
      <div className="p-3 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isRecording 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <AnimatePresence>
              {showVoiceTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap"
                >
                  Listening...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message or use voice input..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
            disabled={isLoading}
          />
          
          <Button
            type="submit"
            variant="primary"
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center transition-transform duration-200 hover:scale-105"
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;