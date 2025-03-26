import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Copy, Check, AlertCircle, ArrowRight, Lock, Globe, Users } from 'lucide-react';
import { supabase } from "../lib/supabase.ts";
import { showToast } from "../lib/toast.ts";
import type { Quiz as QuizType, Question } from "../types/quiz.ts";
import { generateQuizShare } from "../lib/quiz.ts";

export default function QuizView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    loadQuiz();
  }, [id]);

  async function loadQuiz() {
    try {
      setError(null);
      setLoading(true);

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select()
        .eq('id', id)
        .single();

      if (quizError) throw quizError;
      if (!quizData) {
        setError('Quiz not found');
        return;
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          options (*)
        `)
        .eq('quiz_id', id)
        .order('order', { ascending: true });

      if (questionsError) throw questionsError;

      setQuiz(quizData);
      setQuestions(questionsData || []);
      setShareUrl(`${window.location.origin}/quiz/${quizData.share_id}`);
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }

  const handleCopyLink = async () => {
    try {
      let urlToCopy = shareUrl;
      if (!quiz?.share_id) {
        const share = await generateQuizShare(quiz?.id || '', {
          accessType: quiz?.access_type || 'public'
        });
        urlToCopy = `${window.location.origin}/quiz/${share.share_id}`;
        setShareUrl(urlToCopy);
      }
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      showToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('Failed to copy link', 'error');
    }
  };

  const getAccessTypeIcon = () => {
    switch (quiz?.access_type) {
      case 'private':
        return <Lock className="h-5 w-5 text-secondary" />;
      case 'invite':
        return <Users className="h-5 w-5 text-secondary" />;
      default:
        return <Globe className="h-5 w-5 text-secondary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-background rounded-lg shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Quiz not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-primary transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-background rounded-lg shadow-xl p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-gray-600">{quiz.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowShareDialog(!showShareDialog)}
            className="flex items-center px-4 py-2 text-secondary hover:text-primary border border-secondary rounded-lg hover:bg-accent transition-colors"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Quiz
          </button>
        </div>

        {/* Share Dialog */}
        {showShareDialog && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Share Quiz</h2>
              {getAccessTypeIcon()}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-gray-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  {getAccessTypeIcon()}
                  <span className="ml-2">
                    {quiz.access_type === 'private'
                      ? 'Private - Only people with the link can access'
                      : quiz.access_type === 'invite'
                      ? 'Invite Only - Only invited participants can access'
                      : 'Public - Anyone can access'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Questions</h3>
            <p className="text-2xl font-bold text-text">{questions.length}</p>
          </div>
          {quiz.time_limit && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Time Limit</h3>
              <p className="text-2xl font-bold text-text">{quiz.time_limit} minutes</p>
            </div>
          )}
        </div>

        {/* Questions Preview */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-medium text-text mb-4">
                Question {index + 1}: {question.text}
              </h3>
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={option.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background text-gray-600 mr-3">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <p className="text-text">{option.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Take Quiz Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(`/quiz/${quiz.share_id}`)}
            className="flex items-center px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Take Quiz
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}