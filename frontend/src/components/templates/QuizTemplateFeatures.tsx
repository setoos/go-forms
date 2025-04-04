import React from 'react';
import { 
  CheckCircle, 
  BarChart, 
  Award, 
  Smartphone, 
  Download, 
  FileText, 
  Users, 
  Clock, 
  Sliders, 
  Tag, 
  MessageSquare, 
  // Globe, 
  Layers, 
  Lock, 
  // Share2, 
  Zap
} from 'lucide-react';

export default function QuizTemplateFeatures() {
  const features = [
    {
      title: 'Performance Tracking',
      description: 'Comprehensive analytics to track participant performance and identify knowledge gaps',
      icon: <BarChart className="h-6 w-6 text-purple-600" />,
      details: [
        'Individual and group performance metrics',
        'Question-level difficulty analysis',
        'Time spent per question tracking',
        'Historical performance comparison',
        'Exportable reports in multiple formats'
      ]
    },
    {
      title: 'Automated Scoring',
      description: 'Instant scoring with customizable grading criteria and feedback options',
      icon: <Zap className="h-6 w-6 text-purple-600" />,
      details: [
        'Multiple scoring methods (points, percentage, custom)',
        'Partial credit options for complex questions',
        'Weighted scoring for different question types',
        'Automatic grade calculation',
        'Custom passing thresholds'
      ]
    },
    {
      title: 'Progress Reporting',
      description: 'Detailed progress reports for individuals and groups with visual representations',
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      details: [
        'Individual progress tracking over time',
        'Comparative performance analysis',
        'Skill mastery visualization',
        'Learning gap identification',
        'Customizable report templates'
      ]
    },
    {
      title: 'Certificate Generation',
      description: 'Automatic certificate generation for successful GoForm completion',
      icon: <Award className="h-6 w-6 text-purple-600" />,
      details: [
        'Customizable certificate templates',
        'Digital certificate delivery',
        'Printable high-resolution PDFs',
        'Verification QR codes',
        'Certificate expiration management'
      ]
    },
    {
      title: 'Mobile Responsiveness',
      description: 'Fully responsive design that works seamlessly across all devices',
      icon: <Smartphone className="h-6 w-6 text-purple-600" />,
      details: [
        'Optimized for smartphones and tablets',
        'Touch-friendly interface',
        'Adaptive layouts for different screen sizes',
        'Offline capability with sync',
        'Low bandwidth optimization'
      ]
    },
    {
      title: 'Export Options',
      description: 'Multiple export formats for GoForms, results, and analytics',
      icon: <Download className="h-6 w-6 text-purple-600" />,
      details: [
        'PDF export with customizable formatting',
        'CSV/Excel export for data analysis',
        'LMS-compatible formats (SCORM, xAPI)',
        'Bulk export capabilities',
        'Scheduled automatic exports'
      ]
    },
    {
      title: 'Customization',
      description: 'Extensive customization options for branding, appearance, and functionality',
      icon: <Sliders className="h-6 w-6 text-purple-600" />,
      details: [
        'Custom branding and white-labeling',
        'Theme and color scheme options',
        'Custom question types and formats',
        'Personalized feedback messages',
        'Custom email notifications'
      ]
    },
    {
      title: 'LMS Compatibility',
      description: 'Seamless integration with popular learning management systems',
      icon: <Layers className="h-6 w-6 text-purple-600" />,
      details: [
        'SCORM 1.2 and 2004 compliance',
        'xAPI (Tin Can) support',
        'LTI integration',
        'Grade passback to LMS gradebooks',
        'Single sign-on capabilities'
      ]
    },
    {
      title: 'Security Features',
      description: 'Advanced security options to maintain assessment integrity',
      icon: <Lock className="h-6 w-6 text-purple-600" />,
      details: [
        'Password protection',
        'Time limits and scheduling',
        'IP restriction options',
        'Browser lockdown capability',
        'Randomized questions and answers'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">GoForm Template Features</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Our GoForm templates include powerful features for assessment, tracking, and reporting
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 mb-4">{feature.description}</p>
            
            <ul className="space-y-2">
              {feature.details.map((detail, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-purple-50 rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Customization</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            All templates can be fully customized to meet your specific needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <Tag className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium">Branding</h3>
            </div>
            <p className="text-sm text-gray-600">
              Add your logo, colors, and custom styling to match your brand identity
            </p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium">Audience</h3>
            </div>
            <p className="text-sm text-gray-600">
              Adjust difficulty and content to match your specific audience needs
            </p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium">Timing</h3>
            </div>
            <p className="text-sm text-gray-600">
              Set time limits for the entire GoForm or individual questions
            </p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium">Feedback</h3>
            </div>
            <p className="text-sm text-gray-600">
              Customize feedback messages and learning resources for participants
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}