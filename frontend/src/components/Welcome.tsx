import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Target,
  Users,
  Star,
  ArrowUpRight,
  FileQuestion,
  ClipboardList,
  FileEdit
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import Dashboard from './Dashboard';
import Footer from './Footer';
import { useTheme } from '../lib/theme';

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {loading, themeLoading} = useTheme();

  // If user is logged in, show dashboard instead
  if (user && !themeLoading) {
    return <Dashboard />;
  }

if(themeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
}

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary via-primary to-primary text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=2070')] bg-cover bg-center mix-blend-overlay opacity-20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your Marketing Strategy with Data-Driven Insights
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-accent">
              Get a comprehensive assessment of your marketing performance and unlock actionable strategies for growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/quiz/sample')}
                className="px-8 py-4 bg-background text-primary rounded-lg font-semibold hover:bg-accent transition-colors flex items-center justify-center"
              >
                Take Free Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button 
                className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-secondary transition-colors flex items-center justify-center"
                onClick={() => navigate('/auth')}
              >
                Create Account
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              All-in-One Platform for Forms & Quizzes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create, distribute, and analyze forms and quizzes with our comprehensive toolkit
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <FileQuestion className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Interactive Quizzes</h3>
              <p className="text-gray-600">
                Create engaging quizzes with multiple question types, automatic scoring, and detailed analytics.
              </p>
              <button
                onClick={() => navigate('/admin/quizzes')}
                className="mt-4 text-secondary hover:text-primary font-medium inline-flex items-center"
              >
                Explore Quizzes
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>

            {/* <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Form Templates</h3>
              <p className="text-gray-600">
                Choose from hundreds of professionally designed form templates for any purpose or industry.
              </p>
              <button
                onClick={() => navigate('/forms/templates')}
                className="mt-4 text-secondary hover:text-primary font-medium inline-flex items-center"
              >
                Browse Templates
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div> */}

            <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <FileEdit className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Custom Reports</h3>
              <p className="text-gray-600">
                Generate professional reports with customizable templates and dynamic content.
              </p>
              <button
                onClick={() => navigate('/admin/reports')}
                className="mt-4 text-secondary hover:text-primary font-medium inline-flex items-center"
              >
                View Reports
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              Unlock Your Marketing Potential
            </h2>
            <p className="text-xl text-gray-600">
              Get actionable insights and personalized recommendations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Performance Analysis</h3>
              <p className="text-gray-600">
                Get detailed insights into your marketing metrics and understand what's working and what needs improvement.
              </p>
            </div>

            <div className="bg-background rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Strategic Recommendations</h3>
              <p className="text-gray-600">
                Receive personalized recommendations to optimize your marketing strategy and achieve better results.
              </p>
            </div>

            <div className="bg-background rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Audience Insights</h3>
              <p className="text-gray-600">
                Understand your target audience better with comprehensive demographic and behavioral analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Process */}
      <div className="bg-background py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get your personalized marketing assessment in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Take Assessment',
                description: 'Complete our comprehensive marketing assessment questionnaire'
              },
              {
                step: '2',
                title: 'Get Analysis',
                description: 'Receive detailed analysis of your marketing performance'
              },
              {
                step: '3',
                title: 'Implement Changes',
                description: 'Follow actionable recommendations to improve your strategy'
              }
            ].map((item) => (
              <div key={item.step} className="bg-background p-8 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <span className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </span>
                  <div className="h-1 flex-1 bg-accent ml-4"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of marketers who've improved their strategy with our assessment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-background p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "The marketing assessment provided invaluable insights that helped us optimize our strategy and increase ROI significantly."
                </p>
                <div className="flex items-center">
                  <img
                    src={`https://i.pravatar.cc/40?img=${i}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-medium text-text">Marketing Director</p>
                    <p className="text-sm text-gray-500">Tech Company</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Marketing Strategy?
          </h2>
          <p className="text-xl text-accent mb-8">
            Take our free assessment and get personalized recommendations to improve your marketing performance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="px-8 py-4 bg-background text-primary rounded-lg font-semibold hover:bg-accent transition-colors"
              onClick={() => navigate('/quiz/sample')}
            >
              Start Free Assessment
            </button>
            <button 
              className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary transition-colors"
              onClick={() => navigate('/auth')}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}