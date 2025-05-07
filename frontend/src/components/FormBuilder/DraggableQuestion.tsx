import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Question } from '../../types/aiTypes';
import Button from '../ui/NewButton';
import QuestionEditor from './QuestionEditor';

interface DraggableQuestionProps {
  question: Question;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updatedQuestion: Question) => void;
  onDelete: () => void;
}

const DraggableQuestion: React.FC<DraggableQuestionProps> = ({
  question,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border ${
        isDragging ? 'shadow-lg border-blue-400' : 'border-gray-200'
      } mb-4`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-gray-100 p-1 rounded mr-2"
            >
              <GripVertical size={20} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{question.label}</div>
              <div className="text-sm text-gray-500">{question.type}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-gray-500 hover:text-red-500 hover:bg-red-50"
              title="Delete question"
            >
              <Trash2 size={16} />
            </Button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              {isExpanded ? (
                <ChevronUp size={20} className="text-gray-500" />
              ) : (
                <ChevronDown size={20} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <QuestionEditor
              question={question}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableQuestion;