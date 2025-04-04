import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  ArrowLeft, 
  Home, 
  RefreshCw, 
  Download, 
  Mail, 
  Calendar,
  Share2,
  FileText,
  Copy
} from 'lucide-react';
import { generatePDF } from '../lib/pdf';
import { showToast } from '../lib/toast';

interface ResultsSuccessProps {
  action?: 'save' | 'email';
}

export default function ResultsSuccess({ action = 'save' }: ResultsSuccessProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    response?: any;
    timestamp?: string;
    score?: number;
    quizTitle?: string;
    email?: string;
    action?: 'save' | 'email';
  } | null;

  useEffect(() => {
    // If no state is provided, redirect back to home
    if (!state) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  // Use the action from state if available, otherwise use the prop
  const actionType = state?.action || action;

  if (!state) {
    return null; // Will redirect via useEffect
  }

  const { response, timestamp, score, quizTitle, email } = state;
  const formattedDate = timestamp 
    ? new Date(timestamp).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : new Date().toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const handleDownloadPDF = async () => {
    if (response) {
      try {
        await generatePDF(response);
        showToast('PDF downloaded successfully', 'success');
      } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Failed to generate PDF', 'error');
      }
    } else {
      showToast('No data available for PDF generation', 'error');
    }
  };

  const handleShareResults = async () => {
    try {
      // Check if the Web Share API is available
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${quizTitle || 'GoForm'} Results`,
            text: `I scored ${score}% on the ${quizTitle || 'GoForm'}!`,
            url: window.location.href
          });
        } catch (shareError) {
          console.error('Error using Web Share API:', shareError);
          // Fall back to clipboard if share fails or is denied
          await copyToClipboard();
        }
      } else {
        // Web Share API not available, use clipboard instead
        await copyToClipboard();
      }
    } catch (error) {
      console.error('Error sharing results:', error);
      showToast('Failed to share results. Try copying the link manually.', 'error');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Results link copied to clipboard!', 'success');
    } catch (clipboardError) {
      console.error('Error copying to clipboard:', clipboardError);
      showToast('Failed to copy link. Please copy the URL manually.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 px-6 py-8 text-white text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-full p-2 animate-[pulse_2s_ease-in-out_1]">
                <CheckCircle className="h-12 w-12 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">
              {actionType === 'email' ? 'Email Sent Successfully!' : 'Results Saved Successfully!'}
            </h1>
            <p className="mt-2 text-purple-100">
              {actionType === 'email' 
                ? 'Your GoForm results have been emailed to you.' 
                : 'Your GoForm results have been saved.'}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quizTitle && (
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        GoForm
                      </p>
                      <p className="font-medium text-gray-900">{quizTitle}</p>
                    </div>
                  )}
                  {score !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Score</p>
                      <p className="font-medium text-gray-900">{score}%</p>
                    </div>
                  )}
                  {email && (
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </p>
                      <p className="font-medium text-gray-900">{email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Timestamp
                    </p>
                    <p className="font-medium text-gray-900">{formattedDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 rounded-full p-1">
                    <Download className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Download Your Results</h3>
                    <p className="text-gray-600">Get a PDF copy of your detailed results for future reference.</p>
                    <button 
                      onClick={handleDownloadPDF}
                      className="mt-2 inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download PDF
                    </button>
                  </div>
                </div>

                {actionType === 'save' && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-purple-100 rounded-full p-1">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">Email Your Results</h3>
                      <p className="text-gray-600">Send a copy of your results to your email for easy access.</p>
                      <button 
                        onClick={() => navigate(-1)}
                        className="mt-2 inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                      >
                        <Mail className="h-4 w-4 mr-1.5" />
                        Go Back to Send Email
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 rounded-full p-1">
                    <Share2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Share Your Results</h3>
                    <p className="text-gray-600">Share your results with friends or colleagues.</p>
                    <div className="mt-2 flex space-x-2">
                      <button 
                        onClick={handleShareResults}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                      >
                        <Share2 className="h-4 w-4 mr-1.5" />
                        Share Results
                      </button>
                      <button 
                        onClick={copyToClipboard}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="h-4 w-4 mr-1.5" />
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 rounded-full p-1">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Take Another GoForm</h3>
                    <p className="text-gray-600">Explore more GoForms to test your knowledge in different areas.</p>
                    <Link 
                      to="/"
                      className="mt-2 inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5" />
                      Browse GoForms
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Return to Results
              </button>
              <Link
                to="/"
                className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}