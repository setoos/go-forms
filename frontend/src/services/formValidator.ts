import { Form, Question } from '../types/aiTypes';

export class FormValidator {
  static validateForm(form: Form): string[] {
    const errors: string[] = [];

    // Validate basic form fields
    if (!form.title?.trim()) {
      errors.push('Form title is required');
    }

    if (!form.type) {
      errors.push('Form type is required');
    }

    if (!form.evaluation_mode) {
      errors.push('Evaluation mode is required');
    }

    // Validate questions
    if (!form.questions || form.questions.length === 0) {
      errors.push('Form must have at least one question');
    } else {
      form.questions.forEach((question, index) => {
        const questionErrors = this.validateQuestion(question);
        if (questionErrors.length > 0) {
          errors.push(`Question ${index + 1}: ${questionErrors.join(', ')}`);
        }
      });
    }

    return errors;
  }

  static validateQuestion(question: Question): string[] {
    const errors: string[] = [];

    if (!question.label?.trim()) {
      errors.push('Question label is required');
    }

    if (!question.type) {
      errors.push('Question type is required');
    }

    // Validate options for multiple choice questions
    if (['multiple-choice', 'checkbox', 'dropdown'].includes(question.type)) {
      if (!question.options || question.options.length < 2) {
        errors.push('Multiple choice questions must have at least 2 options');
      }
    }

    // Validate correct answer for quiz questions
    if (question.correct_answer !== undefined) {
      if (Array.isArray(question.options) && !question.options.includes(question.correct_answer)) {
        errors.push('Correct answer must be one of the options');
      }
    }

    // Validate AI-assisted questions
  if (question.ai_prompt && !question.max_score) {
      errors.push('AI-assisted questions must have a maximum score');
    }

    return errors;
  }
}