import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Copy,
  ExternalLink,
  Printer,
  Edit,
  Save,
  Share2,
  Calendar,
  Tag,
  Briefcase,
  CheckSquare,
  Eye,
  FileText,
  AlertCircle,
  Loader
} from 'lucide-react';
import { showToast } from '../../lib/toast';

// This would typically come from a database or API
const getTemplateById = (id: string) => {
  // Mock data for demonstration
  return {
    id,
    title: 'Email Newsletter Signup Form',
    description: 'Clean, minimal design for email newsletter signups with name, email, and interest fields.',
    category: 'lead-magnet',
    subcategory: 'newsletter',
    previewImage: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=1974&auto=format&fit=crop',
    pdfUrl: '/templates/newsletter-signup.pdf',
    digitalUrl: '/templates/newsletter-signup.html',
    tags: ['email', 'newsletter', 'marketing', 'signup'],
    industry: 'Marketing',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-04-15',
    htmlContent: `
      <form class="max-w-md mx-auto p-6 bg-background rounded-lg shadow-md">
        <h2 class="text-2xl font-bold text-text mb-6">Subscribe to Our Newsletter</h2>
        
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium text-text mb-1">Full Name</label>
          <input type="text" id="name" name="name" class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary" placeholder="John Doe" required>
        </div>
        
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-text mb-1">Email Address</label>
          <input type="email" id="email" name="email" class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary" placeholder="john@example.com" required>
        </div>
        
        <div class="mb-6">
          <label class="block text-sm font-medium text-text mb-1">Interests</label>
          <div class="space-y-2">
            <div class="flex items-center">
              <input type="checkbox" id="interest-1" name="interests[]" value="product-updates" class="h-4 w-4 text-secondary focus:ring-secondary border-border rounded">
              <label for="interest-1" class="ml-2 text-sm text-text">Product Updates</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="interest-2" name="interests[]" value="industry-news" class="h-4 w-4 text-secondary focus:ring-secondary border-border rounded">
              <label for="interest-2" class="ml-2 text-sm text-text">Industry News</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="interest-3" name="interests[]" value="tips-tutorials" class="h-4 w-4 text-secondary focus:ring-secondary border-border rounded">
              <label for="interest-3" class="ml-2 text-sm text-text">Tips & Tutorials</label>
            </div>
          </div>
        </div>
        
        <div class="mb-4">
          <div class="flex items-center">
            <input type="checkbox" id="consent" name="consent" class="h-4 w-4 text-secondary focus:ring-secondary border-border rounded" required>
            <label for="consent" class="ml-2 text-sm text-text">I agree to receive marketing emails and can unsubscribe at any time.</label>
          </div>
        </div>
        
        <button type="submit" class="w-full bg-secondary text-white py-2 px-4 rounded-md hover:bg-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
          Subscribe Now
        </button>
      </form>
    `,
    customizationOptions: [
      { id: 'title', label: 'Form Title', type: 'text', default: 'Subscribe to Our Newsletter' },
      { id: 'buttonText', label: 'Button Text', type: 'text', default: 'Subscribe Now' },
      { id: 'buttonColor', label: 'Button Color', type: 'color', default: '#9333ea' },
      { id: 'includeInterests', label: 'Include Interests Section', type: 'boolean', default: true },
      { id: 'interestOptions', label: 'Interest Options', type: 'array', default: ['Product Updates', 'Industry News', 'Tips & Tutorials'] }
    ]
  };
};

export default function FormTemplateDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);

  // In a real app, this would be a useEffect that fetches the template
  React.useEffect(() => {
    if (!id) {
      setError('Template ID is required');
      return;
    }

    setLoading(true);
    try {
      // Mock API call
      setTimeout(() => {
        const templateData = getTemplateById(id);
        setTemplate(templateData);
        
        // Initialize customizations with defaults
        if (templateData.customizationOptions) {
          const initialCustomizations = templateData.customizationOptions.reduce((acc: Record<string, any>, option: any) => {
            acc[option.id] = option.default;
            return acc;
          }, {});
          setCustomizations(initialCustomizations);
        }
        
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Failed to load template');
      setLoading(false);
    }
  }, [id]);

  const handleCustomizationChange = (optionId: string, value: any) => {
    setCustomizations(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  const handleDownload = (format: 'pdf' | 'html') => {
    showToast(`Downloading template in ${format.toUpperCase()} format`, 'success');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(template?.htmlContent || '');
    showToast('HTML code copied to clipboard', 'success');
  };

  const handleSaveCustomizations = () => {
    showToast('Customizations saved successfully', 'success');
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
            onClick={() => navigate('/forms/templates')}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-600 hover:text-text rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text">{template.title}</h1>
            <p className="text-gray-600">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCustomizationPanel(!showCustomizationPanel)}
            className={`flex items-center px-3 py-1.5 rounded text-sm ${
              showCustomizationPanel 
                ? 'bg-secondary text-white' 
                : 'border border-secondary text-secondary hover:bg-accent'
            }`}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Customize
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center px-3 py-1.5 border border-border rounded text-sm text-text hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </button>
          <button
            onClick={() => handleDownload('html')}
            className="flex items-center px-3 py-1.5 border border-border rounded text-sm text-text hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            HTML
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center px-3 py-1.5 border border-border rounded text-sm text-text hover:bg-gray-50"
          >
            <Copy className="h-4 w-4 mr-1.5" />
            Copy Code
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className={`lg:col-span-1 ${showCustomizationPanel ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-background rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Template Details</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Last Updated
                </div>
                <p className="text-sm font-medium">{template.lastUpdated}</p>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Briefcase className="h-4 w-4 mr-1.5" />
                  Industry
                </div>
                <p className="text-sm font-medium">{template.industry}</p>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Tag className="h-4 w-4 mr-1.5" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-text text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <CheckSquare className="h-4 w-4 mr-1.5" />
                  Accessibility
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                    WCAG {template.accessibility.wcag}
                  </span>
                  {template.accessibility.screenReaderFriendly && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                      Screen Reader Friendly
                    </span>
                  )}
                  {template.accessibility.highContrast && (
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded">
                      High Contrast
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customization Panel */}
          {showCustomizationPanel && (
            <div className="bg-background rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Customize Template</h2>
                <button
                  onClick={handleSaveCustomizations}
                  className="flex items-center px-3 py-1.5 bg-secondary text-white text-sm rounded hover:bg-primary"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  Save
                </button>
              </div>
              
              <div className="space-y-4">
                {template.customizationOptions?.map((option: any) => (
                  <div key={option.id}>
                    <label className="block text-sm font-medium text-text mb-1">
                      {option.label}
                    </label>
                    
                    {option.type === 'text' && (
                      <input
                        type="text"
                        value={customizations[option.id] || ''}
                        onChange={(e) => handleCustomizationChange(option.id, e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                      />
                    )}
                    
                    {option.type === 'color' && (
                      <div className="flex items-center">
                        <input
                          type="color"
                          value={customizations[option.id] || '#000000'}
                          onChange={(e) => handleCustomizationChange(option.id, e.target.value)}
                          className="h-8 w-8 rounded border border-border mr-2"
                        />
                        <input
                          type="text"
                          value={customizations[option.id] || ''}
                          onChange={(e) => handleCustomizationChange(option.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                        />
                      </div>
                    )}
                    
                    {option.type === 'boolean' && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={option.id}
                          checked={customizations[option.id] || false}
                          onChange={(e) => handleCustomizationChange(option.id, e.target.checked)}
                          className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                        />
                        <label htmlFor={option.id} className="ml-2 text-sm text-text">
                          {customizations[option.id] ? 'Enabled' : 'Disabled'}
                        </label>
                      </div>
                    )}
                    
                    {option.type === 'array' && (
                      <div className="space-y-2">
                        {(customizations[option.id] || []).map((item: string, index: number) => (
                          <div key={index} className="flex items-center">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newArray = [...customizations[option.id]];
                                newArray[index] = e.target.value;
                                handleCustomizationChange(option.id, newArray);
                              }}
                              className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                            />
                            <button
                              onClick={() => {
                                const newArray = customizations[option.id].filter((_: any, i: number) => i !== index);
                                handleCustomizationChange(option.id, newArray);
                              }}
                              className="ml-2 p-1 text-red-500 hover:text-red-700"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newArray = [...(customizations[option.id] || []), ''];
                            handleCustomizationChange(option.id, newArray);
                          }}
                          className="text-sm text-secondary hover:text-primary"
                        >
                          + Add Item
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className={`lg:col-span-${showCustomizationPanel ? '2' : '3'}`}>
          <div className="bg-background rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Preview</h2>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-md ${
                    previewMode === 'desktop' ? 'bg-background shadow' : 'hover:bg-gray-200'
                  }`}
                  title="Desktop View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setPreviewMode('tablet')}
                  className={`p-1.5 rounded-md ${
                    previewMode === 'tablet' ? 'bg-background shadow' : 'hover:bg-gray-200'
                  }`}
                  title="Tablet View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-md ${
                    previewMode === 'mobile' ? 'bg-background shadow' : 'hover:bg-gray-200'
                  }`}
                  title="Mobile View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex justify-center bg-gray-100 rounded-lg p-6">
              <div 
                className={`bg-background rounded-lg shadow overflow-hidden transition-all duration-300 ${
                  previewMode === 'desktop' ? 'w-full' : 
                  previewMode === 'tablet' ? 'w-[768px]' : 
                  'w-[375px]'
                }`}
              >
                <div 
                  className="preview-container"
                  dangerouslySetInnerHTML={{ 
                    __html: template.htmlContent
                      .replace('Subscribe to Our Newsletter', customizations.title || 'Subscribe to Our Newsletter')
                      .replace('Subscribe Now', customizations.buttonText || 'Subscribe Now')
                      .replace('bg-secondary', `bg-[${customizations.buttonColor || '#9333ea'}]`)
                      .replace('hover:bg-primary', `hover:bg-[${customizations.buttonColor || '#9333ea'}]`)
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}