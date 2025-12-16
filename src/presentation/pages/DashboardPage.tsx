import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardContent } from '../components/DashboardContent';
import { supabase } from '../../infrastructure/supabase/client';
import './DashboardPage.css';

export const DashboardPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="dashboard-page">
      <DashboardHeader onMenuClick={() => {}} />
      <div className="dashboard-layout">
        <DashboardSidebar isOpen={true} onToggle={() => {}} />
        <div className="dashboard-main sidebar-open">
          <DashboardContent />
        </div>
      </div>
    </div>
  );
};
