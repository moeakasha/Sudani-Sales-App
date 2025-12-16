import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../infrastructure/auth/AuthContext';
import { Logo } from './Logo';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const { user: authUser, signOut } = useAuth();
  const [userDisplay, setUserDisplay] = useState<{ email?: string; name?: string; organization?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) {
      const email = authUser.email || '';
      const orgName = email.split('@')[1]?.split('.')[0] || 'Organization';
      setUserDisplay({
        email: email,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0],
        organization: authUser.user_metadata?.organization || orgName,
      });
    }
  }, [authUser]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuClick} aria-label="Toggle menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Logo />
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search"
          />
          <span className="material-symbols-outlined search-icon">search</span>
        </div>
      </div>
      <div className="header-right">
        <button className="notification-button" aria-label="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        {userDisplay && (
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">{userDisplay.name}</span>
              <span className="user-organization">{userDisplay.email}</span>
            </div>
            <div className="user-avatar">
              {getUserInitials(userDisplay.name || 'U')}
            </div>
          </div>
        )}
        <button className="logout-button" onClick={handleLogout} aria-label="Logout">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
};
