import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Loader, 
  AlertCircle,
  Send,
  Edit,
  Save
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { format } from 'date-fns';
import { useAuth } from '../../lib/auth';
import { generatePDF } from '../../lib/pdf';
import { sendResultsEmail } from '../../lib/email';
import { processTemplateVariables } from '../../lib/htmlSanitizer';

interface QuizResponse {
  id: string;
  quiz_id: string;
  quiz_name: string;
  participant_name: string;
  participant_email: string;
  phone?: string;
  score: number;
  submission_date: string;
  completion_time: number;
  status: 'completed' | 'incomplete';
  answers: Record<string, any>;
  custom_feedback?: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options?: {
    id: string;
    text: string;
    is_correct: boolean;
    feedback?: string;
    score: number;
  }[];
}

export default function QuizResponseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [response, setResponse] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customFeedback, setCustomFeedback] = useState<string>('');
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadResponse();
      loadTemplates();
    }
  }, [user, id]);

  const loadResponse = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the response
      const { data: responseData, error: responseError } = await supabase
        .from('quiz_responses')
        .select(`
          id,
          quiz_id,
          name,
          email,
          phone,
          score,
          created_at,
          completion_time,
          answers,
          custom_feedback,
          quizzes (
            id,
            title,
            created_by
          )
        `)
        .eq('id', id)
        .single();

      if (responseError) throw responseError;

      // Verify that the quiz belongs to the current user
      if (responseData.quizzes?.created_by !== user?.id) {
        throw new Error('You do not have permission to view this response');
      }

      // Get the questions for this quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          id,
          text,
          type,
          options (
            id,
            text,
            is_correct,
            feedback,
            score
          )
        `)
        .eq('quiz_id', responseData.quiz_id)
        .order('order');

      if (questionsError) throw questionsError;

      // Format the response
      const formattedResponse: QuizResponse = {
        id: responseData.id,
        quiz_id: responseData.quiz_id,
        quiz_name: responseData.quizzes?.title || 'Unknown Quiz',
        participant_name: responseData.name,
        participant_email: responseData.email,
        phone: responseData.phone,
        score: responseData.score,
        submission_date: responseData.created_at,
        completion_time: responseData.completion_time || 0,
        status: responseData.completion_time ? 'completed' : 'incomplete',
        answers: responseData.answers || {},
        custom_feedback: responseData.custom_feedback
      };

      setResponse(formattedResponse);
      setQuestions(questionsData || []);
      setCustomFeedback(responseData.custom_feedback || '');
    } catch (error) {
      console.error('Error loading response:', error);
      setError(error instanceof Error ? error.message : 'Failed to load response');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter templates to only show those created by the current user or system templates
      const filteredTemplates = (data || []).filter(template => 
        !template.created_by || template.created_by === user?.id
      );
      
      setTemplates(filteredTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      showToast('Failed to load templates', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    if (!response) return;

    try {
      // Format the response data for PDF generation
      const pdfData = {
        id: response.id,
        name: response.participant_name,
        email: response.participant_email,
        phone: response.phone,
        quiz_id: response.quiz_id,
        score: response.score,
        completion_time: response.completion_time,
        timestamp: response.submission_date,
        answers: response.answers,
        custom_feedback: customFeedback
      };

      await generatePDF(pdfData);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    }
  };

  const handleSendEmail = async () => {
    if (!response) return;

    try {
      setSendingEmail(true);

      // Format the response data for email
      const emailData = {
        id: response.id,
        name: response.participant_name,
        email: response.participant_email,
        phone: response.phone,
        quiz_id: response.quiz_id,
        score: response.score,
        completion_time: response.completion_time,
        timestamp: response.submission_date,
        answers: response.answers,
        custom_feedback: customFeedback
      };

      const success = await sendResultsEmail(emailData);
      if (success) {
        showToast('Email sent successfully', 'success');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!response) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('quiz_responses')
        .update({
          custom_feedback: customFeedback
        })
        .eq('id', response.id);

      if (error) throw error;

      showToast('Feedback saved successfully', 'success');
      setEditingFeedback(false);
      
      // Update local state
      setResponse({
        ...response,
        custom_feedback: customFeedback
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      showToast('Failed to save feedback', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    if (!templateId) return;
    
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
              let content = processTemplateVariables(s.content, {
                name: response?.participant_name || 'User',
                email: response?.participant_email || 'user@example.com',
                score: response?.score.toString() || '0',
                date: new Date(response?.submission_date || Date.now()).toLocaleDateString(),
                time: response?.completion_time ? 
                  `${Math.floor(response.completion_time / 60)}:${String(response.completion_time % 60).padStart(2, '0')}` : 
                  '0:00',
                quiz_title: response?.quiz_name || 'Quiz',
                performance_category: response?.score >= 90 ? 'Excellent' : 
                                      response?.score >= 80 ? 'Very Good' : 
                                      response?.score >= 70 ? 'Good' : 
                                      response?.score >= 60 ? 'Satisfactory' : 'Needs Improvement'
              });
              
              return `<h3>${s.title}</h3>${content}`;
            }).join('');
            
            setCustomFeedback(processedContent);
          } else {
            // Process template variables for non-array content
            let processedContent = processTemplateVariables(data.content, {
              name: response?.participant_name || 'User',
              email: response?.participant_email || 'user@example.com',
              score: response?.score.toString() || '0',
              date: new Date(response?.submission_date || Date.now()).toLocaleDateString(),
              time: response?.completion_time ? 
                `${Math.floor(response.completion_time / 60)}:${String(response.completion_time % 60).padStart(2, '0')}` : 
                '0:00',
              quiz_title: response?.quiz_name || 'Quiz',
              performance_category: response?.score >= 90 ? 'Excellent' : 
                                    response?.score >= 80 ? 'Very Good' : 
                                    response?.score >= 70 ? 'Good' : 
                                    response?.score >= 60 ? 'Satisfactory' : 'Needs Improvement'
            });
            
            setCustomFeedback(processedContent);
          }
        } catch (e) {
          // Process template variables for plain text content
          let processedContent = processTemplateVariables(data.content, {
            name: response?.participant_name || 'User',
            email: response?.participant_email || 'user@example.com',
            score: response?.score.toString() || '0',
            date: new Date(response?.submission_date || Date.now()).toLocaleDateString(),
            time: response?.completion_time ? 
              `${Math.floor(response.completion_time / 60)}:${String(response.completion_time % 60).padStart(2, '0')}` : 
              '0:00',
            quiz_title: response?.quiz_name || 'Quiz',
            performance_category: response?.score >= 90 ? 'Excellent' : 
                                  response?.score >= 80 ? 'Very Good' : 
                                  response?.score >= 70 ? 'Good' : 
                                  response?.score >= 60 ? 'Satisfactory' : 'Needs Improvement'
          });
          
          setCustomFeedback(processedContent);
        }
        setSelectedTemplate(templateId);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      showToast('Failed to load template', 'error');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Find question by ID
  const getQuestionById = (questionId: string) => {
    return questions.find(q => q.id === questionId);
  };

  // Find option feedback by question ID and answer
  const getOptionFeedback = (questionId: string, answer: any) => {
    const question = getQuestionById(questionId);
    if (!question || question.type !== 'multiple_choice' || !answer.optionId) return null;
    
    const option = question.options?.find(o => o.id === answer.optionId);
    return option ? { feedback: option.feedback, score: option.score } : null;
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">You must be logged in to view this response</p>
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Error</h3>
          <p className="text-gray-500 mb-6">{error || 'Response not found'}</p>
          <button
            onClick={() => navigate('/admin/submissions')}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

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
      ]
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/admin/submissions')}
          className="mr-4 p-2 text-gray-600 hover:text-text rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">Quiz Response Details</h1>
          <p className="text-gray-600">{response.quiz_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Participant Information</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <User className="h-5 w-5 text-secondary mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-text">Name</p>
                <p className="text-text">{response.participant_name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-secondary mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-text">Email</p>
                <p className="text-text">{response.participant_email}</p>
              </div>
            </div>
            {response.phone && (
              <div className="flex items-start">
                <svg className="h-5 w-5 text-secondary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text">Phone</p>
                  <p className="text-text">{response.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-secondary mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-text">Submission Date</p>
                <p className="text-text">
                  {format(new Date(response.submission_date), 'MMMM d, yyyy')} at {format(new Date(response.submission_date), 'h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Quiz Information</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-secondary mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-text">Quiz Name</p>
                <p className="text-text">{response.quiz_name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-secondary mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-text">Completion Time</p>
                <p className="text-text">{formatDuration(response.completion_time)}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center mt-0.5 mr-3 ${
                response.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {response.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-text">Status</p>
                <p className="text-text">{response.status.charAt(0).toUpperCase() + response.status.slice(1)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Score Summary</h2>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl font-bold text-secondary mb-2">
              {response.score}%
            </div>
            <p className="text-text mb-4">
              {response.score >= 90 ? 'Excellent' :
               response.score >= 80 ? 'Very Good' :
               response.score >= 70 ? 'Good' :
               response.score >= 60 ? 'Satisfactory' :
               'Needs Improvement'}
            </p>
            <div className="w-full flex space-x-2 mt-2">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-secondary text-white rounded-md hover:bg-primary"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download PDF
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className={`flex-1 flex items-center justify-center px-3 py-2 border border-secondary text-secondary rounded-md hover:bg-accent ${
                  sendingEmail ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {sendingEmail ? (
                  <Loader className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Send Email
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-text mb-4">Question Responses</h2>
        <div className="space-y-6">
          {Object.entries(response.answers || {}).map(([questionId, answerData], index) => {
            const question = getQuestionById(questionId);
            const optionData = getOptionFeedback(questionId, response.answers[questionId]);
            const score = typeof answerData === 'number' ? answerData : (optionData?.score || 0);
            
            return (
              <div key={questionId} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center mr-3">
                      <span className="text-secondary font-medium">{index + 1}</span>
                    </div>
                    <h3 className="font-medium text-text">{question?.text || `Question ${index + 1}`}</h3>
                  </div>
                  <div className="flex items-center">
                    {score >= 7 ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      score >= 7 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {score}/10
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className={`h-2 rounded-full ${
                      score >= 7 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score * 10}%` }}
                  ></div>
                </div>
                
                {/* Display option feedback if available */}
                {optionData?.feedback && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-border">
                    <h4 className="text-sm font-medium text-text mb-2">Feedback for Score: {optionData.score}/10</h4>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: processTemplateVariables(optionData.feedback, {
                          name: response.participant_name,
                          email: response.participant_email,
                          score: response.score.toString(),
                          date: new Date(response.submission_date).toLocaleDateString(),
                          time: formatDuration(response.completion_time),
                          quiz_title: response.quiz_name,
                          performance_category: response.score >= 90 ? 'Excellent' : 
                                                response.score >= 80 ? 'Very Good' : 
                                                response.score >= 70 ? 'Good' : 
                                                response.score >= 60 ? 'Satisfactory' : 'Needs Improvement'
                        })
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-background rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Feedback & Recommendations</h2>
          <div className="flex items-center space-x-2">
            {!editingFeedback ? (
              <button
                onClick={() => setEditingFeedback(true)}
                className="flex items-center px-3 py-1.5 text-secondary border border-secondary rounded hover:bg-accent"
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit Feedback
              </button>
            ) : (
              <>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="px-3 py-1.5 border border-border rounded text-sm"
                >
                  <option value="">Load Template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveFeedback}
                  disabled={saving}
                  className="flex items-center px-3 py-1.5 bg-secondary text-white rounded hover:bg-primary"
                >
                  {saving ? (
                    <Loader className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingFeedback(false);
                    setCustomFeedback(response.custom_feedback || '');
                  }}
                  className="flex items-center px-3 py-1.5 border border-border text-text rounded hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        
        {editingFeedback ? (
          <ReactQuill
            value={customFeedback}
            onChange={setCustomFeedback}
            //modules={modules}
            placeholder="Enter feedback and recommendations..."
            theme="snow"
            className="mb-4"
            style={{ minHeight: '200px' }}
          />
        ) : (
          <div className="prose max-w-none">
            {customFeedback ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: processTemplateVariables(customFeedback, {
                    name: response.participant_name,
                    email: response.participant_email,
                    score: response.score.toString(),
                    date: new Date(response.submission_date).toLocaleDateString(),
                    time: formatDuration(response.completion_time),
                    quiz_title: response.quiz_name,
                    performance_category: response.score >= 90 ? 'Excellent' : 
                                          response.score >= 80 ? 'Very Good' : 
                                          response.score >= 70 ? 'Good' : 
                                          response.score >= 60 ? 'Satisfactory' : 'Needs Improvement'
                  })
                }}
              />
            ) : (
              <p className="text-gray-500 italic">No custom feedback has been added yet. Click "Edit Feedback" to add personalized feedback for this response.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}