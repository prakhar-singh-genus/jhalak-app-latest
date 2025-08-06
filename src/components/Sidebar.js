import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
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
          onClick={() => { if (window.innerWidth <= 768) { toggleSidebar(); } }}
        >
          <span className="sidebar-icon">📊</span>
          <span className="sidebar-text">Dashboard</span>
        </Link>
        <Link 
          to="/configuration" 
          className={`sidebar-link ${location.pathname === '/configuration' ? 'active' : ''}`}
          onClick={() => { if (window.innerWidth <= 768) { toggleSidebar(); } }}
        >
          <span className="sidebar-icon">⚙️</span>
          <span className="sidebar-text">Configuration</span>
        </Link>
        <Link 
          to="/cumulative-fpy" 
          className={`sidebar-link ${location.pathname === '/cumulative-fpy' ? 'active' : ''}`}
          onClick={() => { if (window.innerWidth <= 768) { toggleSidebar(); } }}
        >
          <span className="sidebar-icon">📈</span>
          <span className="sidebar-text">Cumulative FPY</span>
        </Link>
        <Link 
          to="/cumulative-pareto" 
          className={`sidebar-link ${location.pathname === '/cumulative-pareto' ? 'active' : ''}`}
          onClick={() => { if (window.innerWidth <= 768) { toggleSidebar(); } }}
        >
          <span className="sidebar-icon">📉</span>
          <span className="sidebar-text">Cumulative Pareto</span>
        </Link>
      </nav>
      <div className="sidebar-footer"></div>
    </aside>
  );
};

export default Sidebar;