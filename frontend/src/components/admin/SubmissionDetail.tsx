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
  Send
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { format } from 'date-fns';
import { useAuth } from '../../lib/auth';
import { generatePDF } from '../../lib/pdf';
import { sendResultsEmail } from '../../lib/email';

interface QuizSubmission {
  id: string;
  quiz_id: string;
  quiz_name: string;
  participant_name: string;
  participant_email: string;
  score: number;
  submission_date: string;
  completion_time: number;
  status: 'completed' | 'incomplete';
  answers: Record<string, any>;
  custom_feedback?: string;
}

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (user && id) {
      loadSubmission();
    }
  }, [user, id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the submission
      const { data: submissionData, error: submissionError } = await supabase
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

      if (submissionError) throw submissionError;

      // Verify that the quiz belongs to the current user
      if (submissionData.quizzes?.created_by !== user?.id) {
        throw new Error('You do not have permission to view this submission');
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
            is_correct
          )
        `)
        .eq('quiz_id', submissionData.quiz_id)
        .order('order');

      if (questionsError) throw questionsError;

      // Format the submission
      const formattedSubmission: QuizSubmission = {
        id: submissionData.id,
        quiz_id: submissionData.quiz_id,
        quiz_name: submissionData.quizzes?.title || 'Unknown Quiz',
        participant_name: submissionData.name,
        participant_email: submissionData.email,
        score: submissionData.score,
        submission_date: submissionData.created_at,
        completion_time: submissionData.completion_time || 0,
        status: submissionData.completion_time ? 'completed' : 'incomplete',
        answers: submissionData.answers || {},
        custom_feedback: submissionData.custom_feedback
      };

      setSubmission(formattedSubmission);
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error loading submission:', error);
      setError(error instanceof Error ? error.message : 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!submission) return;

    try {
      // Format the submission data for PDF generation
      const pdfData = {
        id: submission.id,
        name: submission.participant_name,
        email: submission.participant_email,
        quiz_id: submission.quiz_id,
        score: submission.score,
        completion_time: submission.completion_time,
        timestamp: submission.submission_date,
        answers: submission.answers,
        custom_feedback: submission.custom_feedback
      };

      await generatePDF(pdfData);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    }
  };

  const handleSendEmail = async () => {
    if (!submission) return;

    try {
      setSendingEmail(true);

      // Format the submission data for email
      const emailData = {
        id: submission.id,
        name: submission.participant_name,
        email: submission.participant_email,
        quiz_id: submission.quiz_id,
        score: submission.score,
        completion_time: submission.completion_time,
        timestamp: submission.submission_date,
        answers: submission.answers,
        custom_feedback: submission.custom_feedback
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Find question text by ID
  const getQuestionText = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    return question ? question.text : `Question ${questionId}`;
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">You must be logged in to view this submission</p>
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

  if (error || !submission) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Error</h3>
          <p className="text-gray-500 mb-6">{error || 'Submission not found'}</p>
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
          <h1 className="text-2xl font-bold text-text">Submission Details</h1>
          <p className="text-gray-600">{submission.quiz_name}</p>
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
                <p className="text-text">{submission.participant_name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-secondary mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-text">Email</p>
                <p className="text-text">{submission.participant_email}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-secondary mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-text">Submission Date</p>
                <p className="text-text">
                  {format(new Date(submission.submission_date), 'MMMM d, yyyy')} at {format(new Date(submission.submission_date), 'h:mm a')}
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
                <p className="text-text">{submission.quiz_name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-secondary mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-text">Completion Time</p>
                <p className="text-text">{formatDuration(submission.completion_time)}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center mt-0.5 mr-3 ${
                submission.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {submission.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-text">Status</p>
                <p className="text-text">{submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Score Summary</h2>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl font-bold text-secondary mb-2">
              {submission.score}%
            </div>
            <p className="text-text mb-4">
              {submission.score >= 90 ? 'Excellent' :
               submission.score >= 80 ? 'Very Good' :
               submission.score >= 70 ? 'Good' :
               submission.score >= 60 ? 'Satisfactory' :
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
          {Object.entries(submission.answers || {}).map(([questionId, score], index) => (
            <div key={questionId} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center mr-3">
                    <span className="text-secondary font-medium">{index + 1}</span>
                  </div>
                  <h3 className="font-medium text-text">{getQuestionText(questionId)}</h3>
                </div>
                <div className="flex items-center">
                  {Number(score) >= 7 ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    Number(score) >= 7 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {score}/10
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full ${
                    Number(score) >= 7 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Number(score) * 10}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {submission.custom_feedback && (
        <div className="bg-background rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-text mb-4">Feedback & Recommendations</h2>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: submission.custom_feedback }}
          />
        </div>
      )}
    </div>
  );
}