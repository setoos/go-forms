import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Trash2, ArrowLeft, ChevronRight, Share2, Copy, Lock, Globe, Users } from 'lucide-react';
import { useAuth } from "../../lib/auth.tsx";
import { showToast } from "../../lib/toast.ts";
import { getQuiz, saveQuiz, validateQuiz, generateQuizShare } from "../../lib/quiz.ts";
import type { Quiz, Question, QuestionType } from "../../types/quiz.ts";
import { QUIZ_CATEGORIES, ACCESS_TYPES } from "../../types/quiz.ts";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'matching', label: 'Matching' },
  { value: 'ordering', label: 'Ordering' },
  { value: 'essay', label: 'Essay' },
  { value: 'picture_based', label: 'Picture Based' },
  { value: 'complete_statement', label: 'Complete Statement' },
  { value: 'definition', label: 'Definition' }
];

const COGNITIVE_LEVELS = [
  { value: 'recall', label: 'Recall' },
  { value: 'understanding', label: 'Understanding' },
  { value: 'application', label: 'Application' },
  { value: 'analysis', label: 'Analysis' }
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';
  
  const [step, setStep] = useState<'questions' | 'details'>('questions');
  const [quiz, setQuiz] = useState<Quiz>({
    id: '',
    title: '',
    description: '',
    category: null,
    time_limit: null,
    passing_score: null,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: user?.id || '',
    is_published: false,
    deleted_at: null,
    completion_count: 0,
    average_score: 0,
    version: 1,
    approval_status: 'pending',
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    last_published_at: null,
    published_version: null,
    share_id: null,
    start_date: null,
    end_date: null,
    max_attempts: null,
    access_type: 'public',
    password_hash: null,
    requires_auth: false
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareSettings, setShowShareSettings] = useState(false);
  const [sharePassword, setSharePassword] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadQuiz();
    }
  }, [id]);

  async function loadQuiz() {
    try {
      setLoading(true);
      setError(null);

      const { quiz: quizData, questions: questionsData } = await getQuiz(id);
      
      if (!quizData) {
        setError('Quiz not found');
        return;
      }

      setQuiz(quizData);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (questions.length === 0) {
      showToast('Please add at least one question', 'error');
      return;
    }

    for (const question of questions) {
      if (!question.text.trim()) {
        showToast('All questions must have text', 'error');
        return;
      }

      if (question.type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
        showToast('Multiple choice questions must have at least 2 options', 'error');
        return;
      }
    }

    if (step === 'questions') {
      setStep('details');
      return;
    }

    const validationErrors = await validateQuiz(quiz);
    if (validationErrors.length > 0) {
      showToast(validationErrors[0], 'error');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const quizId = await saveQuiz(quiz, questions);
      
      if (quiz.is_published) {
        await generateQuizShare(quizId, {
          accessType: quiz.access_type,
          password: sharePassword || undefined,
          maxAttempts: quiz.max_attempts || undefined,
          expiresAt: quiz.end_date ? new Date(quiz.end_date) : undefined
        });
      }

      showToast('Quiz saved successfully', 'success');
      navigate('/admin/quizzes');
    } catch (error) {
      console.error('Error saving quiz:', error);
      setError('Failed to save quiz');
      showToast('Failed to save quiz', 'error');
    } finally {
      setSaving(false);
    }
  }

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        id: '',
        quiz_id: '',
        text: '',
        type: 'multiple_choice',
        order: questions.length,
        points: 10,
        cognitive_level: 'understanding',
        difficulty_level: 'medium',
        required: true,
        created_at: new Date().toISOString(),
        options: []
      }
    ]);
  }

  function addOption(questionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = [
      ...(newQuestions[questionIndex].options || []),
      {
        id: '',
        question_id: '',
        text: '',
        score: 0,
        feedback: '',
        order: newQuestions[questionIndex].options?.length || 0,
        is_correct: false
      }
    ];
    setQuestions(newQuestions);
  }

  function addMatchingPair(questionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].matching_pairs = [
      ...(newQuestions[questionIndex].matching_pairs || []),
      {
        id: '',
        question_id: '',
        left_item: '',
        right_item: '',
        order: newQuestions[questionIndex].matching_pairs?.length || 0,
        created_at: new Date().toISOString()
      }
    ];
    setQuestions(newQuestions);
  }

  function addOrderingItem(questionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].ordering_items = [
      ...(newQuestions[questionIndex].ordering_items || []),
      {
        id: '',
        question_id: '',
        item: '',
        correct_position: (newQuestions[questionIndex].ordering_items?.length || 0) + 1,
        order: newQuestions[questionIndex].ordering_items?.length || 0,
        created_at: new Date().toISOString()
      }
    ];
    setQuestions(newQuestions);
  }

  function addEssayRubric(questionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].essay_rubrics = [
      ...(newQuestions[questionIndex].essay_rubrics || []),
      {
        id: '',
        question_id: '',
        criteria: '',
        description: '',
        max_points: 5,
        created_at: new Date().toISOString()
      }
    ];
    setQuestions(newQuestions);
  }

  function updateQuestion(index: number, updates: Partial<Question>) {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };

    // Reset question-specific data when type changes
    if (updates.type) {
      newQuestions[index].options = [];
      newQuestions[index].matching_pairs = [];
      newQuestions[index].ordering_items = [];
      newQuestions[index].essay_rubrics = [];
      newQuestions[index].answer_key = null;
      newQuestions[index].rubric = null;
    }

    setQuestions(newQuestions);
  }

  function deleteQuestion(index: number) {
    if (confirm('Are you sure you want to delete this question?')) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      // Update order for remaining questions
      newQuestions.forEach((q, i) => q.order = i);
      setQuestions(newQuestions);
    }
  }

  function renderQuestionEditor(question: Question, index: number) {
    return (
      <div key={index} className="bg-background rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Question {index + 1}</h3>
          <button
            onClick={() => deleteQuestion(index)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Question Type
            </label>
            <select
              value={question.type}
              onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
            >
              {QUESTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Question Text
            </label>
            <textarea
              value={question.text}
              onChange={(e) => updateQuestion(index, { text: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
              rows={3}
              placeholder="Enter your question"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Instructions
            </label>
            <textarea
              value={question.instructions || ''}
              onChange={(e) => updateQuestion(index, { instructions: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
              rows={2}
              placeholder="Enter instructions for this question"
            />
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Points
            </label>
            <input
              type="number"
              value={question.points}
              onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
              min="0"
            />
          </div>

          {/* Cognitive Level */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Cognitive Level
            </label>
            <select
              value={question.cognitive_level}
              onChange={(e) => updateQuestion(index, { cognitive_level: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
            >
              {COGNITIVE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Difficulty Level
            </label>
            <select
              value={question.difficulty_level}
              onChange={(e) => updateQuestion(index, { difficulty_level: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type Specific Fields */}
          {question.type === 'multiple_choice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Options</h4>
                <button
                  onClick={() => addOption(index)}
                  className="text-secondary hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex gap-4">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].options![optionIndex].text = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Option text"
                  />
                  <input
                    type="number"
                    value={option.score}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].options![optionIndex].score = parseInt(e.target.value);
                      newQuestions[index].options![optionIndex].is_correct = parseInt(e.target.value) > 0;
                      setQuestions(newQuestions);
                    }}
                    className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Score"
                  />
                  <input
                    type="text"
                    value={option.feedback || ''}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].options![optionIndex].feedback = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Feedback"
                  />
                  <button
                    onClick={() => {
                      const newQuestions = [...questions];
                      newQuestions[index].options!.splice(optionIndex, 1);
                      setQuestions(newQuestions);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {question.type === 'matching' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Matching Pairs</h4>
                <button
                  onClick={() => addMatchingPair(index)}
                  className="text-secondary hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {question.matching_pairs?.map((pair, pairIndex) => (
                <div key={pairIndex} className="flex gap-4">
                  <input
                    type="text"
                    value={pair.left_item}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].matching_pairs![pairIndex].left_item = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Left item"
                  />
                  <input
                    type="text"
                    value={pair.right_item}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].matching_pairs![pairIndex].right_item = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Right item"
                  />
                  <button
                    onClick={() => {
                      const newQuestions = [...questions];
                      newQuestions[index].matching_pairs!.splice(pairIndex, 1);
                      setQuestions(newQuestions);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {question.type === 'ordering' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Ordering Items</h4>
                <button
                  onClick={() => addOrderingItem(index)}
                  className="text-secondary hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {question.ordering_items?.map((item, itemIndex) => (
                <div key={itemIndex} className="flex gap-4">
                  <input
                    type="text"
                    value={item.item}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].ordering_items![itemIndex].item = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Item text"
                  />
                  <input
                    type="number"
                    value={item.correct_position}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].ordering_items![itemIndex].correct_position = parseInt(e.target.value);
                      setQuestions(newQuestions);
                    }}
                    className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Position"
                  />
                  <button
                    onClick={() => {
                      const newQuestions = [...questions];
                      newQuestions[index].ordering_items!.splice(itemIndex, 1);
                      setQuestions(newQuestions);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {question.type === 'essay' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Rubric Criteria</h4>
                <button
                  onClick={() => addEssayRubric(index)}
                  className="text-secondary hover:text-primary"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {question.essay_rubrics?.map((rubric, rubricIndex) => (
                <div key={rubricIndex} className="flex gap-4">
                  <input
                    type="text"
                    value={rubric.criteria}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].essay_rubrics![rubricIndex].criteria = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Criteria"
                  />
                  <input
                    type="text"
                    value={rubric.description || ''}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].essay_rubrics![rubricIndex].description = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    value={rubric.max_points}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].essay_rubrics![rubricIndex].max_points = parseInt(e.target.value);
                      setQuestions(newQuestions);
                    }}
                    className="w-20 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="Points"
                  />
                  <button
                    onClick={() => {
                      const newQuestions = [...questions];
                      newQuestions[index].essay_rubrics!.splice(rubricIndex, 1);
                      setQuestions(newQuestions);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {question.type === 'picture_based' && (
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={question.media_url || ''}
                onChange={(e) => updateQuestion(index, { media_url: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                placeholder="Enter image URL"
              />
            </div>
          )}

          {(question.type === 'true_false' || question.type === 'fill_blank') && (
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Correct Answer
              </label>
              {question.type === 'true_false' ? (
                <select
                  value={question.answer_key?.correct_answer?.toString() || 'true'}
                  onChange={(e) => updateQuestion(index, {
                    answer_key: {
                      correct_answer: e.target.value === 'true',
                      explanation: question.answer_key?.explanation || ''
                    }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={question.answer_key?.correct_answer || ''}
                  onChange={(e) => updateQuestion(index, {
                    answer_key: {
                      correct_answer: e.target.value,
                      alternative_answers: question.answer_key?.alternative_answers || []
                    }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  placeholder="Enter correct answer"
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-background rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-text mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="bg-secondary text-text px-6 py-2 rounded-lg hover:bg-primary transition-colors"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setStep('questions')}
            className="flex items-center text-gray-600 hover:text-text"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Questions
          </button>
          <h1 className="text-2xl font-bold text-text">
            Quiz Details
          </h1>
        </div>

        <div className="bg-background rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-text mb-2">
              Title
            </label>
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
              placeholder="Enter quiz title"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text mb-2">
              Description
            </label>
            <textarea
              value={quiz.description || ''}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
              rows={3}
              placeholder="Enter quiz description"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text mb-2">
              Category
            </label>
            <select
              value={quiz.category || ''}
              onChange={(e) => setQuiz({ ...quiz, category: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
            >
              <option value="">Select a category</option>
              {QUIZ_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={quiz.time_limit || ''}
                onChange={(e) => setQuiz({ ...quiz, time_limit: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={quiz.passing_score || ''}
                onChange={(e) => setQuiz({ ...quiz, passing_score: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                placeholder="Optional"
              />
            </div>
          </div>

          {!isNew && (
            <div className="mb-6">
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={quiz.is_published}
                  onChange={(e) => {
                    setQuiz({ ...quiz, is_published: e.target.checked });
                    if (e.target.checked) {
                      setShowShareSettings(true);
                    }
                  }}
                  className="rounded border-border text-secondary focus:ring-secondary"
                />
                <span className="ml-2 text-sm font-medium text-text">Published</span>
              </label>

              {quiz.is_published && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-text">Share Settings</h3>
                    <button
                      onClick={() => setShowShareSettings(!showShareSettings)}
                      className="text-secondary hover:text-primary"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {showShareSettings ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Access Type
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(ACCESS_TYPES).map(([type, { label, description }]) => (
                            <button
                              key={type}
                              onClick={() => setQuiz({ ...quiz, access_type: type as any })}
                              className={`p-4 border rounded-lg text-left ${
                                quiz.access_type === type
                                  ? 'border-secondary bg-accent'
                                  : 'border-border hover:border-border'
                              }`}
                            >
                              <div className="flex items-center mb-2">
                                {type === 'public' && <Globe className="w-4 h-4 text-secondary mr-2" />}
                                {type === 'private' && <Lock className="w-4 h-4 text-secondary mr-2" />}
                                {type === 'invite' && <Users className="w-4 h-4 text-secondary mr-2" />}
                                <span className="font-medium">{label}</span>
                              </div>
                              <p className="text-xs text-gray-500">{description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">
                            Start Date
                          </label>
                          <input
                            type="datetime-local"
                            value={quiz.start_date || ''}
                            onChange={(e) => setQuiz({ ...quiz, start_date: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">
                            End Date
                          </label>
                          <input
                            type="datetime-local"
                            value={quiz.end_date || ''}
                            onChange={(e) => setQuiz({ ...quiz, end_date: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Maximum Attempts
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={quiz.max_attempts || ''}
                          onChange={(e) => setQuiz({ ...quiz, max_attempts: parseInt(e.target.value) || null })}
                          className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                          placeholder="Unlimited"
                        />
                      </div>

                      {quiz.access_type !== 'public' && (
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">
                            Password Protection
                          </label>
                          <input
                            type="password"
                            value={sharePassword}
                            onChange={(e) => setSharePassword(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                            placeholder="Optional"
                          />
                        </div>
                      )}

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={quiz.requires_auth}
                          onChange={(e) => setQuiz({ ...quiz, requires_auth: e.target.checked })}
                          className="rounded border-border text-secondary focus:ring-secondary"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Require users to sign in before taking the quiz
                        </span>
                      </label>
                    </div>
                  ) : quiz.share_id && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/quiz/${quiz.share_id}`}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-100 border border-border rounded-md text-gray-600"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/quiz/${quiz.share_id}`);
                          showToast('Share URL copied to clipboard', 'success');
                        }}
                        className="p-2 text-secondary hover:text-primary"
                        title="Copy share URL"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg ${
              saving
                ? 'bg-secondary text-white cursor-not-allowed'
                : 'bg-secondary text-white hover:bg-primary'
            } transition-colors`}
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/admin/quizzes')}
          className="flex items-center text-gray-600 hover:text-text"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Quizzes
        </button>
        <h1 className="text-2xl font-bold text-text">
          {isNew ? 'Create Questions' : 'Edit Questions'}
        </h1>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => renderQuestionEditor(question, index))}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={addQuestion}
          className="flex items-center px-4 py-2 bg-gray-100 text-text rounded-lg hover:bg-border transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Question
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 flex items-center justify-center px-6 py-2 rounded-lg ${
            saving
              ? 'bg-secondary text-white cursor-not-allowed'
              : 'bg-secondary text-white hover:bg-primary'
          } transition-colors`}
        >
          <ChevronRight className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Continue to Details'}
        </button>
      </div>
    </div>
  );
}

export default QuizEditor;