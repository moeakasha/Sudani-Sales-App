import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
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
      // Redirect to dashboard on successful login
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
      <Header />
      <div className="login-container">
        <div className="login-content">
          <h1 className="login-title">Login to Sudani Business</h1>
          <p className="login-subtitle">Empowering Your Business with Innovative Digital Solutions</p>
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

