import React, { useState } from 'react';
import { Form } from '../../types/aiTypes';
import FormEditor from '../FormBuilder/FormEditor';
import FormPreview from '../FormBuilder/FormPreview';
import { useFormStore } from '../../store/formStore';
import Button from '../ui/NewButton';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import { useFormValidation } from '../hooks/useFormValidation';

interface FormBuilderWrapperProps {
  initialForm: Form;
  onBack: () => void;
}

const FormBuilderWrapper: React.FC<FormBuilderWrapperProps> = ({ initialForm, onBack }) => {
  const [form, setForm] = useState<Form>(initialForm);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { errors, validateForm, clearErrors } = useFormValidation();
  const { createForm, updateForm } = useFormStore();

  const handleFormUpdate = (updatedForm: Form) => {
    setForm(updatedForm);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validateForm(form)) {
      return;
    }

    setIsSaving(true);
    try {
      if (form.id) {
        await updateForm(form.id, form);
      } else {
        await createForm(form);
      }
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={onBack}
        >
          Back to Chat
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye size={16} />}
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? 'Edit Form' : 'Preview'}
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save size={16} />}
            onClick={handleSave}
            isLoading={isSaving}
          >
            Save Form
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {isPreview ? (
        <FormPreview form={form} />
      ) : (
        <FormEditor form={form} onUpdate={handleFormUpdate} />
      )}
    </div>
  );
};

export default FormBuilderWrapper;