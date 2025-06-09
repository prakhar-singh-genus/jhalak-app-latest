import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import '@coreui/coreui/dist/css/coreui.min.css';
import './App.css';
import Configuration from './pages/Configuration';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="App">
        <div className="app-layout">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          
          {/* Main content area (Header + Content) */}
          <div className={`main-area ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/configuration" element={<Configuration />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;