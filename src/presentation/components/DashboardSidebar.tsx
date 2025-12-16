import { Link, useLocation } from 'react-router-dom';
import './DashboardSidebar.css';

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle?: () => void;
}

export const DashboardSidebar = ({ isOpen, onToggle }: DashboardSidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: 'space_dashboard'
    },
    { 
      path: '/agents', 
      label: 'Agents', 
      icon: 'badge'
    },
    { 
      path: '/customers', 
      label: 'Customers', 
      icon: 'groups'
    },
  ];

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 768 && onToggle) {
      onToggle();
    }
  };

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  <span className="material-symbols-outlined nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

