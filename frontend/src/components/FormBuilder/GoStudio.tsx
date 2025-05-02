import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Settings,
  Layout,
  Grid,
  Columns,
  Save,
  Plus,
  Eye,
  Wand2,
  FileText,
  MessageSquare,
  Calculator,
  BarChart,
  Share2,
  Trash2,
  Copy,
  ArrowLeft,
} from 'lucide-react';
import { Form, Question, FormTier } from '../../types/aiTypes';
import Button from '../ui/NewButton';
import Input from '../ui/NewInput';
import DraggableQuestion from './DraggableQuestion';
import { motion, AnimatePresence } from 'framer-motion';
import FormPreview from './FormPreview';
import { FormGenerator } from '../../services/formGenerator';

interface GoStudioProps {
  form: Form;
  onUpdate: (updatedForm: Form) => void;
  onBack?: () => void;
  onSave?: () => void;
}

const GoStudio: React.FC<GoStudioProps> = ({
  form,
  onUpdate,
  onBack,
  onSave,
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [layout, setLayout] = useState<'single' | 'double'>('single');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const aiPromptRef = useRef<HTMLTextAreaElement>(null);

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

  const getTierIcon = (tier: FormTier) => {
    switch (tier) {
      case 'capture':
        return <FileText size={16} />;
      case 'learn':
        return <MessageSquare size={16} />;
      case 'engage':
        return <Grid size={16} />;
      case 'strategize':
        return <BarChart size={16} />;
      case 'convert':
        return <Calculator size={16} />;
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPromptRef.current?.value) return;
    
    setIsGenerating(true);
    try {
      const generatedForm = await FormGenerator.generateForm(aiPromptRef.current.value);
      onUpdate({
        ...form,
        questions: [...form.questions, ...generatedForm.questions],
      });
      setShowAIPrompt(false);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsGenerating(false);
    }
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

  const handleQuestionUpdate = useCallback((questionId: string, updatedQuestion: Question) => {
    onUpdate({
      ...form,
      questions: form.questions.map(q => q.id === questionId ? updatedQuestion : q),
    });
  }, [form, onUpdate]);

  const handleQuestionDelete = (questionId: string) => {
    onUpdate({
      ...form,
      questions: form.questions.filter(q => q.id !== questionId),
    });
    const newExpandedQuestions = new Set(expandedQuestions);
    newExpandedQuestions.delete(questionId);
    setExpandedQuestions(newExpandedQuestions);
  };

  const handleQuestionDuplicate = (questionId: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question) return;

    const duplicatedQuestion: Question = {
      ...question,
      id: crypto.randomUUID(),
      label: `${question.label} (Copy)`,
      order: form.questions.length + 1,
    };

    onUpdate({
      ...form,
      questions: [...form.questions, duplicatedQuestion],
    });
  };

  return (
    <div className={`max-w-7xl mx-auto grid ${layout === 'double' ? 'grid-cols-2 gap-8' : 'grid-cols-1'}`}>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>
              )}
              <div className="flex-1">
                <Input
                  label="Form Title"
                  value={form.title}
                  onChange={(e) => onUpdate({ ...form, title: e.target.value })}
                  fullWidth
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
              {onSave && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save size={16} />}
                  onClick={onSave}
                >
                  Save
                </Button>
              )}
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
                      Form Tier
                    </label>
                    <div className="flex items-center space-x-2">
                      {getTierIcon(form.tier)}
                      <span className="text-sm font-medium capitalize">{form.tier}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evaluation Mode
                    </label>
                    <select
                      value={form.evaluationMode}
                      onChange={(e) => onUpdate({ ...form, evaluationMode: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="simple">Simple</option>
                      <option value="ai-assisted">AI-Assisted</option>
                      <option value="weighted">Weighted</option>
                      <option value="dynamic">Dynamic</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => onUpdate({ ...form, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.settings.requireIdentity}
                        onChange={(e) => onUpdate({
                          ...form,
                          settings: { ...form.settings, requireIdentity: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require Identity</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.settings.enableBranching}
                        onChange={(e) => onUpdate({
                          ...form,
                          settings: { ...form.settings, enableBranching: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Branching</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.settings.enableScoring}
                        onChange={(e) => onUpdate({
                          ...form,
                          settings: { ...form.settings, enableScoring: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Scoring</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.settings.enableAI}
                        onChange={(e) => onUpdate({
                          ...form,
                          settings: { ...form.settings, enableAI: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable AI</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex space-x-2">
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowQuestionTypes(!showQuestionTypes)}
              className="flex-1"
            >
              Add Question
            </Button>
            <Button
              variant="outline"
              leftIcon={<Wand2 size={16} />}
              onClick={() => setShowAIPrompt(true)}
            >
              AI Generate
            </Button>
          </div>

          <AnimatePresence>
            {showAIPrompt && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <textarea
                  ref={aiPromptRef}
                  placeholder="Describe the questions you want to generate..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIPrompt(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Wand2 size={16} />}
                    onClick={handleAIGenerate}
                    isLoading={isGenerating}
                  >
                    Generate
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                  onUpdate={(updatedQuestion) => handleQuestionUpdate(question.id, updatedQuestion)}
                  onDelete={() => handleQuestionDelete(question.id)}
                  onDuplicate={() => handleQuestionDuplicate(question.id)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
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
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 size={16} />}
                >
                  Share
                </Button>
                {onSave && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Save size={16} />}
                    onClick={onSave}
                  >
                    Save
                  </Button>
                )}
              </div>
            </div>
            <FormPreview form={form} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GoStudio;