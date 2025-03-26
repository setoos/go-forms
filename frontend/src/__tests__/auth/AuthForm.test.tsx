import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AuthForm from '../../components/auth/AuthForm';
import { AuthProvider } from '../../lib/auth';

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAuthForm = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AuthForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Sign In', () => {
    it('should render sign in form by default', () => {
      renderAuthForm();
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      renderAuthForm();
      const submitButton = screen.getByText(/Sign in/i);
      await userEvent.click(submitButton);
      
      expect(screen.getByLabelText(/Email/i)).toBeInvalid();
      expect(screen.getByLabelText(/Password/i)).toBeInvalid();
    });

    it('should validate email format', async () => {
      renderAuthForm();
      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab();
      
      expect(emailInput).toBeInvalid();
    });

    it('should validate password length', async () => {
      renderAuthForm();
      const passwordInput = screen.getByLabelText(/Password/i);
      await userEvent.type(passwordInput, '123');
      await userEvent.tab();
      
      expect(passwordInput).toBeInvalid();
    });
  });

  describe('Sign Up', () => {
    it('should switch to sign up form', async () => {
      renderAuthForm();
      const switchButton = screen.getByText(/Don't have an account/i);
      await userEvent.click(switchButton);
      
      expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    });

    it('should validate password requirements', async () => {
      renderAuthForm();
      await userEvent.click(screen.getByText(/Don't have an account/i));
      
      const passwordInput = screen.getByLabelText(/Password/i);
      await userEvent.type(passwordInput, '123');
      await userEvent.tab();
      
      expect(passwordInput).toBeInvalid();
    });
  });
});