import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const location = useLocation();

  return (
    <header className={`header ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="header-left">
        <button 
          className={`hamburger-btn ${sidebarOpen ? 'active' : ''}`} 
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      
      <div className="header-center">
        <nav className="header-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/' || location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/configuration" 
            className={`nav-link ${location.pathname === '/configuration' ? 'active' : ''}`}
          >
            Configuration
          </Link>
          <Link 
            to="/cumulative-fpy" 
            className={`nav-link ${location.pathname === '/cumulative-fpy' ? 'active' : ''}`}
          >
            Cumulative FPY
          </Link>
        </nav>
      </div>

    </header>
  );
};

export default Header;