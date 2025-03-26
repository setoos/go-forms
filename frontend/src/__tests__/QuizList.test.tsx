import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import QuizList from '../components/admin/QuizList';
import { AuthProvider } from '../lib/auth';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            order: vi.fn(() => ({ data: [], error: null }))
          }))
        }))
      })),
      rpc: vi.fn(() => ({ error: null }))
    }))
  }
}));

describe('QuizList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderQuizList = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <QuizList />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Quiz Listing', () => {
    const mockQuizzes = [
      {
        id: 'quiz1',
        title: 'Test Quiz 1',
        description: 'Description 1',
        is_published: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'quiz2',
        title: 'Test Quiz 2',
        description: 'Description 2',
        is_published: false,
        created_at: new Date().toISOString()
      }
    ];

    beforeEach(() => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({ data: mockQuizzes, error: null }))
            }))
          }))
        }))
      }));
    });

    it('should display quiz list', async () => {
      renderQuizList();
      await waitFor(() => {
        expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
        expect(screen.getByText('Test Quiz 2')).toBeInTheDocument();
      });
    });

    it('should show published status', async () => {
      renderQuizList();
      await waitFor(() => {
        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should allow quiz deletion', async () => {
      renderQuizList();
      const deleteButton = await screen.findByTitle('Delete Quiz');
      await userEvent.click(deleteButton);
      
      expect(supabase.rpc).toHaveBeenCalledWith('soft_delete_quiz', expect.any(Object));
    });
  });

  describe('Quiz Actions', () => {
    it('should navigate to create quiz page', async () => {
      renderQuizList();
      const createButton = screen.getByText(/Create Quiz/i);
      await userEvent.click(createButton);
      
      expect(window.location.pathname).toBe('/admin/quizzes/new');
    });

    it('should navigate to edit quiz page', async () => {
      renderQuizList();
      const editButton = await screen.findByTitle('Edit Quiz');
      await userEvent.click(editButton);
      
      expect(window.location.pathname).toMatch(/\/admin\/quizzes\/.+/);
    });

    it('should navigate to preview quiz page', async () => {
      renderQuizList();
      const previewButton = await screen.findByTitle('Preview Quiz');
      await userEvent.click(previewButton);
      
      expect(window.location.pathname).toMatch(/\/quiz\/.+/);
    });
  });
});