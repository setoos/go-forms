import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import RichTextEditor from '../editor/RichTextEditor';
import { showToast } from '../../lib/toast';

interface Section {
  id: string;
  title: string;
  content: string;
}

interface ReportTemplateSectionProps {
  section: Section;
  index: number;
  onSectionChange: (id: string, field: 'title' | 'content', value: string) => void;
  onDuplicateSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  canDelete: boolean;
}

export default function ReportTemplateSection({
  section,
  index,
  onSectionChange,
  onDuplicateSection,
  onDeleteSection,
  canDelete
}: ReportTemplateSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorKey, setEditorKey] = useState<number>(Date.now());

  // Load expanded state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`section-expanded-${section.id}`);
    if (savedState !== null) {
      setIsExpanded(savedState === 'true');
    }
  }, [section.id]);

  // Save expanded state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(`section-expanded-${section.id}`, isExpanded.toString());
  }, [isExpanded, section.id]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    // Force re-render of the editor when expanding
    if (!isExpanded) {
      setTimeout(() => {
        setEditorKey(Date.now());
      }, 50);
    }
  };

  const handleDuplicate = () => {
    onDuplicateSection(section.id);
    showToast('Section duplicated', 'success');
  };

  const handleDelete = () => {
    if (!canDelete) {
      showToast('Cannot delete the only section', 'error');
      return;
    }
    onDeleteSection(section.id);
  };

  const handleContentChange = (content: string) => {
    onSectionChange(section.id, 'content', content);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
      <div className="flex items-center justify-between p-4 bg-gray-50">
        <div className="flex items-center flex-1">
          <span className="w-6 h-6 flex items-center justify-center bg-purple-600 text-white rounded-full text-sm font-medium mr-3">
            {index + 1}
          </span>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onSectionChange(section.id, 'title', e.target.value)}
            className="font-medium text-gray-900 border-none focus:ring-0 focus:outline-none bg-transparent flex-1"
            placeholder="Section Title"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleExpand}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title={isExpanded ? "Collapse section" : "Expand section"}
            type="button"
            aria-expanded={isExpanded}
            aria-controls={`section-content-${section.id}`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDuplicate}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Duplicate section"
            type="button"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-500 hover:text-red-700 transition-colors"
            title="Delete section"
            disabled={!canDelete}
            type="button"
          >
            <Trash2 className={`w-4 h-4 ${!canDelete ? 'opacity-50 cursor-not-allowed' : ''}`} />
          </button>
        </div>
      </div>
      
      <div
        ref={contentRef}
        id={`section-content-${section.id}`}
        className={`section-content ${isExpanded ? 'section-expanding' : 'section-collapsing'}`}
        style={{ display: isExpanded ? 'block' : 'none' }}
      >
        <div 
          ref={editorRef}
          className="p-4"
        >
          {isExpanded && (
            <RichTextEditor
              key={`editor-${section.id}-${editorKey}`}
              value={section.content}
              onChange={handleContentChange}
              placeholder="Enter section content..."
              height="250px"
            />
          )}
        </div>
      </div>
    </div>
  );
}