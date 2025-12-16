import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './infrastructure/auth/AuthContext';
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { LoginPage } from './presentation/pages/LoginPage';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { AgentsPage } from './presentation/pages/AgentsPage';
import { CustomersPage } from './presentation/pages/CustomersPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agents" 
            element={
              <ProtectedRoute>
                <AgentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
