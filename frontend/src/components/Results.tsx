import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Brain, 
  Download, 
  ArrowRight, 
  Send, 
  FileSpreadsheet, 
  Mail, 
  Clock, 
  ArrowLeft,
  Share2,
  Edit3,
  Save,
  Eye,
  Check,
  Loader
} from 'lucide-react';
import { calculateScore, getScoreResponse } from '../lib/utils';
import { generatePDF } from '../lib/pdf';
import { sendResultsEmail } from '../lib/email';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { processTemplateVariables } from '../lib/htmlSanitizer';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ResultsProps {
  isAdmin?: boolean;
}

function Results({ isAdmin = false }: ResultsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [customFeedback, setCustomFeedback] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizId, setQuizId] = useState<string | null>(null);
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);
  
  const answers = location.state?.answers || {};
  const score = location.state?.score || calculateScore(answers);
  const completionTime = location.state?.completionTime;
  const isSampleQuiz = location.state?.isSampleQuiz || false;
  const showUserInfoForm = location.state?.showUserInfoForm || false;
  const { message, recommendation } = getScoreResponse(score);

  useEffect(() => {
    if (isAdmin) {
      loadTemplates();
    }
    
    if (location.state?.quizId) {
      setQuizId(location.state.quizId);
      loadQuizInfo(location.state.quizId);
    }
    
    if (location.state?.userInfo) {
      setUserInfo(location.state.userInfo);
    }
    
    if (!showUserInfoForm && userInfo.email && !emailSent) {
      handleSendEmail();
    }
  }, [userInfo.email, showUserInfoForm, isAdmin, location.state?.quizId, location.state?.userInfo]);

  const loadQuizInfo = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('title')
        .eq('id', quizId)
        .single();
        
      if (error) throw error;
      if (data) {
        setQuizTitle(data.title);
      }
      
      // Check if there's a default template for this quiz
      const { data: templateData, error: templateError } = await supabase
        .from('report_templates')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('is_default', true)
        .maybeSingle();
        
      if (!templateError && templateData) {
        setAppliedTemplate(templateData.id);
        try {
          const parsedContent = JSON.parse(templateData.content);
          if (Array.isArray(parsedContent)) {
            const processedContent = parsedContent.map(s => {
              // Replace template variables
              let content = s.content
                .replace(/{{name}}/g, userInfo.name || 'User')
                .replace(/{{email}}/g, userInfo.email || 'user@example.com')
                .replace(/{{score}}/g, score.toString())
                .replace(/{{date}}/g, new Date().toLocaleDateString())
                .replace(/{{time}}/g, completionTime ? `${Math.floor(completionTime / 60)}:${String(completionTime % 60).padStart(2, '0')}` : '0:00')
                .replace(/{{quiz_title}}/g, quizTitle || 'Quiz')
                .replace(/{{performance_category}}/g, score >= 90 ? 'Excellent' : 
                                                      score >= 80 ? 'Very Good' : 
                                                      score >= 70 ? 'Good' : 
                                                      score >= 60 ? 'Satisfactory' : 'Needs Improvement');
              
              return `<h3>${s.title}</h3>${content}`;
            }).join('');
            
            setCustomFeedback(processedContent);
          } else {
            setCustomFeedback(templateData.content);
          }
        } catch (e) {
          setCustomFeedback(templateData.content);
        }
      } else {
        // If no quiz-specific template, check for global default
        const { data: globalTemplate, error: globalError } = await supabase
          .from('report_templates')
          .select('*')
          .is('quiz_id', null)
          .eq('is_default', true)
          .maybeSingle();
          
        if (!globalError && globalTemplate) {
          setAppliedTemplate(globalTemplate.id);
          try {
            const parsedContent = JSON.parse(globalTemplate.content);
            if (Array.isArray(parsedContent)) {
              const processedContent = parsedContent.map(s => {
                // Replace template variables
                let content = s.content
                  .replace(/{{name}}/g, userInfo.name || 'User')
                  .replace(/{{email}}/g, userInfo.email || 'user@example.com')
                  .replace(/{{score}}/g, score.toString())
                  .replace(/{{date}}/g, new Date().toLocaleDateString())
                  .replace(/{{time}}/g, completionTime ? `${Math.floor(completionTime / 60)}:${String(completionTime % 60).padStart(2, '0')}` : '0:00')
                  .replace(/{{quiz_title}}/g, quizTitle || 'Quiz')
                  .replace(/{{performance_category}}/g, score >= 90 ? 'Excellent' : 
                                                        score >= 80 ? 'Very Good' : 
                                                        score >= 70 ? 'Good' : 
                                                        score >= 60 ? 'Satisfactory' : 'Needs Improvement');
                
                return `<h3>${s.title}</h3>${content}`;
              }).join('');
              
              setCustomFeedback(processedContent);
            } else {
              setCustomFeedback(globalTemplate.content);
            }
          } catch (e) {
            setCustomFeedback(globalTemplate.content);
          }
        }
      }
    } catch (error) {
      console.error('Error loading quiz info:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      showToast('Failed to load templates', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!isSampleQuiz && quizId) {
        const { error } = await supabase
          .from('quiz_responses')
          .insert({
            quiz_id: quizId,
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            answers,
            score,
            completion_time: completionTime,
            custom_feedback: customFeedback
          });

        if (error) throw error;
      }

      const response = {
        id: crypto.randomUUID(),
        quiz_id: quizId,
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        answers,
        score,
        completion_time: completionTime,
        timestamp: new Date().toISOString(),
        custom_feedback: customFeedback
      };

      await handleSendEmail(response);
      
      // Navigate to success page
      navigate('/results/success', { 
        state: { 
          response,
          timestamp: new Date().toISOString(),
          score,
          quizTitle,
          email: userInfo.email,
          action: 'save'
        }
      });
    } catch (error) {
      console.error('Error saving results:', error);
      showToast('Failed to save results', 'error');
      setSaving(false);
    }
  };

  const handleSendEmail = async (response?: any) => {
    if (sendingEmail) return;
    setSendingEmail(true);

    try {
      const emailResponse = await sendResultsEmail(response || {
        id: crypto.randomUUID(),
        quiz_id: quizId,
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        answers,
        score,
        completion_time: completionTime,
        timestamp: new Date().toISOString(),
        custom_feedback: customFeedback
      });

      if (emailResponse) {
        setEmailSent(true);
        
        // Navigate to success page
        navigate('/results/success', { 
          state: { 
            response: response || {
              id: crypto.randomUUID(),
              quiz_id: quizId,
              name: userInfo.name,
              email: userInfo.email,
              phone: userInfo.phone,
              answers,
              score,
              completion_time: completionTime,
              timestamp: new Date().toISOString(),
              custom_feedback: customFeedback
            },
            timestamp: new Date().toISOString(),
            score,
            quizTitle,
            email: response?.email || userInfo.email,
            action: 'email'
          }
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email. Please try again later.', 'error');
      setSendingEmail(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'csv') => {
    try {
      if (format === 'pdf') {
        await generatePDF({
          id: crypto.randomUUID(),
          quiz_id: quizId || '',
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          answers,
          score,
          completion_time: completionTime,
          timestamp: new Date().toISOString(),
          custom_feedback: customFeedback
        });
      } else {
        const csvContent = [
          ['Question', 'Score'],
          ...Object.entries(answers).map(([q, s]) => [q, s])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-results-${new Date().toISOString()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      showToast(`Results downloaded successfully!`, 'success');
    } catch (error) {
      console.error('Error downloading results:', error);
      showToast('Failed to download results', 'error');
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('content')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      if (data) {
        try {
          const parsedContent = JSON.parse(data.content);
          if (Array.isArray(parsedContent)) {
            // Process template variables
            const processedContent = parsedContent.map(s => {
              // Replace template variables
              let content = s.content
                .replace(/{{name}}/g, userInfo.name || 'User')
                .replace(/{{email}}/g, userInfo.email || 'user@example.com')
                .replace(/{{score}}/g, score.toString())
                .replace(/{{date}}/g, new Date().toLocaleDateString())
                .replace(/{{time}}/g, completionTime ? `${Math.floor(completionTime / 60)}:${String(completionTime % 60).padStart(2, '0')}` : '0:00')
                .replace(/{{quiz_title}}/g, quizTitle || 'Quiz')
                .replace(/{{performance_category}}/g, score >= 90 ? 'Excellent' : 
                                                      score >= 80 ? 'Very Good' : 
                                                      score >= 70 ? 'Good' : 
                                                      score >= 60 ? 'Satisfactory' : 'Needs Improvement');
              
              return `<h3>${s.title}</h3>${content}`;
            }).join('');
            
            setCustomFeedback(processedContent);
          } else {
            // Process template variables for non-array content
            let processedContent = data.content
              .replace(/{{name}}/g, userInfo.name || 'User')
              .replace(/{{email}}/g, userInfo.email || 'user@example.com')
              .replace(/{{score}}/g, score.toString())
              .replace(/{{date}}/g, new Date().toLocaleDateString())
              .replace(/{{time}}/g, completionTime ? `${Math.floor(completionTime / 60)}:${String(completionTime % 60).padStart(2, '0')}` : '0:00')
              .replace(/{{quiz_title}}/g, quizTitle || 'Quiz')
              .replace(/{{performance_category}}/g, score >= 90 ? 'Excellent' : 
                                                    score >= 80 ? 'Very Good' : 
                                                    score >= 70 ? 'Good' : 
                                                    score >= 60 ? 'Satisfactory' : 'Needs Improvement');
            
            setCustomFeedback(processedContent);
          }
        } catch (e) {
          // Process template variables for plain text content
          let processedContent = data.content
            .replace(/{{name}}/g, userInfo.name || 'User')
            .replace(/{{email}}/g, userInfo.email || 'user@example.com')
            .replace(/{{score}}/g, score.toString())
            .replace(/{{date}}/g, new Date().toLocaleDateString())
            .replace(/{{time}}/g, completionTime ? `${Math.floor(completionTime / 60)}:${String(completionTime % 60).padStart(2, '0')}` : '0:00')
            .replace(/{{quiz_title}}/g, quizTitle || 'Quiz')
            .replace(/{{performance_category}}/g, score >= 90 ? 'Excellent' : 
                                                  score >= 80 ? 'Very Good' : 
                                                  score >= 70 ? 'Good' : 
                                                  score >= 60 ? 'Satisfactory' : 'Needs Improvement');
          
          setCustomFeedback(processedContent);
        }
        setAppliedTemplate(templateId);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      showToast('Failed to load template', 'error');
    }
  };

  const saveTemplate = async () => {
    try {
      if (!templateName) {
        showToast('Please enter a template name', 'error');
        return;
      }
      
      const { error } = await supabase
        .from('report_templates')
        .insert({
          name: templateName,
          content: customFeedback,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          quiz_id: quizId
        });

      if (error) throw error;
      showToast('Template saved successfully!', 'success');
      loadTemplates();
      setTemplateName('');
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Failed to save template', 'error');
    }
  };

  const setTemplateAsDefault = async () => {
    if (!appliedTemplate) return;
    
    try {
      // First, unset any existing default for this quiz
      if (quizId) {
        await supabase
          .from('report_templates')
          .update({ is_default: false })
          .eq('quiz_id', quizId)
          .eq('is_default', true);
      } else {
        await supabase
          .from('report_templates')
          .update({ is_default: false })
          .is('quiz_id', null)
          .eq('is_default', true);
      }
      
      // Then set this template as default
      const { error } = await supabase
        .from('report_templates')
        .update({ is_default: true })
        .eq('id', appliedTemplate);
        
      if (error) throw error;
      
      showToast('Template set as default successfully!', 'success');
    } catch (error) {
      console.error('Error setting template as default:', error);
      showToast('Failed to set template as default', 'error');
    }
  };

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
          .from('template-images')
          .upload(`public/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        // Get public URL
        const { data: publicURL } = supabase.storage
          .from('template-images')
          .getPublicUrl(`public/${fileName}`);
        
        if (!publicURL) throw new Error('Failed to get public URL');
        
        // Insert image into editor
        setCustomFeedback(prev => `${prev}<p><img src="${publicURL.publicUrl}" alt="Uploaded image" style="max-width: 100%; height: auto;" /></p>`);
        
        showToast('Image uploaded successfully', 'success');
      } catch (error) {
        console.error('Error uploading image:', error);
        showToast('Failed to upload image', 'error');
      }
    };
    
    // Trigger file selection
    input.click();
  };

  if (showUserInfoForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <Brain className="h-16 w-16 text-purple-600" />
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Quiz Complete!
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Please provide your details to view your results and get your personalized report.
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

              <button
                type="submit"
                disabled={saving}
                className={`w-full flex items-center justify-center px-6 py-3 rounded-lg ${
                  saving
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white transition-colors`}
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    View Results
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Brain className="h-16 w-16 text-purple-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Your Results
                </h1>
                <p className="text-gray-600">
                  {quizTitle ? `${quizTitle} - ` : ''}Detailed analysis of your performance
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50"
              >
                {editMode ? <Eye className="w-5 h-5 mr-2" /> : <Edit3 className="w-5 h-5 mr-2" />}
                {editMode ? 'Preview' : 'Edit'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {score}
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              <p className="text-gray-600">Overall Score</p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {Object.keys(answers).length}
              </div>
              <p className="text-gray-600">Questions Answered</p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {Math.floor(completionTime / 60)}:{String(completionTime % 60).padStart(2, '0')}
              </div>
              <p className="text-gray-600">Completion Time</p>
            </div>
          </div>

          {editMode ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Customize Feedback</h2>
                <div className="flex items-center space-x-4">
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    onChange={(e) => loadTemplate(e.target.value)}
                    value={appliedTemplate || ''}
                  >
                    <option value="">Load Template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template name"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={saveTemplate}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save Template
                    </button>
                  </div>
                </div>
              </div>
              <ReactQuill
                value={customFeedback}
                onChange={setCustomFeedback}
                className="bg-white rounded-lg"
                modules={{
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
                }}
              />
              {appliedTemplate && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={setTemplateAsDefault}
                    className="flex items-center px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Set as Default Template
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback & Recommendations</h2>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                {customFeedback ? (
                  <div 
                    className="prose max-w-none" 
                    dangerouslySetInnerHTML={{ 
                      __html: processTemplateVariables(customFeedback, {
                        name: userInfo.name || 'User',
                        email: userInfo.email || 'user@example.com',
                        score: score.toString(),
                        date: new Date().toLocaleDateString(),
                        time: completionTime ? `${Math.floor(completionTime / 60)}:${String(completionTime % 60).padStart(2, '0')}` : '0:00',
                        quiz_title: quizTitle || 'Quiz',
                        performance_category: score >= 90 ? 'Excellent' : 
                                              score >= 80 ? 'Very Good' : 
                                              score >= 70 ? 'Good' : 
                                              score >= 60 ? 'Satisfactory' : 'Needs Improvement'
                      })
                    }} 
                  />
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{message}</h3>
                    <p className="text-gray-600">{recommendation}</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Analysis</h2>
              <div className="space-y-4">
                {Object.entries(answers).map(([questionId, score]) => (
                  <div key={questionId} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Question {parseInt(questionId) + 1}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        Number(score) >= 7 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(Number(score) / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Score Distribution</h2>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Bar
                  data={{
                    labels: ['0-2', '3-4', '5-6', '7-8', '9-10'],
                    datasets: [{
                      label: 'Questions by Score Range',
                      data: [
                        Object.values(answers).filter(s => Number(s) >= 0 && Number(s) <= 2).length,
                        Object.values(answers).filter(s => Number(s) >= 3 && Number(s) <= 4).length,
                        Object.values(answers).filter(s => Number(s) >= 5 && Number(s) <= 6).length,
                        Object.values(answers).filter(s => Number(s) >= 7 && Number(s) <= 8).length,
                        Object.values(answers).filter(s => Number(s) >= 9 && Number(s) <= 10).length
                      ],
                      backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(249, 115, 22, 0.7)',
                        'rgba(234, 179, 8, 0.7)',
                        'rgba(34, 197, 94, 0.7)',
                        'rgba(16, 185, 129, 0.7)'
                      ]
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleDownload('pdf')}
                className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Full Report
              </button>

              <button
                onClick={() => handleDownload('csv')}
                className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Download CSV Data
              </button>
            </div>

            {!emailSent && (
              <button
                onClick={() => handleSendEmail()}
                disabled={sendingEmail}
                className={`flex items-center justify-center px-6 py-3 border-2 border-purple-600 rounded-lg transition-colors ${
                  sendingEmail
                    ? 'text-gray-400 border-gray-400 cursor-not-allowed'
                    : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                {sendingEmail ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Send Results to Email
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => window.navigator.share({
                title: 'My Quiz Results',
                text: `I scored ${score}% on the quiz!`,
                url: window.location.href
              }).catch(() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard!', 'success');
              })}
              className="flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Results
            </button>

            {isSampleQuiz ? (
              <button 
                onClick={() => navigate('/auth')}
                className="flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Sign Up to Create Your Own Quiz
              </button>
            ) : (
              <button 
                onClick={() => navigate('/')}
                className="flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Take Another Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;