import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  FileQuestion, 
  Award, 
  BarChart, 
  CheckCircle, 
  Download, 
  Copy, 
  AlertCircle, 
  Loader, 
  Tag, 
  Sliders, 
  MessageSquare, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { showToast } from '../../lib/toast';

// Question type mapping for display
const questionTypeLabels: Record<string, string> = {
  'multiple_choice': 'Multiple Choice',
  'true_false': 'True/False',
  'fill_blank': 'Fill in the Blank',
  'short_answer': 'Short Answer',
  'matching': 'Matching',
  'scenario': 'Scenario-based',
  'rating_scale': 'Rating Scale',
  'code_completion': 'Code Completion'
};

// Audience levels
const audienceLevels: Record<string, string> = {
  'beginner': 'Beginner',
  'intermediate': 'Intermediate',
  'advanced': 'Advanced',
  'expert': 'Expert',
  'all': 'All Levels'
};

// Mock quiz templates data - this would normally come from a database
const getTemplateById = (id: string) => {
  // This is a simplified version - in a real app, you'd fetch this from an API
  return {
    id: 'math-algebra-basics',
    title: 'Algebra Basics Quiz',
    description: 'Fundamental algebra concepts assessment with equation solving and graphing problems',
    category: 'academic',
    subcategory: 'math',
    audienceLevel: 'intermediate',
    duration: 30, // minutes
    questionCount: 15,
    questionTypes: ['multiple_choice', 'fill_blank', 'matching'],
    scoringMethod: 'percentage',
    passingScore: 70,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['algebra', 'mathematics', 'equations', 'academic'],
    previewImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070',
    popularity: 4.8,
    usageCount: 1245,
    lastUpdated: '2025-04-15',
    sampleQuestions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        text: 'Solve for x: 2x + 5 = 13',
        options: [
          { id: 'a', text: 'x = 4', isCorrect: true },
          { id: 'b', text: 'x = 6', isCorrect: false },
          { id: 'c', text: 'x = 8', isCorrect: false },
          { id: 'd', text: 'x = 9', isCorrect: false }
        ]
      },
      {
        id: 'q2',
        type: 'fill_blank',
        text: 'The slope of a line can be calculated using the formula m = ______.',
        answer: 'rise/run'
      },
      {
        id: 'q3',
        type: 'matching',
        text: 'Match each equation with its graph type:',
        pairs: [
          { left: 'y = mx + b', right: 'Line' },
          { left: 'y = x²', right: 'Parabola' },
          { left: 'x² + y² = r²', right: 'Circle' }
        ]
      }
    ],
    features: [
      'Automatic scoring and grading',
      'Detailed performance analytics',
      'Customizable passing threshold',
      'Certificate generation',
      'Question randomization',
      'Timed assessment option',
      'Mobile-responsive design'
    ],
    reportingMetrics: [
      'Overall score and pass/fail status',
      'Time spent per question',
      'Question difficulty analysis',
      'Concept mastery breakdown',
      'Comparison to peer performance',
      'Historical performance tracking'
    ]
  };
};

export default function QuizTemplatePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'features' | 'reporting'>('overview');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) {
      setError('Template ID is required');
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      try {
        const templateData = getTemplateById(id);
        setTemplate(templateData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load template');
        setLoading(false);
      }
    }, 800);
  }, [id]);

  const handleUseTemplate = () => {
    if (!template) return;
    navigate(`/admin/quizzes/new?template=${template.id}`);
    showToast('Template selected. Customize your quiz now.', 'success');
  };

  const handleDownload = () => {
    if (!template) return;
    showToast('Template downloaded successfully', 'success');
  };

  const handleCopyTemplateId = () => {
    if (!template) return;
    navigator.clipboard.writeText(template.id);
    showToast('Template ID copied to clipboard', 'success');
  };

  const toggleQuestionExpand = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-500 mb-6">{error || 'Template not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Back Button */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
          <p className="text-gray-600">{template.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Image */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img 
              src={template.previewImage} 
              alt={template.title}
              className="w-full h-48 object-cover"
            />
          </div>

          {/* Template Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Template Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  Duration
                </div>
                <span className="font-medium">{template.duration} minutes</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Questions
                </div>
                <span className="font-medium">{template.questionCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  Audience Level
                </div>
                <span className="font-medium">{audienceLevels[template.audienceLevel]}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Award className="h-4 w-4 mr-2" />
                  Passing Score
                </div>
                <span className="font-medium">{template.passingScore ? `${template.passingScore}%` : 'N/A'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback Type
                </div>
                <span className="font-medium capitalize">{template.feedbackType.replace(/_/g, ' ')}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Award className="h-4 w-4 mr-2" />
                  Certificate
                </div>
                <span className={`font-medium ${template.certificateEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {template.certificateEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <BarChart className="h-4 w-4 mr-2" />
                  Analytics
                </div>
                <span className={`font-medium ${template.analyticsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {template.analyticsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={handleUseTemplate}
              className="w-full mb-3 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Use This Template
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-5 w-5 mr-2" />
                Download
              </button>
              
              <button
                onClick={handleCopyTemplateId}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Copy className="h-5 w-5 mr-2" />
                Copy ID
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'questions'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sample Questions
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'features'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => setActiveTab('reporting')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'reporting'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reporting
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Template Overview</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="text-gray-600">{template.description}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Question Types</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {template.questionTypes.map(type => (
                        <div key={type} className="bg-gray-50 p-3 rounded-lg flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                            <span className="text-purple-600 font-medium">{type.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium">{questionTypeLabels[type]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Scoring and Feedback</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Scoring Method</p>
                          <p className="font-medium capitalize">{template.scoringMethod}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Passing Score</p>
                          <p className="font-medium">{template.passingScore ? `${template.passingScore}%` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Feedback Type</p>
                          <p className="font-medium capitalize">{template.feedbackType.replace(/_/g, ' ')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Certificate</p>
                          <p className="font-medium">{template.certificateEnabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Usage Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-500">Popularity</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg 
                                key={i} 
                                className={`h-4 w-4 ${i < Math.floor(template.popularity) ? 'text-yellow-400' : 'text-gray-300'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-2xl font-bold">{template.popularity.toFixed(1)}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Total Uses</p>
                        <p className="text-2xl font-bold">{template.usageCount.toLocaleString()}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                        <p className="text-2xl font-bold">{template.lastUpdated}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sample Questions Tab */}
              {activeTab === 'questions' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Sample Questions</h2>
                  <p className="text-gray-600 mb-6">
                    Below are sample questions included in this template. When you use this template, 
                    you'll be able to customize these questions or add your own.
                  </p>
                  
                  <div className="space-y-4">
                    {template.sampleQuestions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                          onClick={() => toggleQuestionExpand(question.id)}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                              <span className="text-purple-600 font-medium">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{question.text}</p>
                              <p className="text-xs text-gray-500">
                                {questionTypeLabels[question.type]}
                              </p>
                            </div>
                          </div>
                          <button className="text-gray-500">
                            {expandedQuestions[question.id] ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        
                        {expandedQuestions[question.id] && (
                          <div className="p-4 bg-white">
                            {question.type === 'multiple_choice' && (
                              <div className="space-y-2">
                                {question.options.map(option => (
                                  <div 
                                    key={option.id} 
                                    className={`p-3 rounded-lg ${
                                      option.isCorrect 
                                        ? 'bg-green-50 border border-green-200' 
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center mr-3">
                                        {option.id}
                                      </div>
                                      <span>{option.text}</span>
                                      {option.isCorrect && (
                                        <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'fill_blank' && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="mb-2 font-medium">Answer:</p>
                                <div className="p-2 bg-green-50 border border-green-200 rounded">
                                  {question.answer}
                                </div>
                              </div>
                            )}
                            
                            {question.type === 'matching' && (
                              <div className="space-y-2">
                                {question.pairs.map((pair, i) => (
                                  <div key={i} className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                      {pair.left}
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                                      <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                                      {pair.right}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Features Tab */}
              {activeTab === 'features' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Template Features</h2>
                  <p className="text-gray-600 mb-6">
                    This template includes the following features to enhance your quiz experience:
                  </p>
                  
                  <div className="space-y-3">
                    {(showAllFeatures ? template.features : template.features.slice(0, 5)).map((feature, index) => (
                      <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {template.features.length > 5 && (
                    <button
                      onClick={() => setShowAllFeatures(!showAllFeatures)}
                      className="mt-4 text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {showAllFeatures ? 'Show Less' : `Show All (${template.features.length})`}
                    </button>
                  )}
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-3">Customization Options</h3>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="mb-4">
                        When you use this template, you'll be able to customize:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center">
                          <Sliders className="h-5 w-5 text-purple-600 mr-2" />
                          <span>Quiz duration and time limits</span>
                        </div>
                        <div className="flex items-center">
                          <FileQuestion className="h-5 w-5 text-purple-600 mr-2" />
                          <span>Question content and order</span>
                        </div>
                        <div className="flex items-center">
                          <Tag className="h-5 w-5 text-purple-600 mr-2" />
                          <span>Branding and appearance</span>
                        </div>
                        <div className="flex items-center">
                          <Award className="h-5 w-5 text-purple-600 mr-2" />
                          <span>Passing score requirements</span>
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                          <span>Feedback and explanations</span>
                        </div>
                        <div className="flex items-center">
                          <Layers className="h-5 w-5 text-purple-600 mr-2" />
                          <span>Certificate design</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Reporting Tab */}
              {activeTab === 'reporting' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Reporting & Analytics</h2>
                  <p className="text-gray-600 mb-6">
                    This template includes comprehensive reporting features to track performance and progress:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <BarChart className="h-6 w-6 text-purple-600 mr-2" />
                        <h3 className="font-medium">Performance Metrics</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {template.reportingMetrics.slice(0, 3).map((metric, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span>{metric}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <Users className="h-6 w-6 text-purple-600 mr-2" />
                        <h3 className="font-medium">Participant Analysis</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {template.reportingMetrics.slice(3).map((metric, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span>{metric}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Analytics Dashboard Preview</h3>
                    <div className="aspect-video bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-center p-4">
                        <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Analytics dashboard preview</p>
                        <p className="text-sm text-gray-400">
                          When you use this template, you'll get access to a comprehensive analytics dashboard
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        The analytics dashboard provides real-time insights into quiz performance, 
                        participant engagement, and learning outcomes. Export reports in CSV, PDF, 
                        or Excel format for further analysis or sharing with stakeholders.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-purple-50 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to use this template?</h3>
              <p className="text-gray-600 max-w-xl">
                Get started with this template and customize it to fit your specific needs.
              </p>
            </div>
            <button
              onClick={handleUseTemplate}
              className="mt-4 md:mt-0 flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}