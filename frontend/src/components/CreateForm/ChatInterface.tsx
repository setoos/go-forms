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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi there! I'm your form creation assistant. Tell me what kind of form you want to create, and I'll help you build it step by step. You can type or use voice input - just click the microphone icon and speak.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<Form | null>(null);
  const [currentContext, setCurrentContext] = useState<string>('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showVoiceTooltip, setShowVoiceTooltip] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const voiceRecognitionRef = useRef<VoiceRecognition | null>(null);
  const textToSpeechRef = useRef<TextToSpeech | null>(null);

  useEffect(() => {
    voiceRecognitionRef.current = new VoiceRecognition(
      (text) => {
        setInput((prev) => prev + ' ' + text);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      },
      (error) => {
        console.error('Voice recognition error:', error);
        setIsRecording(false);
      },
      (isListening) => {
        setIsRecording(isListening);
        setShowVoiceTooltip(isListening);
      }
    );

    textToSpeechRef.current = new TextToSpeech();

    return () => {
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

  const generateFormFromChat = async (userMessage: string) => {
    try {
      const generatedForm = await FormGenerator.generateForm(userMessage);
      
      if (user) {
        const formData = {
          ...generatedForm,
          user_id: user.id,
          sharing_enabled: false,
          is_template: false
        };
        
        setGeneratedForm(formData);
        if (onFormGenerated) {
          onFormGenerated(formData);
        }

        return formData;
      }
    } catch (error) {
      console.error('Error generating form:', error);
      return null;
    }
  };

  const simulateAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    setCurrentContext(userMessage);
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful form creation assistant. Keep responses concise and focused on form creation."
          },
          ...messages.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          })),
          {
            role: "user",
            content: userMessage
          }
        ]
      });

      const aiResponse = completion.choices[0].message.content || "I'll help you create your form. Could you provide more details about what you need?";
      
      const form = await generateFormFromChat(userMessage);
      
      let response = aiResponse;
      if (form) {
        response += `\n\nI've created a ${form.type} form based on your request. It includes ${form.questions.length} questions to start with. You can now customize it in the Form Editor or use it as is. Would you like to add any specific questions or make changes?`;
      }
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error in AI response:', error);
      
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I understand you want to create a form. Could you provide more details about what type of form you need? For example, is it a contact form, survey, quiz, or assessment?",
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
                      className={`p-1 rounded-full ${
                        message.role === 'user'
                          ? 'text-blue-100 hover:bg-blue-500'
                          : 'text-gray-600 hover:bg-gray-300'
                      }`}
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
          {isLoading && (
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
      
      <ChatSuggestions 
        onSuggestionClick={handleSuggestionClick}
        currentContext={currentContext}
      />
      
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