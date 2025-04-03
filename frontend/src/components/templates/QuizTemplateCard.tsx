import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileQuestion, Users, Eye, Download, Copy } from 'lucide-react';
import { showToast } from '../../lib/toast';

// Audience levels
const audienceLevels: Record<string, string> = {
  'beginner': 'Beginner',
  'intermediate': 'Intermediate',
  'advanced': 'Advanced',
  'expert': 'Expert',
  'all': 'All Levels'
};

interface QuizTemplateCardProps {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionCount: number;
  audienceLevel: string;
  previewImage: string;
  popularity: number;
  lastUpdated: string;
  onExpand: (id: string) => void;
  isExpanded: boolean;
}

export default function QuizTemplateCard({
  id,
  title,
  description,
  duration,
  questionCount,
  audienceLevel,
  previewImage,
  popularity,
  lastUpdated,
  onExpand,
  isExpanded
}: QuizTemplateCardProps) {
  const navigate = useNavigate();

  const handleUseTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/admin/quizzes/new?template=${id}`);
    showToast('Template selected. Customize your quiz now.', 'success');
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/admin/quizzes/new?template=${id}`);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast('Template downloaded successfully', 'success');
  };

  const handleCopyTemplateId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    showToast('Template ID copied to clipboard', 'success');
  };

  return (
    <div 
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
      onClick={() => onExpand(id)}
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
          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {duration} min
          </span>
          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center">
            <FileQuestion className="h-3 w-3 mr-1" />
            {questionCount} questions
          </span>
          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {audienceLevels[audienceLevel]}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Updated: {lastUpdated}
          </div>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i} 
                className={`h-3.5 w-3.5 ${i < Math.floor(popularity) ? 'text-yellow-400' : 'text-gray-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand(id);
            }}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            {isExpanded ? 'Less info' : 'More info'}
          </button>
          <button
            onClick={handleUseTemplate}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
          >
            Use Template
          </button>
        </div>
        
        {/* Expanded Template Info */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handlePreview}
                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Preview
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </button>
              <button
                onClick={handleCopyTemplateId}
                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                Copy ID
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}