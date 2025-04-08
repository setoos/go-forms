import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, 
  Copy, 
  ArrowLeft,
  Printer,
  Loader,
  FileText,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generatePDF } from '../lib/pdf';
import { showToast } from '../lib/toast';
import { processTemplateVariables } from '../lib/htmlSanitizer';

export default function TemplatePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<any | null>(null);
  const [content, setContent] = useState<string>('');
  const [previewVariables, setPreviewVariables] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    score: '85',
    date: new Date().toLocaleDateString(),
    time: '10:30',
    quiz_title: 'Sample Quiz',
    performance_category: 'Excellent'
  });
  
  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id]);
  
  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', templateId)
        .single();
        
      if (error) throw error;
      
      setTemplate(data);
      
      try {
        const parsedContent = JSON.parse(data.content);
        if (Array.isArray(parsedContent)) {
          setContent(parsedContent.map(s => `<h2>${s.title}</h2>${s.content}`).join(''));
        } else {
          setContent(data.content);
        }
      } catch (e) {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      setError(error instanceof Error ? error.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGeneratePDF = async () => {
    try {
      // Generate a sample response for preview
      const sampleResponse = {
        id: 'preview',
        name: previewVariables.name,
        email: previewVariables.email,
        phone: '123-456-7890',
        answers: { '0': 8, '1': 6, '2': 9, '3': 4, '4': 7 },
        score: parseInt(previewVariables.score),
        quiz_id: template?.quiz_id || 'sample',
        completion_time: 300,
        timestamp: new Date().toISOString(),
        custom_feedback: content
      };
      
      await generatePDF(sampleResponse);
      showToast('PDF generated successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    }
  };
  
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(content);
      showToast('HTML copied to clipboard', 'success');
    } catch (error) {
      console.error('Error copying HTML:', error);
      showToast('Failed to copy HTML', 'error');
    }
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Failed to open print window. Please check your popup blocker settings.', 'error');
      return;
    }
    
    const processedContent = processTemplateVariables(content, previewVariables);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Template Preview</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                margin: 1.5cm;
              }
            }
          </style>
        </head>
        <body>
          ${processedContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  
  const handleVariableChange = (key: string, value: string) => {
    setPreviewVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-background rounded-lg shadow-md p-6 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">Error</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => navigate('/admin/templates')}
          className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Go Back
        </button>
      </div>
    );
  }
  
  const processedContent = processTemplateVariables(content, previewVariables);
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/templates')}
            className="mr-4 p-2 text-gray-600 hover:text-text rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-text">
            {template?.name || 'Template Preview'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCopyHtml}
            className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Copy className="w-4 h-4 mr-1.5" />
            Copy HTML
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center px-3 py-1.5 text-sm bg-secondary text-white rounded-md hover:bg-primary"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Generate PDF
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Preview Variables</h2>
            <div className="space-y-4">
              {Object.entries(previewVariables).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-text mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleVariableChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-background rounded-lg shadow-md p-6">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate(`/admin/templates/${id}`)}
              className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
            >
              <FileText className="w-5 h-5 mr-2" />
              Edit Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}