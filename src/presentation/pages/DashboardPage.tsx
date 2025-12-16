import { useEffect, useState } from 'react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardContent } from '../components/DashboardContent';
import './DashboardPage.css';

export const DashboardPage = () => {
  // Start with sidebar open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader onMenuClick={toggleSidebar} />
      <div className="dashboard-layout">
        {/* Backdrop for mobile */}
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div 
            className="sidebar-backdrop visible" 
            onClick={toggleSidebar}
          />
        )}
        <DashboardSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className={`dashboard-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <DashboardContent />
        </div>
      </div>
    </div>
  );
};
