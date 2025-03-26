import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Quiz from '../components/Quiz';
import { AuthProvider } from '../lib/auth';
import { supabase } from '../lib/supabase';

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
          single: vi.fn(() => ({ data: { id: 'response-id' }, error: null }))
        }))
      }))
    }))
  }
}));

describe('Quiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderQuiz = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Quiz />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Quiz Taking', () => {
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
            single: vi.fn(() => ({ data: { id: 'response-id' }, error: null }))
          }))
        }))
      }));
    });

    it('should display user info form initially', () => {
      renderQuiz();
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    });

    it('should require user info before starting quiz', async () => {
      renderQuiz();
      const startButton = screen.getByText(/Start Quiz/i);
      await userEvent.click(startButton);
      
      expect(screen.getByLabelText(/Name/i)).toBeInvalid();
    });

    it('should show questions after submitting user info', async () => {
      renderQuiz();
      await userEvent.type(screen.getByLabelText(/Name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Phone/i), '1234567890');
      await userEvent.click(screen.getByText(/Start Quiz/i));
      
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    it('should calculate score correctly', async () => {
      renderQuiz();
      // Fill user info
      await userEvent.type(screen.getByLabelText(/Name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Phone/i), '1234567890');
      await userEvent.click(screen.getByText(/Start Quiz/i));
      
      // Answer question
      await userEvent.click(screen.getByText('Option 1'));
      
      // Verify score calculation
      await waitFor(() => {
        expect(screen.getByText(/Score: 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Results', () => {
    it('should save quiz responses', async () => {
      renderQuiz();
      await userEvent.type(screen.getByLabelText(/Name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Phone/i), '1234567890');
      await userEvent.click(screen.getByText(/Start Quiz/i));
      await userEvent.click(screen.getByText('Option 1'));
      
      expect(supabase.from).toHaveBeenCalledWith('quiz_responses');
    });

    it('should show appropriate feedback based on score', async () => {
      renderQuiz();
      await userEvent.type(screen.getByLabelText(/Name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Phone/i), '1234567890');
      await userEvent.click(screen.getByText(/Start Quiz/i));
      await userEvent.click(screen.getByText('Option 1'));
      
      await waitFor(() => {
        expect(screen.getByText(/Your Marketing Awareness Score/i)).toBeInTheDocument();
      });
    });
  });
});