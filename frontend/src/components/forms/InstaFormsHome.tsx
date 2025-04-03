import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Users, 
  GraduationCap, 
  Award, 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  Smartphone, 
  Globe, 
  Download, 
  Edit, 
  Search
} from 'lucide-react';

export default function InstaFormsHome() {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'lead-magnet',
      name: 'Lead Magnet Templates',
      icon: <Mail className="h-8 w-8 text-purple-600" />,
      description: 'Capture leads and grow your audience with professional signup forms',
      examples: ['Email newsletter signup', 'E-book download', 'Webinar registration']
    },
    {
      id: 'hr',
      name: 'HR Evaluation Forms',
      icon: <Users className="h-8 w-8 text-purple-600" />,
      description: 'Streamline your HR processes with comprehensive evaluation templates',
      examples: ['Performance reviews', 'Job applications', 'Employee satisfaction surveys']
    },
    {
      id: 'academic',
      name: 'Academic Quiz Formats',
      icon: <GraduationCap className="h-8 w-8 text-purple-600" />,
      description: 'Create professional educational assessments and quizzes',
      examples: ['Multiple choice exams', 'Essay questions', 'Student assessments']
    },
    {
      id: 'certificate',
      name: 'Certificate Formats',
      icon: <Award className="h-8 w-8 text-purple-600" />,
      description: 'Recognize achievements with professional certificate templates',
      examples: ['Course completion', 'Achievement recognition', 'Professional certification']
    }
  ];

  const features = [
    {
      icon: <Edit className="h-6 w-6 text-purple-600" />,
      title: 'Fully Customizable',
      description: 'Easily modify colors, fonts, fields, and layout to match your brand'
    },
    {
      icon: <Smartphone className="h-6 w-6 text-purple-600" />,
      title: 'Mobile-Responsive',
      description: 'All templates work perfectly on desktop, tablet, and mobile devices'
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-purple-600" />,
      title: 'Accessibility Compliant',
      description: 'WCAG compliant templates with screen reader support and high contrast options'
    },
    {
      icon: <Download className="h-6 w-6 text-purple-600" />,
      title: 'Multiple Formats',
      description: 'Download templates in PDF format or as digital HTML/CSS files'
    },
    {
      icon: <Globe className="h-6 w-6 text-purple-600" />,
      title: 'Industry-Specific',
      description: 'Templates tailored for different industries and use cases'
    },
    {
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      title: 'Placeholder Content',
      description: 'Ready-to-use templates with professional placeholder text'
    }
  ];

  const testimonials = [
    {
      quote: "InstaForms saved us countless hours designing forms for our marketing campaigns. The templates are professional and conversion-optimized.",
      author: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechGrowth Inc."
    },
    {
      quote: "As an HR professional, I appreciate the thoughtful design of these templates. They've streamlined our entire evaluation process.",
      author: "Michael Chen",
      role: "HR Manager",
      company: "Global Solutions"
    },
    {
      quote: "The academic templates have been a game-changer for our online courses. Students find them intuitive and easy to use.",
      author: "Dr. Emily Rodriguez",
      role: "Education Director",
      company: "Learning Academy"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-2xl overflow-hidden shadow-xl mb-16">
        <div className="px-8 py-16 sm:px-16 sm:py-20 lg:py-24 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Professional Form Templates for Every Purpose
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 mb-8">
            InstaForms provides beautifully designed, fully customizable form templates for marketing, HR, education, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/forms/templates')}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              Browse Templates
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/forms/templates/popular')}
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Popular Templates
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for templates (e.g., 'newsletter', 'certificate', 'survey')..."
            className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('/forms/templates');
              }
            }}
          />
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our extensive library of professionally designed templates organized by purpose
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map(category => (
            <div 
              key={category.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/forms/categories/${category.id}`)}
            >
              <div className="mb-4">
                {category.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
              <p className="text-gray-600 mb-4">{category.description}</p>
              <div className="space-y-1 mb-4">
                {category.examples.map((example, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {example}
                  </div>
                ))}
              </div>
              <button className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center">
                Browse Templates
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose InstaForms?</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our templates are designed by professionals to help you create effective forms quickly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Thousands of professionals trust InstaForms for their form needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4 text-purple-600">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">"{testimonial.quote}"</p>
              <div>
                <p className="font-semibold text-gray-900">{testimonial.author}</p>
                <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-100 rounded-2xl p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to Create Professional Forms?</h2>
        <p className="text-lg text-gray-700 mb-8 max-w-3xl mx-auto">
          Browse our extensive template library and find the perfect form for your needs.
        </p>
        <button
          onClick={() => navigate('/forms/templates')}
          className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Explore All Templates
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
}