import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, Settings, Layout, Copy, Trash2, Grid, Columns, Save } from 'lucide-react';
import { Form, Question, QuestionType } from '../../types/aiTypes';
import Button from '../ui/NewButton';
import DraggableQuestion from './DraggableQuestion';
import { motion, AnimatePresence } from 'framer-motion';
import FormPreview from './FormPreview';
import Input from '../ui/NewInput';

interface FormEditorProps {
  form: Form;
  onUpdate: (updatedForm: Form) => void;
}

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ReactNode }[] = [
  { type: 'short-text', label: 'Short Text', icon: <Layout size={16} /> },
  { type: 'long-text', label: 'Long Text', icon: <Layout size={16} /> },
  { type: 'multiple-choice', label: 'Multiple Choice', icon: <Grid size={16} /> },
  { type: 'checkbox', label: 'Checkboxes', icon: <Grid size={16} /> },
  { type: 'dropdown', label: 'Dropdown', icon: <Columns size={16} /> },
  { type: 'rating-scale', label: 'Rating Scale', icon: <Grid size={16} /> },
];

const FormEditor: React.FC<FormEditorProps> = ({ form, onUpdate }) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [layout, setLayout] = useState<'single' | 'double'>('single');

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const updateFormBasics = (field: keyof Form, value: any) => {
    onUpdate({
      ...form,
      [field]: value,
    });
  };

  console.log("form", form);
  

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type,
      label: 'New Question',
      required: false,
      options: type === 'multiple-choice' || type === 'checkbox' ? ['Option 1'] : [],
      order: form.questions.length + 1
    };

    onUpdate({
      ...form,
      questions: [...form.questions, newQuestion],
    });

    setExpandedQuestions(new Set([...expandedQuestions, newQuestion.id]));
    setShowQuestionTypes(false);
  };

  const duplicateQuestion = (questionId: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question) return;

    const newQuestion: Question = {
      ...question,
      id: `question-${Date.now()}`,
      label: `${question.label} (Copy)`,
      order: form.questions.length + 1
    };

    onUpdate({
      ...form,
      questions: [...form.questions, newQuestion],
    });
  };

  const updateQuestion = useCallback((questionId: string, updatedQuestion: Question) => {
    const updatedQuestions = form.questions.map((q) =>
      q.id === questionId ? { ...updatedQuestion } : q
    );

    onUpdate({
      ...form,
      questions: updatedQuestions,
    });
  }, [form, onUpdate]);

  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = form.questions
      .filter((q) => q.id !== questionId)
      .map((q, index) => ({ ...q, order: index + 1 }));

    onUpdate({
      ...form,
      questions: updatedQuestions,
    });

    const newExpandedQuestions = new Set(expandedQuestions);
    newExpandedQuestions.delete(questionId);
    setExpandedQuestions(newExpandedQuestions);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = form.questions.findIndex((q) => q.id === active.id);
    const newIndex = form.questions.findIndex((q) => q.id === over.id);

    const updatedQuestions = arrayMove(form.questions, oldIndex, newIndex).map(
      (q, index) => ({ ...q, order: index + 1 })
    );

    onUpdate({
      ...form,
      questions: updatedQuestions,
    });

    setActiveId(null);
  };

  const toggleQuestionExpanded = (questionId: string) => {
    const newExpandedQuestions = new Set(expandedQuestions);
    if (newExpandedQuestions.has(questionId)) {
      newExpandedQuestions.delete(questionId);
    } else {
      newExpandedQuestions.add(questionId);
    }
    setExpandedQuestions(newExpandedQuestions);
  };

  return (
    <div className={`max-w-7xl mx-auto grid ${layout === 'double' ? 'grid-cols-2 gap-8' : 'grid-cols-1'}`}>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1">
              <Input
                label="Form Title"
                value={form.title}
                onChange={(e) => updateFormBasics('title', e.target.value)}
                fullWidth
              />
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <Button
                variant="outline"
                size="sm"
                leftIcon={layout === 'single' ? <Columns size={16} /> : <Layout size={16} />}
                onClick={() => setLayout(layout === 'single' ? 'double' : 'single')}
              >
                {layout === 'single' ? 'Split View' : 'Single View'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings size={16} />}
                onClick={() => setShowSettings(!showSettings)}
              >
                Settings
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Form Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => updateFormBasics('type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="contact">Contact Form</option>
                      <option value="survey">Survey</option>
                      <option value="quiz">Quiz</option>
                      <option value="assessment">Assessment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evaluation Mode
                    </label>
                    <select
                      value={form.evaluation_mode}
                      onChange={(e) => updateFormBasics('evaluation_mode', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="simple">Simple</option>
                      <option value="ai-assisted">AI-Assisted</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateFormBasics('description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowQuestionTypes(!showQuestionTypes)}
              className="w-full"
            >
              Add Question
            </Button>

            <AnimatePresence>
              {showQuestionTypes && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 p-2 bg-white rounded-lg border border-gray-200 shadow-lg z-10"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {QUESTION_TYPES.map(({ type, label, icon }) => (
                      <button
                        key={type}
                        onClick={() => addQuestion(type)}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg w-full text-left transition-colors"
                      >
                        <span className="p-1.5 bg-gray-100 rounded-md text-gray-600">
                          {icon}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={form.questions.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {form.questions.map((question) => (
                <DraggableQuestion
                  key={question.id}
                  question={question}
                  isExpanded={expandedQuestions.has(question.id)}
                  onToggleExpand={() => toggleQuestionExpanded(question.id)}
                  onUpdate={(updatedQuestion) => updateQuestion(question.id, updatedQuestion)}
                  onDelete={() => deleteQuestion(question.id)}
                  onDuplicate={() => duplicateQuestion(question.id)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={defaultDropAnimation}>
            {activeId ? (
              <div className="bg-white rounded-lg border-2 border-blue-500 shadow-lg p-4 opacity-90">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {form.questions.find(q => q.id === activeId)?.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {form.questions.find(q => q.id === activeId)?.type}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {form.questions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 mb-4">No questions yet</p>
            <Button
              variant="outline"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowQuestionTypes(true)}
            >
              Add your first question
            </Button>
          </div>
        )}
      </div>

      {layout === 'double' && (
        <div className="sticky top-24 h-[calc(100vh-6rem)]">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview</h2>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save size={16} />}
                onClick={handleSave}
              >
                Save Form
              </Button>
            </div>
            <FormPreview form={form} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormEditor;