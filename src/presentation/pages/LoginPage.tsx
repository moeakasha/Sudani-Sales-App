import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageIcon from '@mui/icons-material/Language';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/LoginForm';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials';
import { LoginUseCase } from '../../domain/use-cases/LoginUseCase';
import { AuthRepository } from '../../infrastructure/api/AuthRepository';
import './LoginPage.css';

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null | undefined>(null);
  const navigate = useNavigate();

  const authRepository = new AuthRepository();
  const loginUseCase = new LoginUseCase(authRepository);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await loginUseCase.execute(credentials);
      console.log('Login successful:', user);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-form-panel">
        <div className="login-brand">
          <Logo />
        </div>

        <div className="login-content">
          <h1 className="login-title">Login to Sudani Business</h1>
          <p className="login-subtitle">
            Empowering Your Business with Innovative Digital Solutions
          </p>
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>

        <div className="login-legal">
          <span className="legal-copyright">
            © {new Date().getFullYear()} <span className="legal-brand">Sudani</span>. All rights reserved.
          </span>
          <div className="legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookies Settings</a>
          </div>
        </div>
      </section>

      <aside className="login-hero" aria-hidden="true">
        <button className="language-pill" type="button">
          <span>Language</span>
          <LanguageIcon className="language-pill-icon" />
        </button>
      </aside>
    </div>
  );
};
