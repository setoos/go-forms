import React from 'react';
import { Form } from '../../types/aiTypes';
import { Calendar, Users, LineChart, FileText, Clock, Edit, Trash2, Link2, Copy } from 'lucide-react';
import Card from '../ui/NewCard';

interface FormCardProps {
  form: Form;
  onEdit: (form: Form) => void;
  onDuplicate: (form: Form) => void;
  onDelete: (form: Form) => void;
  onShare: (form: Form) => void;
}

const FormCard: React.FC<FormCardProps> = ({
  form,
  onEdit,
  onDuplicate,
  onDelete,
  onShare,
}) => {
  const getTypeIcon = () => {
    switch (form.type) {
      case 'contact':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'survey':
        return <Users className="h-5 w-5 text-purple-600" />;
      case 'quiz':
        return <Calendar className="h-5 w-5 text-green-600" />;
      case 'assessment':
        return <LineChart className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-blue-600" />;
    }
  };

  const formattedDate = form.updated_at.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card 
      elevation="low" 
      padding="medium"
      className="transition-all duration-200 hover:shadow-md"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-gray-100">
            {getTypeIcon()}
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{form.title}</h3>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <Clock size={14} className="mr-1" />
              <span>Updated: {formattedDate}</span>
            </div>
          </div>
        </div>
        
        <div className="flex">
          <span className={`text-xs font-medium px-2 py-1 rounded-full 
            ${form.type === 'contact' ? 'bg-blue-100 text-blue-800' : 
              form.type === 'survey' ? 'bg-purple-100 text-purple-800' : 
              form.type === 'quiz' ? 'bg-green-100 text-green-800' : 
              'bg-orange-100 text-orange-800'}`
          }>
            {form.type.charAt(0).toUpperCase() + form.type.slice(1)}
          </span>
        </div>
      </div>
      
      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
        {form.description || 'No description provided.'}
      </p>
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {form.questions.length} question{form.questions.length !== 1 ? 's' : ''}
        </div>
        
        <div className="flex space-x-2">
          <button
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            onClick={() => onEdit(form)}
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            onClick={() => onDuplicate(form)}
            title="Duplicate"
          >
            <Copy size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            onClick={() => onShare(form)}
            title="Share"
          >
            <Link2 size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            onClick={() => onDelete(form)}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default FormCard;