import React, { useRef, useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Image, 
  Link, 
  Table, 
  Code, 
  Save,
  Undo,
  Redo,
  Check,
  X
} from 'lucide-react';
import { handleImageUpload } from '../../lib/storage';
import { showToast } from '../../lib/toast';
import { validateHtml } from '../../lib/htmlSanitizer';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => Promise<void>;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  onSave,
  placeholder = 'Enter content here...',
  height = '250px',
  readOnly = false,
  autoSave = false,
  autoSaveInterval = 30000
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Set up auto-save
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoSave && onSave) {
      interval = setInterval(() => {
        handleSave();
      }, autoSaveInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSave, autoSaveInterval, onSave, value]);
  
  // Update HTML value when the main value changes
  useEffect(() => {
    if (!htmlMode) {
      setHtmlValue(value);
    }
  }, [value, htmlMode]);

  // Focus the textarea when switching to HTML mode
  useEffect(() => {
    if (htmlMode && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [htmlMode]);
  
  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      await onSave();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving content:', error);
      showToast('Failed to save content', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleHtmlModeToggle = () => {
    if (htmlMode) {
      // Switching from HTML to WYSIWYG
      try {
        // Validate HTML before switching
        const { isValid, errors } = validateHtml(htmlValue);
        if (!isValid) {
          showToast(`Invalid HTML: ${errors[0]}`, 'error');
          return;
        }
        
        onChange(htmlValue);
      } catch (error) {
        showToast('Error processing HTML', 'error');
        return;
      }
    } else {
      // Switching from WYSIWYG to HTML
      setHtmlValue(value);
    }
    
    setHtmlMode(!htmlMode);
  };
  
  const handleImageInsert = () => {
    handleImageUpload((url) => {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', url);
        quill.setSelection(range.index + 1);
      }
    });
  };
  
  const handleTableInsert = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    const range = quill.getSelection(true);
    
    // Insert a 3x3 table HTML
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 1</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 2</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 5</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 6</td>
          </tr>
        </tbody>
      </table>
    `;
    
    quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
    quill.setSelection(range.index + 1);
  };
  
  const handleUndo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) quill.history.undo();
  };
  
  const handleRedo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) quill.history.redo();
  };
  
  // Custom modules for ReactQuill
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        ['link', 'image', 'table'],
        ['clean']
      ],
      handlers: {
        image: handleImageInsert,
        table: handleTableInsert
      }
    },
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: true
    },
    keyboard: {
      bindings: {
        enter: {
          key: 13,
          handler: function() {
            // Default behavior for Enter key
            return true;
          }
        },
        tab: {
          key: 9,
          handler: function() {
            return true;
          }
        }
      }
    },
    clipboard: {
      matchVisual: false // Prevents unwanted formatting issues with pasted content
    }
  };
  
  return (
    <div className={`rich-text-editor ${htmlMode ? 'html-mode' : ''}`}>
      <div className="editor-toolbar bg-gray-50 p-2 rounded-t-lg border border-gray-300 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleHtmlModeToggle}
            className={`p-1.5 rounded ${htmlMode ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`}
            title="Toggle HTML Mode"
            type="button"
          >
            <Code className="w-4 h-4" />
          </button>
          {!htmlMode && (
            <>
              <button
                onClick={handleUndo}
                className="p-1.5 rounded hover:bg-gray-200"
                title="Undo"
                type="button"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                className="p-1.5 rounded hover:bg-gray-200"
                title="Redo"
                type="button"
              >
                <Redo className="w-4 h-4" />
              </button>
              <button
                onClick={handleImageInsert}
                className="p-1.5 rounded hover:bg-gray-200"
                title="Insert Image"
                type="button"
              >
                <Image className="w-4 h-4" />
              </button>
              <button
                onClick={handleTableInsert}
                className="p-1.5 rounded hover:bg-gray-200"
                title="Insert Table"
                type="button"
              >
                <Table className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        
        {onSave && (
          <div className="flex items-center space-x-2">
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`p-1.5 rounded flex items-center ${
                isSaving 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              title="Save"
              type="button"
            >
              <Save className="w-4 h-4" />
              {isSaving && <span className="ml-1 text-xs">Saving...</span>}
            </button>
          </div>
        )}
      </div>
      
      {htmlMode ? (
        <textarea
          ref={textareaRef}
          value={htmlValue}
          onChange={(e) => setHtmlValue(e.target.value)}
          className="html-textarea"
          style={{ minHeight: height }}
          placeholder="Enter HTML code here..."
          readOnly={readOnly}
        />
      ) : (
        <div className="editor-container" style={{ display: 'block' }}>
          <ReactQuill
            ref={quillRef}
            value={value}
            onChange={onChange}
            //modules={modules}
            placeholder={placeholder}
            readOnly={readOnly}
            className="rounded-b-lg border-x border-b border-gray-300"
            style={{ height, display: 'block' }}
            preserveWhitespace={true}
            theme="snow"
          />
        </div>
      )}
    </div>
  );
}