import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import QuizEditor from '../components/admin/QuizEditor';
import { AuthProvider } from '../lib/auth';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'new-quiz-id' }, error: null }))
        }))
      })),
      update: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => ({ error: null }))
    }))
  }
}));

describe('QuizEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderQuizEditor = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <QuizEditor />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Quiz Creation', () => {
    it('should allow adding new questions', async () => {
      renderQuizEditor();
      const addQuestionBtn = screen.getByText(/Add Question/i);
      await userEvent.click(addQuestionBtn);
      
      expect(screen.getByText(/Question 1/i)).toBeInTheDocument();
    });

    it('should allow adding options to questions', async () => {
      renderQuizEditor();
      const addQuestionBtn = screen.getByText(/Add Question/i);
      await userEvent.click(addQuestionBtn);
      
      const addOptionBtn = screen.getByText(/Add Option/i);
      await userEvent.click(addOptionBtn);
      
      expect(screen.getAllByPlaceholderText(/Option text/i)).toHaveLength(1);
    });

    it('should validate required fields before saving', async () => {
      renderQuizEditor();
      const continueBtn = screen.getByText(/Continue to Details/i);
      await userEvent.click(continueBtn);
      
      expect(screen.getByText(/Please add at least one question/i)).toBeInTheDocument();
    });
  });

  describe('Quiz Editing', () => {
    const mockQuiz = {
      id: 'test-quiz-id',
      title: 'Test Quiz',
      description: 'Test Description',
      questions: [
        {
          id: 'q1',
          text: 'Question 1',
          options: [
            { id: 'o1', text: 'Option 1', score: 1 },
            { id: 'o2', text: 'Option 2', score: 0 }
          ]
        }
      ]
    };

    beforeEach(() => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockQuiz, error: null }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: 'new-quiz-id' }, error: null }))
          }))
        })),
        update: vi.fn(() => ({ error: null })),
        delete: vi.fn(() => ({ error: null }))
      }));
    });

    it('should load existing quiz data', async () => {
      renderQuizEditor();
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Quiz')).toBeInTheDocument();
      });
    });

    it('should allow editing question text', async () => {
      renderQuizEditor();
      const questionInput = await screen.findByDisplayValue('Question 1');
      await userEvent.clear(questionInput);
      await userEvent.type(questionInput, 'Updated Question');
      
      expect(screen.getByDisplayValue('Updated Question')).toBeInTheDocument();
    });

    it('should allow deleting questions', async () => {
      renderQuizEditor();
      const deleteBtn = await screen.findByTitle('Delete Question');
      await userEvent.click(deleteBtn);
      
      expect(screen.queryByText('Question 1')).not.toBeInTheDocument();
    });
  });

  describe('Quiz Publishing', () => {
    it('should toggle publish status', async () => {
      renderQuizEditor();
      await userEvent.click(screen.getByText(/Continue to Details/i));
      const publishToggle = screen.getByText(/Published/i);
      await userEvent.click(publishToggle);
      
      expect(publishToggle).toBeChecked();
    });
  });
});