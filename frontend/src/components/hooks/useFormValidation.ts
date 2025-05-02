import { useState, useCallback } from 'react';
import { FormValidator } from '../../services/formValidator';
import { Form } from '../../types/aiTypes';

export const useFormValidation = () => {
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = useCallback((form: Form) => {
    const validationErrors = FormValidator.validateForm(form);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    validateForm,
    clearErrors,
  };
};