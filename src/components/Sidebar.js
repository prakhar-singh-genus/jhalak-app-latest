import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  // Handle body scroll when sidebar is open on mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle window resize to close sidebar on mobile when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isOpen) {
        // Don't auto-close on desktop, let user control it
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  return (
    <>
      {/* Overlay for mobile - only show when sidebar is open */}
      {isOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo">
              <img src="/genus_logo.png" alt="Genus Logo" className="logo-image" />
              {/* Uncomment below if you want to show company name */}
              {/* <span className="company-name">Genus</span> */}
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/dashboard" 
            className={`sidebar-link ${location.pathname === '/' || location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => {
              // Close sidebar on mobile when navigating
              if (window.innerWidth <= 768) {
                toggleSidebar();
              }
            }}
          >
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-text">Dashboard</span>
            {(location.pathname === '/' || location.pathname === '/dashboard') && 
              <span className="new-badge">NEW</span>
            }
          </Link>
          
          <Link 
            to="/configuration" 
            className={`sidebar-link ${location.pathname === '/configuration' ? 'active' : ''}`}
            onClick={() => {
              // Close sidebar on mobile when navigating
              if (window.innerWidth <= 768) {
                toggleSidebar();
              }
            }}
          >
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-text">Configuration</span>
          </Link>
          
          {/* Add more navigation items here */}
          {/* 
          <Link 
            to="/analytics" 
            className={`sidebar-link ${location.pathname === '/analytics' ? 'active' : ''}`}
            onClick={() => {
              if (window.innerWidth <= 768) {
                toggleSidebar();
              }
            }}
          >
            <span className="sidebar-icon">📈</span>
            <span className="sidebar-text">Analytics</span>
          </Link>
          */}
        </nav>
        
        {/* Optional: Add footer section */}
        <div className="sidebar-footer">
          {/* You can add version info, user info, or other elements here */}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;