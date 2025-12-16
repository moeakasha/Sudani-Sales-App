import { useState, type FormEvent } from 'react';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials';
import './LoginForm.css';

// Icons as SVG components
const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66667 5.83333V4.16667C6.66667 3.24619 7.41286 2.5 8.33333 2.5H11.6667C12.5871 2.5 13.3333 3.24619 13.3333 4.16667V5.83333M6.66667 5.83333H4.16667C3.24619 5.83333 2.5 6.57952 2.5 7.5V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V7.5C17.5 6.57952 16.7538 5.83333 15.8333 5.83333H13.3333M6.66667 5.83333H13.3333M10 9.16667V12.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3.33333C5.83333 3.33333 2.27499 6.15833 0.833328 10C2.27499 13.8417 5.83333 16.6667 10 16.6667C14.1667 16.6667 17.725 13.8417 19.1667 10C17.725 6.15833 14.1667 3.33333 10 3.33333ZM10 14.1667C7.69999 14.1667 5.83333 12.3 5.83333 10C5.83333 7.7 7.69999 5.83333 10 5.83333C12.3 5.83333 14.1667 7.7 14.1667 10C14.1667 12.3 12.3 14.1667 10 14.1667ZM10 7.5C8.61666 7.5 7.49999 8.61667 7.49999 10C7.49999 11.3833 8.61666 12.5 10 12.5C11.3833 12.5 12.5 11.3833 12.5 10C12.5 8.61667 11.3833 7.5 10 7.5Z" fill="#6B7280"/>
  </svg>
);

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const LoginForm = ({
  onSubmit,
  isLoading = false,
  error,
}: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await onSubmit({ email, password });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const displayError = error || localError;

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Sudani Organization Email
        </label>
        <div className="input-wrapper">
          <input
            id="email"
            type="email"
            className="form-input form-input-focused"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Your Organization Email"
            disabled={isLoading}
            required
          />
          <span className="input-icon">
            <BriefcaseIcon />
          </span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Password *
        </label>
        <div className="input-wrapper">
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Your Password"
            disabled={isLoading}
            required
          />
          <span className="input-icon">
            <EyeIcon />
          </span>
        </div>
      </div>

      {displayError && (
        <div className="error-message" role="alert">
          {displayError}
        </div>
      )}

      <div className="forgot-password-wrapper">
        <a href="#" className="forgot-password-link">
          Forgot Password?
        </a>
      </div>

      <button
        type="submit"
        className="login-button"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <div className="form-footer">
        <p className="admin-contact-text">
          For access issues, <a href="#" className="contact-link">Contact</a> your organization's administrator
        </p>
      </div>
    </form>
  );
};

