import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Briefcase, 
  Shield, 
  Users, 
  ArrowRight, 
  Search, 
  BarChart, 
  Award, 
  Smartphone, 
  Download, 
  Sliders, 
  CheckCircle, 
  Clock, 
  FileText, 
  Tag, 
  Star
} from 'lucide-react';

export default function QuizTemplateHome() {
  const navigate = useNavigate();
  
  const categories = [
    {
      id: 'academic',
      name: 'Academic',
      icon: <BookOpen className="h-8 w-8 text-secondary" />,
      description: 'Educational assessment templates for academic settings',
      subcategories: ['Mathematics', 'Science', 'History', 'Language']
    },
    {
      id: 'professional',
      name: 'Professional Development',
      icon: <Briefcase className="h-8 w-8 text-secondary" />,
      description: 'Assessment templates for workplace skills and knowledge',
      subcategories: ['Leadership', 'Technical Skills', 'Soft Skills']
    },
    {
      id: 'compliance',
      name: 'Compliance Training',
      icon: <Shield className="h-8 w-8 text-secondary" />,
      description: 'Templates for regulatory and policy compliance assessments',
      subcategories: ['Safety', 'Security', 'Ethics']
    },
    {
      id: 'employee',
      name: 'Employee Assessment',
      icon: <Users className="h-8 w-8 text-secondary" />,
      description: 'Templates for evaluating employee performance and knowledge',
      subcategories: ['Performance', 'Knowledge Check', 'Skill Evaluation']
    }
  ];
  
  const features = [
    {
      icon: <BarChart className="h-6 w-6 text-secondary" />,
      title: 'Performance Tracking',
      description: 'Comprehensive analytics to track participant performance'
    },
    {
      icon: <Award className="h-6 w-6 text-secondary" />,
      title: 'Certificate Generation',
      description: 'Automatic certificate generation for successful completion'
    },
    {
      icon: <Smartphone className="h-6 w-6 text-secondary" />,
      title: 'Mobile Responsive',
      description: 'Fully responsive design that works on all devices'
    },
    {
      icon: <Download className="h-6 w-6 text-secondary" />,
      title: 'Export Options',
      description: 'Multiple export formats for GoForms and results'
    },
    {
      icon: <Sliders className="h-6 w-6 text-secondary" />,
      title: 'Customizable',
      description: 'Easily modify templates to fit your specific needs'
    },
    {
      icon: <FileText className="h-6 w-6 text-secondary" />,
      title: 'Progress Reporting',
      description: 'Detailed progress reports with visual representations'
    }
  ];
  
  const popularTemplates = [
    {
      id: 'math-algebra-basics',
      title: 'Algebra Basics GoForm',
      category: 'Academic',
      subcategory: 'Mathematics',
      rating: 4.8,
      usageCount: 1245,
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070'
    },
    {
      id: 'leadership-management-fundamentals',
      title: 'Management Fundamentals',
      category: 'Professional',
      subcategory: 'Leadership',
      rating: 4.9,
      usageCount: 2356,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070'
    },
    {
      id: 'safety-workplace-fundamentals',
      title: 'Workplace Safety',
      category: 'Compliance',
      subcategory: 'Safety',
      rating: 4.8,
      usageCount: 3245,
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070'
    }
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary rounded-2xl overflow-hidden shadow-xl mb-16">
        <div className="px-8 py-16 sm:px-16 sm:py-20 lg:py-24 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Professional GoForm Templates for Every Purpose
          </h1>
          <p className="text-lg sm:text-xl text-accent mb-8">
            Choose from our extensive library of customizable GoForm templates designed for education, professional development, compliance, and employee assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/templates/library')}
              className="inline-flex items-center justify-center px-6 py-3 bg-background text-primary rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Browse Templates
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/admin/quizzes/new')}
              className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-white rounded-lg font-medium hover:bg-primary transition-colors"
            >
              Create Custom GoForm
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
            placeholder="Search for templates (e.g., 'algebra', 'leadership', 'safety')..."
            className="block w-full pl-10 pr-3 py-4 border border-border rounded-lg leading-5 bg-background placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('/templates/library');
              }
            }}
          />
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text mb-4">Browse by Category</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our extensive library of professionally designed GoForm templates organized by purpose
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map(category => (
            <div 
              key={category.id}
              className="bg-background rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/templates/category/${category.id}`)}
            >
              <div className="mb-4">
                {category.icon}
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">{category.name}</h3>
              <p className="text-gray-600 mb-4">{category.description}</p>
              <div className="space-y-1 mb-4">
                {category.subcategories.map((subcategory, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {subcategory}
                  </div>
                ))}
              </div>
              <button className="text-secondary hover:text-primary font-medium inline-flex items-center">
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
          <h2 className="text-3xl font-bold text-text mb-4">Powerful Features</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            All our templates include these powerful features to enhance your assessment experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-background rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Templates Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text mb-4">Popular Templates</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our most used and highest-rated GoForm templates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {popularTemplates.map(template => (
            <div 
              key={template.id}
              className="bg-background rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/quizzes/new?template=${template.id}`)}
            >
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src={template.image} 
                  alt={template.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-background bg-opacity-90 px-2 py-1 rounded-full flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-xs font-medium">{template.rating}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Tag className="h-3.5 w-3.5 mr-1" />
                  {template.category} / {template.subcategory}
                </div>
                <h3 className="font-semibold text-text mb-2">{template.title}</h3>
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  {template.usageCount.toLocaleString()} uses
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/templates/library')}
            className="inline-flex items-center px-6 py-3 bg-secondary text-white rounded-lg font-medium hover:bg-primary transition-colors"
          >
            View All Templates
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-accent rounded-2xl p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-text mb-4">Ready to Create Your GoForm?</h2>
        <p className="text-lg text-text mb-8 max-w-3xl mx-auto">
          Browse our extensive template library or create a custom GoForm from scratch.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate('/templates/library')}
            className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-white rounded-lg font-medium hover:bg-primary transition-colors"
          >
            Browse Templates
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/admin/quizzes/new')}
            className="inline-flex items-center justify-center px-6 py-3 bg-background border border-secondary text-secondary rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Create Custom GoForm
          </button>
        </div>
      </div>
    </div>
  );
}