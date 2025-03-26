import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from "react";
import Results from "../../components/Results.tsx";
import { generatePDF } from "../../lib/pdf.ts";

vi.mock('../../lib/pdf', () => ({
  generatePDF: vi.fn()
}));

describe('Results', () => {
  const mockLocation = {
    state: {
      answers: { '1': 10, '2': 5 },
      userInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890'
      },
      score: 75,
      isSampleQuiz: false
    }
  };

  const renderResults = () => {
    return render(
      <BrowserRouter>
        <Results />
      </BrowserRouter>
    );
  };

  describe('Score Display', () => {
    it('should display final score', () => {
      renderResults();
      expect(screen.getByText(/75/)).toBeInTheDocument();
    });

    it('should show appropriate feedback based on score', () => {
      renderResults();
      expect(screen.getByText(/Good!/)).toBeInTheDocument();
    });
  });

  describe('PDF Generation', () => {
    it('should generate PDF when download button is clicked', async () => {
      renderResults();
      const downloadButton = screen.getByText(/Download Full Report/i);
      await userEvent.click(downloadButton);
      
      expect(generatePDF).toHaveBeenCalledWith(expect.objectContaining({
        score: 75,
        name: 'Test User'
      }));
    });
  });

  describe('Navigation', () => {
    it('should show sign up button for sample quiz', () => {
      mockLocation.state.isSampleQuiz = true;
      renderResults();
      expect(screen.getByText(/Sign Up to Create Your Own Quiz/i)).toBeInTheDocument();
    });

    it('should show take another quiz button for regular quiz', () => {
      mockLocation.state.isSampleQuiz = false;
      renderResults();
      expect(screen.getByText(/Take Another Quiz/i)).toBeInTheDocument();
    });
  });
});