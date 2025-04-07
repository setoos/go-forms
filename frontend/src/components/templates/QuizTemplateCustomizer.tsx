import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Clock, 
  FileQuestion, 
  Users, 
  Award, 
  MessageSquare, 
  Sliders, 
  Tag, 
  AlertCircle, 
  Loader, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Copy, 
  Download, 
  FileText
} from 'lucide-react';
import { showToast } from '../../lib/toast';
import { useAuth } from '../../lib/auth';

// Audience levels
const audienceLevels = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
  { id: 'expert', name: 'Expert' },
  { id: 'all', name: 'All Levels' }
];

// Question types
const questionTypes = [
  { id: 'multiple_choice', name: 'Multiple Choice' },
  { id: 'true_false', name: 'True/False' },
  { id: 'fill_blank', name: 'Fill in the Blank' },
  { id: 'short_answer', name: 'Short Answer' },
  { id: 'matching', name: 'Matching' },
  { id: 'scenario', name: 'Scenario-based' },
  { id: 'rating_scale', name: 'Rating Scale' },
  { id: 'code_completion', name: 'Code Completion' }
];

// Feedback types
const feedbackTypes = [
  { id: 'immediate', name: 'Immediate (after each question)' },
  { id: 'end_of_quiz', name: 'End of Quiz' },
  { id: 'detailed', name: 'Detailed (with explanations)' }
];

// Mock function to get template by ID
const getTemplateById = (id: string) => {
  // This would normally be an API call
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
    ]
  };
};

export default function QuizTemplateCustomizer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Get template ID from URL query params
  const queryParams = new URLSearchParams(location.search);
  const templateId = queryParams.get('template');
  
  // Template state
  const [template, setTemplate] = useState<any>(null);
  const [customizedTemplate, setCustomizedTemplate] = useState<any>({
    title: '',
    description: '',
    audienceLevel: '',
    duration: 30,
    passingScore: 70,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    selectedQuestionTypes: [] as string[],
    brandingOptions: {
      logo: '',
      primaryColor: '#6b21a8',
      showHeader: true,
      showFooter: true
    }
  });
  
  // Load template data
  useEffect(() => {
    if (!templateId) {
      setError('No template selected');
      setLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      try {
        const templateData = getTemplateById(templateId);
        setTemplate(templateData);
        
        // Initialize customized template with template defaults
        setCustomizedTemplate({
          title: templateData.title,
          description: templateData.description,
          audienceLevel: templateData.audienceLevel,
          duration: templateData.duration,
          passingScore: templateData.passingScore,
          certificateEnabled: templateData.certificateEnabled,
          analyticsEnabled: templateData.analyticsEnabled,
          feedbackType: templateData.feedbackType,
          selectedQuestionTypes: [...templateData.questionTypes],
          brandingOptions: {
            logo: '',
            primaryColor: '#6b21a8',
            showHeader: true,
            showFooter: true
          }
        });
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load template');
        setLoading(false);
      }
    }, 800);
  }, [templateId]);
  
  const handleInputChange = (field: string, value: any) => {
    setCustomizedTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleBrandingChange = (field: string, value: any) => {
    setCustomizedTemplate(prev => ({
      ...prev,
      brandingOptions: {
        ...prev.brandingOptions,
        [field]: value
      }
    }));
  };
  
  const toggleQuestionType = (type: string) => {
    setCustomizedTemplate(prev => {
      const currentTypes = [...prev.selectedQuestionTypes];
      
      if (currentTypes.includes(type)) {
        return {
          ...prev,
          selectedQuestionTypes: currentTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          selectedQuestionTypes: [...currentTypes, type]
        };
      }
    });
  };
  
  const handleSaveTemplate = async () => {
    if (!customizedTemplate.title.trim()) {
      showToast('Please enter a title for your quiz', 'error');
      return;
    }
    
    if (customizedTemplate.selectedQuestionTypes.length === 0) {
      showToast('Please select at least one question type', 'error');
      return;
    }
    
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      showToast('Quiz template customized successfully!', 'success');
      setSaving(false);
      navigate('/admin/quizzes');
    }, 1500);
  };
  
  const handlePreview = () => {
    showToast('Preview functionality would be implemented here', 'info');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }
  
  if (error || !template) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Error</h3>
          <p className="text-gray-500 mb-6">{error || 'Template not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-600 hover:text-text rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text">Customize Template</h1>
            <p className="text-gray-600">Adapt this template to fit your specific needs</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreview}
            className="flex items-center px-4 py-2 border border-border rounded-lg text-text hover:bg-gray-50"
          >
            <Eye className="h-5 w-5 mr-2" />
            Preview
          </button>
          <button
            onClick={handleSaveTemplate}
            disabled={saving}
            className={`flex items-center px-4 py-2 rounded-lg ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-secondary hover:bg-primary'
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
                Save Quiz
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Template Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Image */}
          <div className="bg-background rounded-lg shadow-md overflow-hidden">
            <img 
              src={template.previewImage} 
              alt={template.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="font-semibold text-lg text-text">Based on: {template.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
          </div>
          
          {/* Template Details */}
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Original Template Details</h2>
            
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
                <span className="font-medium capitalize">{template.audienceLevel}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Award className="h-4 w-4 mr-2" />
                  Passing Score
                </div>
                <span className="font-medium">{template.passingScore}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback Type
                </div>
                <span className="font-medium capitalize">{template.feedbackType.replace(/_/g, ' ')}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-text mb-2">Question Types</h3>
              <div className="flex flex-wrap gap-2">
                {template.questionTypes.map(type => (
                  <span key={type} className="px-2 py-1 bg-accent text-primary text-xs rounded-full">
                    {questionTypes.find(t => t.id === type)?.name || type}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Help Box */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Customization Tips</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Customize the title and description to match your specific needs</li>
                    <li>Adjust the duration based on your audience's availability</li>
                    <li>Select question types that best assess your learning objectives</li>
                    <li>Add your branding to create a consistent experience</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content - Customization Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={customizedTemplate.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  placeholder="Enter quiz title"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={customizedTemplate.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  placeholder="Enter quiz description"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="audienceLevel" className="block text-sm font-medium text-text mb-1">
                    Audience Level
                  </label>
                  <select
                    id="audienceLevel"
                    value={customizedTemplate.audienceLevel}
                    onChange={(e) => handleInputChange('audienceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  >
                    {audienceLevels.map(level => (
                      <option key={level.id} value={level.id}>{level.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-text mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    value={customizedTemplate.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    min={5}
                    max={180}
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Question Types */}
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Question Types</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select the question types you want to include in your quiz:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {questionTypes.map(type => (
                <div key={type.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`question-type-${type.id}`}
                    checked={customizedTemplate.selectedQuestionTypes.includes(type.id)}
                    onChange={() => toggleQuestionType(type.id)}
                    className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                  />
                  <label htmlFor={`question-type-${type.id}`} className="ml-2 block text-sm text-text">
                    {type.name}
                  </label>
                </div>
              ))}
            </div>
            
            {customizedTemplate.selectedQuestionTypes.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                Please select at least one question type
              </p>
            )}
          </div>
          
          {/* Scoring and Feedback */}
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Scoring and Feedback</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="passingScore" className="block text-sm font-medium text-text mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  id="passingScore"
                  value={customizedTemplate.passingScore}
                  onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                />
              </div>
              
              <div>
                <label htmlFor="feedbackType" className="block text-sm font-medium text-text mb-1">
                  Feedback Type
                </label>
                <select
                  id="feedbackType"
                  value={customizedTemplate.feedbackType}
                  onChange={(e) => handleInputChange('feedbackType', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                >
                  {feedbackTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="certificateEnabled"
                  checked={customizedTemplate.certificateEnabled}
                  onChange={(e) => handleInputChange('certificateEnabled', e.target.checked)}
                  className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                />
                <label htmlFor="certificateEnabled" className="ml-2 block text-sm text-text">
                  Enable completion certificates
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="analyticsEnabled"
                  checked={customizedTemplate.analyticsEnabled}
                  onChange={(e) => handleInputChange('analyticsEnabled', e.target.checked)}
                  className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                />
                <label htmlFor="analyticsEnabled" className="ml-2 block text-sm text-text">
                  Enable detailed analytics and reporting
                </label>
              </div>
            </div>
          </div>
          
          {/* Branding */}
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Branding</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-text mb-1">
                  Logo URL (optional)
                </label>
                <input
                  type="text"
                  id="logo"
                  value={customizedTemplate.brandingOptions.logo}
                  onChange={(e) => handleBrandingChange('logo', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-text mb-1">
                  Primary Color
                </label>
                <div className="flex">
                  <input
                    type="color"
                    id="primaryColor"
                    value={customizedTemplate.brandingOptions.primaryColor}
                    onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                    className="h-10 w-10 border border-border rounded-l-md"
                  />
                  <input
                    type="text"
                    value={customizedTemplate.brandingOptions.primaryColor}
                    onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-r-md focus:ring-secondary focus:border-secondary"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showHeader"
                  checked={customizedTemplate.brandingOptions.showHeader}
                  onChange={(e) => handleBrandingChange('showHeader', e.target.checked)}
                  className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                />
                <label htmlFor="showHeader" className="ml-2 block text-sm text-text">
                  Show header with logo and title
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showFooter"
                  checked={customizedTemplate.brandingOptions.showFooter}
                  onChange={(e) => handleBrandingChange('showFooter', e.target.checked)}
                  className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                />
                <label htmlFor="showFooter" className="ml-2 block text-sm text-text">
                  Show footer with branding
                </label>
              </div>
            </div>
          </div>
          
          {/* Sample Questions Preview */}
          <div className="bg-background rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Sample Questions</h2>
              <button
                onClick={() => navigate(`/admin/quizzes/new?template=${template.id}&edit=questions`)}
                className="text-sm text-secondary hover:text-primary flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Questions
              </button>
            </div>
            
            <div className="space-y-4">
              {template.sampleQuestions.slice(0, 2).map((question, index) => (
                <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center mr-2">
                      <span className="text-secondary font-medium">{index + 1}</span>
                    </div>
                    <span className="font-medium">{question.text}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-8">
                    {questionTypes.find(t => t.id === question.type)?.name || question.type}
                  </div>
                </div>
              ))}
              
              {template.sampleQuestions.length > 2 && (
                <div className="text-center py-2">
                  <button
                    onClick={() => navigate(`/admin/quizzes/new?template=${template.id}&edit=questions`)}
                    className="text-sm text-secondary hover:text-primary"
                  >
                    + {template.sampleQuestions.length - 2} more questions
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-border rounded-lg text-text hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className={`flex items-center px-4 py-2 rounded-lg ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-secondary hover:bg-primary'
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
                  Save Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}