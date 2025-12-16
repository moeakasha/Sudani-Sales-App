import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../infrastructure/supabase/client';
import { Logo } from './Logo';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export const DashboardHeader = ({}: DashboardHeaderProps) => {
  const [user, setUser] = useState<{ email?: string; name?: string; organization?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const email = user.email || '';
        const orgName = email.split('@')[1]?.split('.')[0] || 'Organization';
        setUser({
          email: email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
          organization: user.user_metadata?.organization || orgName,
        });
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
        {user && (
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-organization">{user.email}</span>
            </div>
            <div className="user-avatar">
              {getUserInitials(user.name || 'U')}
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
