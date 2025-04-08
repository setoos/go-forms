import React from 'react';
import { Calendar, Download, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../lib/toast';

interface FormTemplateCardProps {
  id: string;
  title: string;
  description: string;
  previewImage: string;
  tags: string[];
  lastUpdated: string;
  industry?: string;
}

export default function FormTemplateCard({
  id,
  title,
  description,
  previewImage,
  tags,
  lastUpdated,
  industry
}: FormTemplateCardProps) {
  const navigate = useNavigate();

  const handleDownload = (format: 'pdf' | 'html', e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`Downloading ${title} in ${format.toUpperCase()} format`, 'success');
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/forms/templates/${id}/preview`, '_blank');
  };

  const handleCardClick = () => {
    navigate(`/forms/templates/${id}`);
  };

  return (
    <div 
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Template Preview Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <img 
          src={previewImage} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-4 text-white">
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-accent text-primary text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Updated: {lastUpdated}
          </div>
          {industry && (
            <div className="text-xs text-gray-500">
              {industry}
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={(e) => handleDownload('pdf', e)}
              className="p-1.5 text-gray-500 hover:text-text"
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => handleDownload('html', e)}
              className="p-1.5 text-gray-500 hover:text-text"
              title="Download HTML"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => handlePreview(e)}
              className="p-1.5 text-gray-500 hover:text-text"
              title="Preview"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleCardClick}
            className="px-3 py-1 bg-secondary text-white text-sm rounded-md hover:bg-primary"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}