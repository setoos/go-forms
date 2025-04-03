import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { QuestionComponent } from './questions/QuestionTypes';
import type { Quiz as QuizType, Question } from '../types/quiz';
import { questions as sampleQuestions } from '../data/questions';
import { shuffleQuestions, shuffleOptions } from '../lib/quiz';

interface QuizProps {
  initialQuiz?: QuizType;
  initialQuestions?: Question[];
  isSampleQuiz?: boolean;
}

export default function Quiz({ initialQuiz, initialQuestions, isSampleQuiz: propIsSampleQuiz }: QuizProps = {}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizType | null>(initialQuiz || null);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [loading, setLoading] = useState(!initialQuiz);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [startTime] = useState<number>(Date.now());
  
  const isSampleQuiz = propIsSampleQuiz || id === 'sample';

  useEffect(() => {
    if (initialQuiz && initialQuestions) {
      return; // Skip loading if props are provided
    }
    
    if (isSampleQuiz) {
      loadSampleQuiz();
    } else {
      loadQuiz();
    }
  }, [id, initialQuiz, initialQuestions]);

  async function loadQuiz() {
    try {
      setLoading(true);
      setError(null);

      // First get the quiz data
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (quizError) throw quizError;
      if (!quizData) {
        setError('Quiz not found');
        return;
      }

      // Then get questions with related data
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*, options(*), matching_pairs(*), ordering_items(*), essay_rubrics(*)')
        .eq('quiz_id', id)
        .order('order');

      if (questionsError) throw questionsError;

      // Shuffle questions and their options
      const shuffledQuestions = questionsData.map(question => ({
        ...question,
        options: question.options ? shuffleOptions(question.options) : [],
      }));

      setQuiz(quizData);
      setQuestions(shuffleQuestions(shuffledQuestions));
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }

  function loadSampleQuiz() {
    setQuiz({
      id: 'sample',
      title: 'Marketing Awareness Sample Quiz',
      description: 'Test your marketing knowledge with our sample quiz',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
      is_published: true,
      share_id: 'sample'
    });
    setQuestions(sampleQuestions);
    setLoading(false);
  }

  const handleAnswer = async (score: number, answer: any) => {
    const questionId = questions[currentQuestion].id;
    const newAnswers = { ...answers, [questionId]: answer };
    const newScores = { ...scores, [questionId]: score };
    
    setAnswers(newAnswers);
    setScores(newScores);

    if (currentQuestion === questions.length - 1) {
      const totalScore = Object.values(newScores).reduce((acc, val) => acc + val, 0);
      const completionTime = Math.floor((Date.now() - startTime) / 1000);

      if (!isSampleQuiz) {
        try {
          // Create quiz attempt
          const { data: attempt, error: attemptError } = await supabase
            .from('quiz_attempts')
            .insert({
              quiz_id: id,
              score: Math.round((totalScore / (questions.length * 10)) * 100),
              answers: newScores,
              started_at: new Date(startTime).toISOString(),
              completed_at: new Date().toISOString()
            })
            .select()
            .single();

          if (attemptError) {
            console.error('Error saving quiz attempt:', attemptError);
            // Continue even if there's an error, to ensure the user can see their results
          }
        } catch (error) {
          console.error('Error saving quiz attempt:', error);
          // Continue even if there's an error, to ensure the user can see their results
        }
      }

      navigate('/results', { 
        state: { 
          quizId: id,
          answers: newScores,
          score: Math.round((totalScore / (questions.length * 10)) * 100),
          completionTime,
          isSampleQuiz,
          showUserInfoForm: true
        }
      });
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || !questions[currentQuestion]) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h2>
          <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const progressWidth = `${((currentQuestion + 1) / questions.length) * 100}%`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-purple-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500">
              Score: {Object.values(scores).reduce((acc, val) => acc + val, 0)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: progressWidth }}
            ></div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          {questions[currentQuestion].text}
        </h2>

        <QuestionComponent
          question={questions[currentQuestion]}
          onAnswer={handleAnswer}
          showFeedback={true}
        />

        {quiz.share_id && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Share this quiz: {window.location.origin}/quiz/{quiz.share_id}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}