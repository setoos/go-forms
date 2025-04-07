import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Download, 
  Eye, 
  Trash2, 
  Plus, 
  Copy,
  FileText,
  Image,
  Link as LinkIcon,
  Settings,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  AlertCircle,
  Loader
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { generatePDF } from '../../lib/pdf';
import { useAuth } from '../../lib/auth';
import { sanitizeHtml, validateHtml } from '../../lib/htmlSanitizer';

interface Section {
  id: string;
  title: string;
  content: string;
  isExpanded?: boolean;
}

export default function TemplateEditor({ initialTemplate = null, initialQuizzes = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templateName, setTemplateName] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([
    { id: '1', title: 'Introduction', content: '<p>Thank you for completing the assessment. Here is your personalized feedback.</p>', isExpanded: true },
    { id: '2', title: 'Performance Analysis', content: '<p>Based on your responses, we have identified the following strengths and areas for improvement.</p>', isExpanded: true },
    { id: '3', title: 'Recommendations', content: '<p>We recommend focusing on the following areas to improve your skills.</p>', isExpanded: true }
  ]);
  const [isDefault, setIsDefault] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>(initialQuizzes || []);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [showTemplateSettings, setShowTemplateSettings] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [existingTemplateNames, setExistingTemplateNames] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [editorKey, setEditorKey] = useState<number>(Date.now());
  const quillRefs = useRef<{[key: string]: ReactQuill | null}>({});

  useEffect(() => {
    if (!user) {
      setError('You must be logged in to access this page');
      return;
    }
    
    loadTemplates();
    if (!initialQuizzes || initialQuizzes.length === 0) {
      loadQuizzes();
    } else {
      setQuizzes(initialQuizzes);
    }
    
    if (initialTemplate) {
      // Initialize with provided template data
      setSelectedTemplate(initialTemplate.id);
      setTemplateName(initialTemplate.name);
      setIsDefault(initialTemplate.is_default || false);
      setSelectedQuiz(initialTemplate.quiz_id || null);
      
      try {
        const parsedContent = JSON.parse(initialTemplate.content);
        if (Array.isArray(parsedContent)) {
          setSections(parsedContent.map(section => ({
            ...section,
            isExpanded: true
          })));
        } else {
          setSections([{ id: '1', title: 'Content', content: initialTemplate.content, isExpanded: true }]);
        }
      } catch (e) {
        setSections([{ id: '1', title: 'Content', content: initialTemplate.content, isExpanded: true }]);
      }
    } else if (id && id !== 'new') {
      loadTemplate(id);
    }
  }, [id, user]);

  // Validate template name when it changes
  useEffect(() => {
    if (!templateName) {
      setNameError(null);
      return;
    }

    const normalizedName = templateName.trim().toLowerCase();
    const isDuplicate = existingTemplateNames.some(name => {
      // Skip the current template when checking for duplicates
      if (selectedTemplate) {
        const currentTemplate = templates.find(t => t.id === selectedTemplate);
        if (currentTemplate && currentTemplate.name.toLowerCase() === normalizedName) {
          return false;
        }
      }
      return name.toLowerCase() === normalizedName;
    });

    if (isDuplicate) {
      setNameError('A template with this name already exists');
    } else {
      setNameError(null);
    }
  }, [templateName, existingTemplateNames, selectedTemplate, templates]);

  const loadQuizzes = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('created_by', user.id)
        .is('deleted_at', null)
        .order('title');

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      showToast('Failed to load quizzes', 'error');
    }
  };

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

      if (!data) {
        setError('Template not found');
        return;
      }

      // Check if the user has permission to edit this template
      if (data.created_by && data.created_by !== user?.id) {
        setError('You do not have permission to edit this template');
        return;
      }

      setSelectedTemplate(data.id);
      setTemplateName(data.name);
      setIsDefault(data.is_default || false);
      setSelectedQuiz(data.quiz_id || null);
      
      try {
        const parsedContent = JSON.parse(data.content);
        if (Array.isArray(parsedContent)) {
          setSections(parsedContent.map(section => ({
            ...section,
            isExpanded: true // Ensure all sections are expanded by default
          })));
        } else {
          setSections([{ id: '1', title: 'Content', content: data.content, isExpanded: true }]);
        }
      } catch (e) {
        setSections([{ id: '1', title: 'Content', content: data.content, isExpanded: true }]);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      setError(error instanceof Error ? error.message : 'Failed to load template');
      showToast('Failed to load template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter templates to only show those created by the current user or system templates
      const filteredTemplates = (data || []).filter(template => 
        !template.created_by || template.created_by === user.id
      );
      
      setTemplates(filteredTemplates);
      
      // Extract template names for validation
      setExistingTemplateNames(filteredTemplates.map(t => t.name));
    } catch (error) {
      console.error('Error loading templates:', error);
      showToast('Failed to load templates', 'error');
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    if (!templateId) return;
    
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      
      if (data) {
        setSelectedTemplate(templateId);
        setTemplateName(data.name);
        setIsDefault(data.is_default || false);
        setSelectedQuiz(data.quiz_id || null);
        
        try {
          const parsedContent = JSON.parse(data.content);
          if (Array.isArray(parsedContent)) {
            setSections(parsedContent.map(section => ({
              ...section,
              isExpanded: true // Ensure all sections are expanded by default
            })));
          } else {
            // If it's not in the expected format, create a single section
            setSections([{ 
              id: '1', 
              title: 'Content', 
              content: data.content,
              isExpanded: true
            }]);
          }
        } catch (e) {
          // If parsing fails, it's probably just HTML content
          setSections([{ 
            id: '1', 
            title: 'Content', 
            content: data.content,
            isExpanded: true
          }]);
        }
        
        // Force re-render of the editor components
        setEditorKey(Date.now());
      }
    } catch (error) {
      console.error('Error loading template:', error);
      showToast('Failed to load template', 'error');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }

    if (nameError) {
      showToast(nameError, 'error');
      return;
    }

    try {
      setSaving(true);
      
      // Validate HTML in all sections
      for (const section of sections) {
        const { isValid, errors } = validateHtml(section.content);
        if (!isValid) {
          showToast(`Invalid HTML in section "${section.title}": ${errors[0]}`, 'error');
          setSaving(false);
          return;
        }
      }
      
      // Sanitize HTML in all sections
      const sanitizedSections = sections.map(section => ({
        ...section,
        content: sanitizeHtml(section.content)
      }));
      
      // Serialize sections to JSON
      const content = JSON.stringify(
        sanitizedSections.map(({ isExpanded, ...rest }) => rest)
      );
      
      const templateData = {
        name: templateName.trim(),
        content,
        created_by: user?.id,
        quiz_id: selectedQuiz,
        is_default: isDefault
      };

      // If this is set as default, unset any other defaults for this quiz
      if (isDefault) {
        if (selectedQuiz) {
          await supabase
            .from('report_templates')
            .update({ is_default: false })
            .eq('quiz_id', selectedQuiz)
            .eq('is_default', true);
        } else {
          await supabase
            .from('report_templates')
            .update({ is_default: false })
            .is('quiz_id', null)
            .eq('is_default', true);
        }
      }
      
      let data;
      if (selectedTemplate) {
        // Update existing template
        const { data: updatedData, error } = await supabase
          .from('report_templates')
          .update({
            ...templateData,
            version: templates.find(t => t.id === selectedTemplate)?.version ? 
              (templates.find(t => t.id === selectedTemplate)?.version || 0) + 1 : 1
          })
          .eq('id', selectedTemplate)
          .select()
          .single();
          
        if (error) throw error;
        data = updatedData;
      } else {
        // Create new template
        const { data: newData, error } = await supabase
          .from('report_templates')
          .insert({
            ...templateData,
            version: 1
          })
          .select()
          .single();
          
        if (error) throw error;
        data = newData;
      }
      
      showToast('Template saved successfully', 'success');
      
      // Navigate back to templates list
      navigate('/admin/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = () => {
    const newId = Date.now().toString();
    setSections([...sections, { 
      id: newId, 
      title: `Section ${sections.length + 1}`, 
      content: '<p>Enter content here...</p>',
      isExpanded: true
    }]);
    
    // Force re-render of the editor components
    setEditorKey(Date.now());
  };

  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      showToast('Cannot delete the only section', 'error');
      return;
    }
    
    setSections(sections.filter(section => section.id !== id));
  };

  const handleDuplicateSection = (id: string) => {
    const sectionToDuplicate = sections.find(section => section.id === id);
    if (!sectionToDuplicate) return;
    
    const newId = Date.now().toString();
    const newSection = { 
      ...sectionToDuplicate, 
      id: newId, 
      title: `${sectionToDuplicate.title} (Copy)`,
      isExpanded: true
    };
    
    setSections([...sections, newSection]);
    
    // Force re-render of the editor components
    setEditorKey(Date.now());
  };

  const handleSectionChange = (id: string, field: 'title' | 'content', value: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const toggleSectionExpand = (id: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, isExpanded: !section.isExpanded } : section
    ));
  };

  const toggleAllSections = () => {
    const newExpandedState = !allExpanded;
    setAllExpanded(newExpandedState);
    setSections(sections.map(section => ({ ...section, isExpanded: newExpandedState })));
  };

  const handlePreview = async () => {
    try {
      setPreviewMode(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      showToast('Failed to generate preview', 'error');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      // Generate a sample response for preview
      const sampleResponse = {
        id: 'preview',
        name: 'Sample User',
        email: 'sample@example.com',
        phone: '123-456-7890',
        answers: { '0': 8, '1': 6, '2': 9, '3': 4, '4': 7 },
        score: 75,
        quiz_id: selectedQuiz || 'sample',
        completion_time: 300,
        timestamp: new Date().toISOString(),
        custom_feedback: sections.map(s => `<h3>${s.title}</h3>${s.content}`).join('')
      };
      
      await generatePDF(sampleResponse);
      showToast('Preview PDF generated', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    }
  };

  const handleImageUpload = () => {
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
        
        // Find the active editor (first expanded section)
        const activeSection = sections.find(s => s.isExpanded);
        if (!activeSection) {
          showToast('Please expand a section to insert an image', 'error');
          return;
        }
        
        // Insert image into editor
        const quill = quillRefs.current[activeSection.id]?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', publicURL.publicUrl);
          quill.setSelection(range.index + 1);
        } else {
          showToast('Editor not found. Please try again.', 'error');
        }
        
        showToast('Image uploaded successfully', 'success');
      } catch (error) {
        console.error('Error uploading image:', error);
        showToast('Error uploading image: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      }
    };
    
    // Trigger file selection
    input.click();
  };

  // Custom image handler for ReactQuill
  const imageHandler = () => {
    handleImageUpload();
  };

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
      ],
      handlers: {
        image: imageHandler
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">You must be logged in to access this page</p>
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="h-12 w-12 text-secondary animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading template editor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Error</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/templates')}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
          >
            Return to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/templates')}
            className="mr-4 p-2 text-gray-600 hover:text-text rounded-full hover:bg-gray-100"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text">
              {id && id !== 'new' ? 'Edit Template' : 'Create Template'}
            </h1>
            <p className="text-gray-600">
              {id && id !== 'new' ? 'Update your existing template' : 'Create a new report template'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleAllSections}
            className="flex items-center px-4 py-2 text-secondary border border-secondary rounded-lg hover:bg-accent"
            title={allExpanded ? "Collapse all sections" : "Expand all sections"}
            type="button"
          >
            {allExpanded ? (
              <>
                <Minimize2 className="w-5 h-5 mr-2" />
                Collapse All
              </>
            ) : (
              <>
                <Maximize2 className="w-5 h-5 mr-2" />
                Expand All
              </>
            )}
          </button>
          <button
            onClick={handlePreview}
            className="flex items-center px-4 py-2 text-secondary border border-secondary rounded-lg hover:bg-accent"
            type="button"
          >
            <Eye className="w-5 h-5 mr-2" />
            Preview
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center px-4 py-2 text-secondary border border-secondary rounded-lg hover:bg-accent"
            type="button"
          >
            <Download className="w-5 h-5 mr-2" />
            Generate PDF
          </button>
          <button
            onClick={handleSaveTemplate}
            disabled={saving || !templateName.trim() || !!nameError}
            className={`flex items-center px-4 py-2 rounded-lg ${
              saving || !templateName.trim() || !!nameError
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-secondary text-white hover:bg-primary'
            }`}
            type="button"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-background rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Template Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1" htmlFor="templateName">
                  Template Name
                </label>
                <input
                  id="templateName"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className={`w-full px-3 py-2 border ${nameError ? 'border-red-500' : 'border-border'} rounded-md focus:ring-secondary focus:border-secondary`}
                  placeholder="Enter template name"
                />
                {nameError && (
                  <p className="mt-1 text-sm text-red-500">{nameError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-1" htmlFor="templateSelector">
                  Load Existing Template
                </label>
                <select
                  id="templateSelector"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                >
                  <option value="">Select a template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} {template.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  onClick={() => setShowTemplateSettings(!showTemplateSettings)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-text bg-gray-100 rounded-md hover:bg-gray-200"
                  type="button"
                >
                  <span className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Template Settings
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showTemplateSettings ? 'transform rotate-180' : ''}`} />
                </button>
                
                {showTemplateSettings && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1" htmlFor="quizSelector">
                        Assign to Quiz
                      </label>
                      <select
                        id="quizSelector"
                        value={selectedQuiz || ''}
                        onChange={(e) => setSelectedQuiz(e.target.value || null)}
                        className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                      >
                        <option value="">No specific quiz (global)</option>
                        {quizzes.map(quiz => (
                          <option key={quiz.id} value={quiz.id}>
                            {quiz.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="h-4 w-4 text-secondary focus:ring-secondary border-border rounded"
                      />
                      <label htmlFor="isDefault" className="ml-2 block text-sm text-text">
                        Set as default template {selectedQuiz ? 'for this quiz' : '(global)'}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Available Variables</h2>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <code>{'{{name}}'}</code> - Participant's name
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <code>{'{{email}}'}</code> - Participant's email
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <code>{'{{score}}'}</code> - Overall score
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <code>{'{{date}}'}</code> - Completion date
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <code>{'{{time}}'}</code> - Completion time
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <code>{'{{quiz_title}}'}</code> - Quiz title
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <code>{'{{performance_category}}'}</code> - Performance level
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-background rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Report Sections</h2>
              <button
                onClick={handleAddSection}
                className="flex items-center px-3 py-1 text-sm bg-secondary text-white rounded-md hover:bg-primary"
                type="button"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Section
              </button>
            </div>
            
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div 
                  key={`${section.id}-${editorKey}`} 
                  className="border border-border rounded-lg overflow-hidden"
                  data-section-expanded={section.isExpanded}
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center flex-1">
                      <span className="w-6 h-6 flex items-center justify-center bg-secondary text-white rounded-full text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                        className="font-medium text-text border-none focus:ring-0 focus:outline-none bg-transparent flex-1"
                        placeholder="Section Title"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSectionExpand(section.id)}
                        className="p-1 text-gray-500 hover:text-text"
                        title={section.isExpanded ? "Collapse section" : "Expand section"}
                        type="button"
                      >
                        {section.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDuplicateSection(section.id)}
                        className="p-1 text-gray-500 hover:text-text"
                        title="Duplicate section"
                        type="button"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Delete section"
                        disabled={sections.length <= 1}
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Editor container - conditionally render based on section.isExpanded */}
                  {section.isExpanded && (
                    <div className="editor-container">
                      <ReactQuill
                        ref={(el) => quillRefs.current[section.id] = el}
                        value={section.content}
                        onChange={(content) => handleSectionChange(section.id, 'content', content)}
                        //modules={modules}
                        placeholder="Enter section content..."
                        theme="snow"
                        style={{ height: '250px' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/admin/templates')}
              className="px-6 py-3 border-2 border-border text-text rounded-lg hover:bg-gray-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePDF}
              className="flex items-center px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary"
              type="button"
            >
              <FileText className="w-5 h-5 mr-2" />
              Generate Sample PDF
            </button>
          </div>
        </div>
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text">
                  Preview: {templateName || 'Untitled Template'}
                </h2>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="text-gray-500 hover:text-text"
                  type="button"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {sections.map((section, index) => (
                <div key={section.id} className="mb-6 last:mb-0">
                  <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 bg-gray-200 text-text rounded-md hover:bg-gray-300"
                type="button"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}