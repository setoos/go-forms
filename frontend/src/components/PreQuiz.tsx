import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Timer, Target, User } from 'lucide-react';
import type { Quiz } from '../types/quiz';

interface PreQuizProps {
  quiz: Quiz;
  onStart: (userInfo: { name: string; email: string; phone: string }) => void;
}

export default function PreQuiz({ quiz, onStart }: PreQuizProps) {
  const [step, setStep] = useState<'welcome' | 'info'>('welcome');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(userInfo);
  };

  if (step === 'welcome') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <Brain className="h-16 w-16 text-purple-600" />
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {quiz.title}
          </h1>
          
          {quiz.description && (
            <p className="text-center text-gray-600 mb-8">
              {quiz.description}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {quiz.time_limit && (
              <div className="bg-purple-50 p-6 rounded-lg text-center">
                <Timer className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Time Limit</h3>
                <p className="text-gray-600">{quiz.time_limit} minutes</p>
              </div>
            )}

            {quiz.passing_score && (
              <div className="bg-purple-50 p-6 rounded-lg text-center">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Passing Score</h3>
                <p className="text-gray-600">{quiz.passing_score}%</p>
              </div>
            )}

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Questions</h3>
              <p className="text-gray-600">10 questions</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setStep('info')}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Quiz
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-center mb-8">
          <Brain className="h-16 w-16 text-purple-600" />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Before We Begin
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Please provide your information to start the quiz
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={userInfo.name}
              onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={userInfo.email}
              onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              required
              value={userInfo.phone}
              onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Quiz
            </button>
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="w-full px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}