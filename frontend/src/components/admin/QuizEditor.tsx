import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  Copy, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Loader, 
  CheckCircle, 
  X, 
  Share2, 
  Link as LinkIcon, 
  Clock, 
  Award, 
  Tag, 
  FileText, 
  Briefcase, 
  BookOpen, 
  Users, 
  Shield
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { showToast } from '../../lib/toast';
import { saveQuiz, validateQuiz, getQuiz, getQuizTemplate } from '../../lib/quiz';
import type { Quiz, Question, Option } from '../../types/quiz';
import { QUIZ_CATEGORIES } from '../../types/quiz';

// Question type options
const questionTypes = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'matching', label: 'Matching' },
  { value: 'ordering', label: 'Ordering' },
  { value: 'essay', label: 'Essay' },
  { value: 'picture_based', label: 'Picture-Based' },
  { value: 'complete_statement', label: 'Complete Statement' },
  { value: 'definition', label: 'Definition' }
];

// Cognitive level options
const cognitiveLevels = [
  { value: 'recall', label: 'Recall' },
  { value: 'understanding', label: 'Understanding' },
  { value: 'application', label: 'Application' },
  { value: 'analysis', label: 'Analysis' }
];

// Difficulty level options
const difficultyLevels = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  'Marketing': <Briefcase className="h-5 w-5" />,
  'Technology': <FileText className="h-5 w-5" />,
  'Business': <Briefcase className="h-5 w-5" />,
  'Education': <BookOpen className="h-5 w-5" />,
  'Science': <FileText className="h-5 w-5" />,
  'General Knowledge': <FileText className="h-5 w-5" />,
  'Other': <FileText className="h-5 w-5" />
};

export default function QuizEditor({ initialQuiz, initialQuestions }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!initialQuiz);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'questions' | 'details'>('questions');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const quillRefs = useRef<{[key: string]: ReactQuill | null}>({});
  
  // Get template ID from URL query params
  const queryParams = new URLSearchParams(location.search);
  const templateId = queryParams.get('template');
  const editMode = queryParams.get('edit');

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz || {
    id: '',
    title: '',
    description: '',
    category: '',
    time_limit: null,
    passing_score: null,
    status: 'draft',
    is_published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: user?.id || '',
    version: 1,
    approval_status: 'pending',
    share_id: null
  });
  
  // Questions state
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [activeOptionEditors, setActiveOptionEditors] = useState<{[key: string]: boolean}>({});
  
  // Load quiz data
  useEffect(() => {
    if (!user) {
      setError('You must be logged in to create or edit GoForms');
      setLoading(false);
      return;
    }
    
    if (initialQuiz && initialQuestions) {
      // If props are provided, use them
      setQuiz(initialQuiz);
      setQuestions(initialQuestions);
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (templateId) {
          // Load from template
          const templateData = await getQuizTemplate(templateId);
          
          if (templateData) {
            setQuiz({
              ...templateData.quiz,
              created_by: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            setQuestions(templateData.questions);
            
            // If edit mode is specified, set the active step
            if (editMode === 'questions') {
              setActiveStep('questions');
            } else if (editMode === 'details') {
              setActiveStep('details');
            }
          }
        } else if (id && id !== 'new') {
          // Load existing quiz
          const { quiz: loadedQuiz, questions: loadedQuestions } = await getQuiz(id);
          
          if (loadedQuiz.created_by !== user.id) {
            setError('You do not have permission to edit this GoForm');
            setLoading(false);
            return;
          }
          
          setQuiz(loadedQuiz);
          setQuestions(loadedQuestions);
        } else {
          // New quiz
          setQuiz({
            ...quiz,
            created_by: user.id
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading GoForm:', error);
        setError('Failed to load GoForm data');
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, user, templateId, editMode, initialQuiz, initialQuestions]);
  
  // Handle quiz field changes
  const handleQuizChange = (field: keyof Quiz, value: any) => {
    setQuiz(prev => ({ ...prev, [field]: value }));
  };
  
  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      quiz_id: quiz.id,
      text: '',
      type: 'multiple_choice',
      order: questions.length,
      points: 10,
      cognitive_level: 'understanding',
      difficulty_level: 'medium',
      required: true,
      created_at: new Date().toISOString(),
      options: []
    };
    
    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(questions.length);
  };
  
  // Delete a question
  const handleDeleteQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    
    // Update order for remaining questions
    const updatedQuestions = newQuestions.map((q, i) => ({
      ...q,
      order: i
    }));
    
    setQuestions(updatedQuestions);
    
    // If the expanded question was deleted, collapse all
    if (expandedQuestion === index) {
      setExpandedQuestion(null);
    } else if (expandedQuestion !== null && expandedQuestion > index) {
      // If a question before the expanded one was deleted, adjust the expanded index
      setExpandedQuestion(expandedQuestion - 1);
    }
  };
  
  // Duplicate a question
  const handleDuplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const newQuestion: Question = {
      ...questionToDuplicate,
      id: `temp-${Date.now()}`,
      text: `${questionToDuplicate.text} (Copy)`,
      order: questions.length,
      options: questionToDuplicate.options ? [...questionToDuplicate.options.map(o => ({
        ...o,
        id: `temp-${Date.now()}-${o.order}`
      }))] : [],
      matching_pairs: questionToDuplicate.matching_pairs ? [...questionToDuplicate.matching_pairs.map(p => ({
        ...p,
        id: `temp-${Date.now()}-${p.order}`
      }))] : [],
      ordering_items: questionToDuplicate.ordering_items ? [...questionToDuplicate.ordering_items.map(i => ({
        ...i,
        id: `temp-${Date.now()}-${i.order}`
      }))] : [],
      essay_rubrics: questionToDuplicate.essay_rubrics ? [...questionToDuplicate.essay_rubrics.map(r => ({
        ...r,
        id: `temp-${Date.now()}`
      }))] : []
    };
    
    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(questions.length);
  };
  
  // Update a question
  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    
    // If changing question type, reset options
    if (field === 'type') {
      newQuestions[index].options = [];
      newQuestions[index].matching_pairs = [];
      newQuestions[index].ordering_items = [];
      newQuestions[index].essay_rubrics = [];
      newQuestions[index].answer_key = null;
    }
    
    setQuestions(newQuestions);
  };
  
  // Add an option to a question
  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const options = newQuestions[questionIndex].options || [];
    
    const newOption: Option = {
      id: `temp-${Date.now()}-${options.length}`,
      question_id: newQuestions[questionIndex].id,
      text: '',
      score: 0,
      feedback: '',
      order: options.length,
      is_correct: false
    };
    
    newQuestions[questionIndex].options = [...options, newOption];
    setQuestions(newQuestions);
    
    // Set this option's editor as active
    setActiveOptionEditors(prev => ({
      ...prev,
      [`${questionIndex}-${options.length}`]: true
    }));
  };
  
  // Delete an option
  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    options.splice(optionIndex, 1);
    
    // Update order for remaining options
    const updatedOptions = options.map((o, i) => ({
      ...o,
      order: i
    }));
    
    newQuestions[questionIndex].options = updatedOptions;
    setQuestions(newQuestions);
    
    // Remove this option's editor from active editors
    const editorKey = `${questionIndex}-${optionIndex}`;
    const newActiveEditors = { ...activeOptionEditors };
    delete newActiveEditors[editorKey];
    setActiveOptionEditors(newActiveEditors);
  };
  
  // Update an option
  const handleOptionChange = (questionIndex: number, optionIndex: number, field: keyof Option, value: any) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    
    options[optionIndex] = {
      ...options[optionIndex],
      [field]: value
    };
    
    // If changing score, update is_correct
    if (field === 'score') {
      options[optionIndex].is_correct = value > 0;
    }
    
    // If changing is_correct, update score
    if (field === 'is_correct') {
      options[optionIndex].score = value ? 10 : 0;
    }
    
    newQuestions[questionIndex].options = options;
    setQuestions(newQuestions);
  };
  
  // Toggle question expansion
  const toggleQuestionExpand = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };
  
  // Toggle option editor
  const toggleOptionEditor = (questionIndex: number, optionIndex: number) => {
    const editorKey = `${questionIndex}-${optionIndex}`;
    setActiveOptionEditors(prev => ({
      ...prev,
      [editorKey]: !prev[editorKey]
    }));
  };
  
  // Handle image upload for the rich text editor
  const handleImageUpload = async () => {
    // Create a file input element
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg, image/png, image/gif');
    
    // When a file is selected
    input.onchange = async () => {
      if (!input.files || !input.files[0]) return;
      
      const file = input.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        showToast('Invalid file type. Please upload JPG, PNG, or GIF images.', 'error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image is too large. Maximum size is 5MB.', 'error');
        return;
      }
      
      try {
        // Show loading toast
        showToast('Uploading image...', 'info');
        
        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('quiz-images')
          .upload(`public/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        // Get public URL
        const { data: publicURL } = supabase.storage
          .from('quiz-images')
          .getPublicUrl(`public/${fileName}`);
        
        if (!publicURL) throw new Error('Failed to get public URL');
        
        // Find the active editor
        const activeEditorKey = Object.keys(activeOptionEditors).find(key => activeOptionEditors[key]);
        if (activeEditorKey) {
          const [questionIndex, optionIndex] = activeEditorKey.split('-').map(Number);
          const quill = quillRefs.current[`option-${questionIndex}-${optionIndex}`]?.getEditor();
          
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', publicURL.publicUrl);
            quill.setSelection(range.index + 1);
          }
        }
        
        showToast('Image uploaded successfully', 'success');
      } catch (error) {
        console.error('Error uploading image:', error);
        showToast('Error uploading image: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      }
    };
    
    // Trigger file selection
    input.click();
  };
  
  // Custom modules for ReactQuill
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    }
  };
  
  // Save the quiz
  const handleSave = async () => {
    try {
      // Validate quiz
      const errors = await validateQuiz(quiz);
      if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
      }
      
      // Validate questions
      if (questions.length === 0) {
        showToast('Please add at least one question', 'error');
        return;
      }
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        if (!question.text.trim()) {
          showToast(`Question ${i + 1} is missing text`, 'error');
          return;
        }
        
        if (question.type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
          showToast(`Question ${i + 1} needs at least two options`, 'error');
          return;
        }
        
        if (question.type === 'multiple_choice' && !question.options?.some(o => o.is_correct)) {
          showToast(`Question ${i + 1} needs at least one correct option`, 'error');
          return;
        }
      }
      
      setSaving(true);
      
      // Save quiz
      const quizId = await saveQuiz(quiz, questions);
      
      showToast('GoForm saved successfully', 'success');
      
      // Redirect to quiz list
      navigate('/admin/quizzes');
    } catch (error) {
      console.error('Error saving GoForm:', error);
      showToast('Failed to save GoForm', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  // Preview the quiz
  const handlePreview = () => {
    if (quiz.id) {
      window.open(`/quiz/${quiz.id}`, '_blank');
    } else {
      showToast('Please save the GoForm first to preview it', 'error');
    }
  };
  
  // Share the quiz
  const handleShare = async () => {
    if (!quiz.id) {
      showToast('Please save the GoForm first to share it', 'error');
      return;
    }
    
    try {
      // Generate share URL
      const shareId = quiz.share_id || `${window.location.origin}/quiz/${quiz.id}`;
      setShareUrl(`${globalThis.location.origin}/quiz/${shareId}`);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error sharing GoForm:', error);
      showToast('Failed to share GoForm', 'error');
    }
  };
  
  // Copy share URL
  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Share URL copied to clipboard', 'success');
    } catch (error) {
      console.error('Error copying share URL:', error);
      showToast('Failed to copy share URL', 'error');
    }
  };
  
  // Continue to details
  const handleContinueToDetails = () => {
    // Validate questions
    if (questions.length === 0) {
      showToast('Please add at least one question', 'error');
      return;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.text.trim()) {
        showToast(`Question ${i + 1} is missing text`, 'error');
        return;
      }
      
      if (question.type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
        showToast(`Question ${i + 1} needs at least two options`, 'error');
        return;
      }
      
      if (question.type === 'multiple_choice' && !question.options?.some(o => o.is_correct)) {
        showToast(`Question ${i + 1} needs at least one correct option`, 'error');
        return;
      }
    }
    
    setActiveStep('details');
  };
  
  // Back to questions
  const handleBackToQuestions = () => {
    setActiveStep('questions');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to GoForms
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id === 'new' || templateId ? 'Create GoForm' : 'Edit GoForm'}
            </h1>
            <p className="text-gray-600">
              {activeStep === 'questions' ? 'Add and edit questions' : 'Configure GoForm settings'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {quiz.id && (
            <>
              <button
                onClick={handlePreview}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-5 w-5 mr-2" />
                Preview
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-4 py-2 rounded-lg ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } text-white`}
          >
            {saving ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save GoForm
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Steps */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activeStep === 'questions' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Questions</h3>
              <p className="text-sm text-gray-500">Add and edit questions</p>
            </div>
          </div>
          
          <div className="w-16 h-0.5 bg-gray-200"></div>
          
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activeStep === 'details' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Details</h3>
              <p className="text-sm text-gray-500">Configure GoForm settings</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Questions Step */}
      {activeStep === 'questions' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
            <button
              onClick={handleAddQuestion}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Question
            </button>
          </div>
          
          {questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-500 mb-4">Add your first question to get started</p>
              <button
                onClick={handleAddQuestion}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Question
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                    onClick={() => toggleQuestionExpand(index)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <span className="text-purple-600 font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {question.text || 'Untitled Question'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {questionTypes.find(t => t.value === question.type)?.label || 'Multiple Choice'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateQuestion(index);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 mr-1"
                        title="Duplicate question"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(index);
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 mr-1"
                        title="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-500">
                        {expandedQuestion === index ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {expandedQuestion === index && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text
                        </label>
                        <input
                          type="text"
                          value={question.text}
                          onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter question text"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          >
                            {questionTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cognitive Level
                          </label>
                          <select
                            value={question.cognitive_level || 'understanding'}
                            onChange={(e) => handleQuestionChange(index, 'cognitive_level', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          >
                            {cognitiveLevels.map(level => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Difficulty Level
                          </label>
                          <select
                            value={question.difficulty_level || 'medium'}
                            onChange={(e) => handleQuestionChange(index, 'difficulty_level', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          >
                            {difficultyLevels.map(level => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Instructions (Optional)
                        </label>
                        <textarea
                          value={question.instructions || ''}
                          onChange={(e) => handleQuestionChange(index, 'instructions', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter instructions for this question"
                          rows={2}
                        />
                      </div>
                      
                      {/* Multiple Choice Options */}
                      {question.type === 'multiple_choice' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Options
                            </label>
                            <button
                              onClick={() => handleAddOption(index)}
                              className="text-sm text-purple-600 hover:text-purple-800"
                            >
                              + Add Option
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {question.options?.map((option, optionIndex) => (
                              <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={option.is_correct}
                                      onChange={(e) => handleOptionChange(index, optionIndex, 'is_correct', e.target.checked)}
                                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-2"
                                    />
                                    <span className="text-sm font-medium">
                                      {option.is_correct ? 'Correct Answer' : 'Incorrect Answer'}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => toggleOptionEditor(index, optionIndex)}
                                      className="p-1.5 text-gray-500 hover:text-gray-700 mr-1"
                                      title={activeOptionEditors[`${index}-${optionIndex}`] ? "Hide rich editor" : "Show rich editor"}
                                    >
                                      {activeOptionEditors[`${index}-${optionIndex}`] ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOption(index, optionIndex)}
                                      className="p-1.5 text-red-500 hover:text-red-700"
                                      title="Delete option"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Option Text
                                  </label>
                                  <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => handleOptionChange(index, optionIndex, 'text', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Option text"
                                  />
                                </div>
                                
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Score
                                  </label>
                                  <input
                                    type="number"
                                    value={option.score}
                                    onChange={(e) => handleOptionChange(index, optionIndex, 'score', parseInt(e.target.value))}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Score"
                                  />
                                </div>
                                
                                {/* {activeOptionEditors[`${index}-${optionIndex}`] && ( */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Feedback (Rich Content)
                                    </label>
                                    <ReactQuill
                                      ref={(el) => quillRefs.current[`option-${index}-${optionIndex}`] = el}
                                      value={option.feedback || ''}
                                      onChange={(content) => handleOptionChange(index, optionIndex, 'feedback', content)}
                                      // //modules={modules}
                                      placeholder="Enter rich feedback content for this option..."
                                      theme="snow"
                                      className="mb-4"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      This rich content will be displayed in the PDF report when this option is selected.
                                    </p>
                                  </div>
                                {/* )} */}
                              </div>
                            ))}
                            
                            {(!question.options || question.options.length === 0) && (
                              <button
                                onClick={() => handleAddOption(index)}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
                              >
                                + Add Option
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Other question type specific fields would go here */}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Points
                          </label>
                          <input
                            type="number"
                            value={question.points || 10}
                            onChange={(e) => handleQuestionChange(index, 'points', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Points"
                            min={0}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time Limit (seconds, optional)
                          </label>
                          <input
                            type="number"
                            value={question.time_limit || ''}
                            onChange={(e) => handleQuestionChange(index, 'time_limit', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Time limit in seconds"
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleContinueToDetails}
              className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Continue to Details
            </button>
          </div>
        </div>
      )}
      
      {/* Details Step */}
      {activeStep === 'details' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">GoForm Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => handleQuizChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter GoForm title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={quiz.description || ''}
                  onChange={(e) => handleQuizChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter GoForm description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={quiz.category || ''}
                    onChange={(e) => handleQuizChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select a category</option>
                    {QUIZ_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={quiz.is_published}
                        onChange={(e) => handleQuizChange('is_published', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Published</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <button
                  onClick={() => setExpandedSettings(!expandedSettings)}
                  className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                >
                  {expandedSettings ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  <Settings className="h-4 w-4 mr-1" />
                  Advanced Settings
                </button>
                
                {expandedSettings && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Limit (minutes, optional)
                        </label>
                        <input
                          type="number"
                          value={quiz.time_limit || ''}
                          onChange={(e) => handleQuizChange('time_limit', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Time limit in minutes"
                          min={0}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passing Score (%, optional)
                        </label>
                        <input
                          type="number"
                          value={quiz.passing_score || ''}
                          onChange={(e) => handleQuizChange('passing_score', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Passing score percentage"
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handleBackToQuestions}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Questions
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-6 py-3 rounded-lg ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save GoForm
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share GoForm</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Share URL
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleCopyShareUrl}
                  className="px-3 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700"
                >
                  {copied ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}