import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Dashboard.css';
import FPYChart from '../charts/FPYChart';
import CPKChart from '../charts/CPKChart';

// Add these imports
import { apiService, SERVER_CONFIG, createProjectData } from '../services/apiService';

const Dashboard = () => {
  const [formData, setFormData] = useState({
    monitoringServer: 'RCP JAIPUR',
    area: 'PCBA',
    pcbaType: 'Main PCB',
    lineNo: '',
    project: '',
    startDate: '',
    endDate: '',
    viewMode: 'linewise' // 'linewise' or 'projectwise'
  });

  const [showResults, setShowResults] = useState(false); // Controls entire results area visibility
  const [showCharts, setShowCharts] = useState(false);
  const [fpyData, setFpyData] = useState(null);
  const [cpkData, setCpkData] = useState(null);
  const [cpkList, setCpkList] = useState([]);
  const [noDataMessage, setNoDataMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add state for project selection
  const [selectedServer, setSelectedServer] = useState(2); // Default RCP
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(false); // Add loading state for projects
  const [projectsError, setProjectsError] = useState(''); // Add error state for projects
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Ref for auto-scrolling to results
  const resultsRef = useRef(null);

  // Server info mapping with actual server IPs
  const ServerInfo = [
    { id: 1, name: 'Genus RND - 192.10.10.4', serverIP: '192.10.10.4' },
    { id: 2, name: 'RCP Jaipur - 10.141.61.40', serverIP: '10.141.61.40' },
    { id: 3, name: 'HDR 1101 - 10.133.100.21', serverIP: '10.133.100.21' },
    { id: 4, name: 'HDR 1100 - 10.134.1.21', serverIP: '10.134.1.21' },
    { id: 5, name: 'HDR 1201 - 10.133.1.22', serverIP: '10.133.1.22' },
    { id: 6, name: 'Guhawati - 10.161.1.22', serverIP: '10.161.1.22' },
  ];

  // Load server configuration from localStorage on component mount
  useEffect(() => {
    const savedServerId = localStorage.getItem('server');
    if (savedServerId) {
      const serverId = parseInt(savedServerId);
      const serverInfo = ServerInfo.find(server => server.id === serverId);
      if (serverInfo) {
        setSelectedServer(serverId);
        setFormData(prev => ({
          ...prev,
          monitoringServer: serverInfo.name
        }));
      }
    }
  }, []);

  // Retry function (triggers reload via reloadTrigger)
  const retryLoadProjects = useCallback(() => {
    if (formData.viewMode === 'projectwise') {
      setProjectsError('');
      setProjectsLoading(true);
      setReloadTrigger(prev => prev + 1);
    }
  }, [formData.viewMode]);

// FIXED: Load projects with proper cleanup and timeout handling
useEffect(() => {
  let isCancelled = false;
  let timeoutId = null;

  const loadProjects = async () => {
    if (formData.viewMode === 'projectwise') {
      setProjectsLoading(true);

      try {
        const serverInfo = ServerInfo.find(server => server.id === selectedServer);
        const serverIP = serverInfo ? serverInfo.serverIP : '10.141.61.40';

        console.log('Loading projects for server IP:', serverIP);

        const controller = new AbortController();
        
        // Set timeout for the API call
        timeoutId = setTimeout(() => {
          controller.abort();
          console.warn('Project loading request timed out');
        }, 10000); // 10s timeout

        const projectList = await apiService.getProjectList(serverIP, controller.signal);

        // Clear timeout if request completes successfully
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!isCancelled) {
          if (Array.isArray(projectList) && projectList.length > 0) {
            setProjects(projectList);
            setProjectsError('');
            // Only show results if we're in projectwise mode and have projects
            setShowResults(true);
          } else {
            setProjects([]);
            setProjectsError('No projects found for this server');
            setShowResults(false);
          }
        }
      } catch (error) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!isCancelled) {
          console.error('Error loading projects:', error);
          setProjects([]);
          setShowResults(false);

          if (error.name === 'AbortError') {
            setProjectsError('Request timed out. Please try again.');
          } else {
            setProjectsError('Failed to load projects. Please try again.');
          }
        }
      } finally {
        if (!isCancelled) {
          setProjectsLoading(false);
        }
      }
    } else {
      // Clear projects when in linewise mode
      setProjects([]);
      setSelectedProject('');
      setProjectsError('');
      setFormData(prev => ({ ...prev, project: '' }));
      setProjectsLoading(false);
      setShowResults(false);
    }
  };

  // Only debounce if we're in projectwise mode and not hiding results due to form changes
  if (formData.viewMode === 'projectwise') {
    const debounceTimeout = setTimeout(() => {
      loadProjects();
    }, 300); // 300ms debounce

    // FIXED: Proper cleanup function
    return () => {
      isCancelled = true;
      clearTimeout(debounceTimeout);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  } else {
    // Execute immediately for linewise mode (no debounce needed)
    loadProjects();
    
    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }
}, [selectedServer, formData.viewMode, reloadTrigger]);

  // Auto-scroll to results when they become visible
  useEffect(() => {
    if (showResults && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [showResults]);

  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return { isValid: false, message: 'Please select both start date and end date' };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Remove time component for comparison
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    if (start > end) {
      return { isValid: false, message: 'Start date should not be greater than end date' };
    }
    
    if (start > today) {
      return { isValid: false, message: 'Start date cannot be in the future' };
    }
    
    if (end > today) {
      return { isValid: false, message: 'End date cannot be in the future' };
    }
    
    return { isValid: true, message: '' };
  };

// Fixed GetFPYDatas function in Dashboard.js
//This part of Code has been changed using Claude
const GetFPYDatas = async (option) => {
  try {
    // ✅ VALIDATION: Ensure required fields are present
    if (!selectedServer) {
      console.error('No server selected');
      setFpyData([]);
      return null;
    }

    if (!formData.project) {
      console.error('No project selected');
      setFpyData([]);
      return null;
    }

    // ✅ CRITICAL FIX: Ensure stage is valid (> 0)
    if (!formData.stage || formData.stage <= 0) {
      console.error('Invalid stage selected. Stage must be > 0');
      setFpyData([]);
      return null;
    }

    // ✅ VALIDATION: Ensure dates are present
    if (!formData.startDate || !formData.endDate) {
      console.error('Start date and end date are required');
      setFpyData([]);
      return null;
    }

    const projectData = {
      serverID: selectedServer,
      projCode: formData.project,
      stage: formData.stage,              // ✅ Now guaranteed to be > 0
      startDate: formData.startDate,
      endDate: formData.endDate,
      Option: option || formData.viewMode || 1  // ✅ Default to 1 instead of 0
    };

    console.log('Dashboard - Sending FPY request:', projectData);
    debugger;

    const data = await apiService.getFPYData(projectData);
    console.log('Dashboard - FPY API Response:', data);

    if (data && Array.isArray(data) && data.length > 0) {
      setFpyData(data);
      console.log('FPY Data loaded successfully:', data.length, 'records');
    } else {
      console.log('No FPY data found for current selection');
      setFpyData([]);
    }

    return data;
  } catch (error) {
    console.error('Error loading FPY data:', error);
    setFpyData([]);
    return null;
  }
};

// ✅ ADDITIONAL: Add validation before calling GetFPYDatas
const handleGetFPYData = async () => {
  // Validate form data before making API call
  if (!formData.stage || formData.stage <= 0) {
    alert('Please select a valid stage before loading FPY data');
    return;
  }
  
  if (!formData.project) {
    alert('Please select a project before loading FPY data');
    return;
  }
  
  if (!formData.startDate || !formData.endDate) {
    alert('Please select start and end dates');
    return;
  }
  
  await GetFPYDatas();
};

  // Function to get CPK data from API
  const GetCPKData = async () => {
    try {
      const projectData = createProjectData({
        serverId: selectedServer,
        area: formData.area,
        pcbaType: formData.pcbaType,
        lineNo: formData.lineNo,
        project: formData.project,
        startDate: formData.startDate,
        endDate: formData.endDate,
        viewMode: formData.viewMode
      });
      
      const data = await apiService.getCPKData(projectData);
      
      if (data && data.length > 0) {
        setCpkData(data);
        // Create CPK list with all parameters enabled by default
        const cpkListData = data.map(() => ({ state: true }));
        setCpkList(cpkListData);
        console.log('CPK Data loaded:', data);
      } else {
        console.log('No CPK data found for current selection');
        setCpkData([]);
        setCpkList([]);
      }
      
      return data;
    } catch (error) {
      console.error('Error loading CPK data:', error);
      setCpkData([]);
      setCpkList([]);
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Real-time date validation
    if (name === 'startDate' || name === 'endDate') {
      const newFormData = { ...formData, [name]: value };
      
      if (name === 'startDate' && newFormData.endDate) {
        const validation = validateDates(value, newFormData.endDate);
        if (!validation.isValid) {
          alert(validation.message);
          return;
        }
      } else if (name === 'endDate' && newFormData.startDate) {
        const validation = validateDates(newFormData.startDate, value);
        if (!validation.isValid) {
          alert(validation.message);
          return;
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset Line No when switching to project-wise view
      ...(name === 'viewMode' && value === 'projectwise' && { lineNo: '' })
    }));

    // Hide results when form data changes
    setShowResults(false);
    setShowCharts(false);
    setNoDataMessage('');
  };

  const handleProjectChange = (e) => {
    const value = e.target.value;
    setSelectedProject(value);
    setFormData(prev => ({
      ...prev,
      project: value
    }));
    
    // Hide results when project changes
    setShowResults(false);
    setShowCharts(false);
    setNoDataMessage('');
  };

  const handleViewModeToggle = (mode) => {
    setFormData(prev => ({
      ...prev,
      viewMode: mode,
      // Reset Line No and Project when switching modes
      ...(mode === 'projectwise' && { lineNo: '' }),
      ...(mode === 'linewise' && { project: '' })
    }));
    
    // Reset selected project when switching modes
    setSelectedProject('');
    
    // Hide results when view mode changes
    setShowResults(false);
    setShowCharts(false);
    setNoDataMessage('');
  };

  const validateForm = () => {
    // Check if dates are selected
    if (!formData.startDate || !formData.endDate) {
      alert('Please select both start date and end date');
      return false;
    }

    // Validate date range
    const dateValidation = validateDates(formData.startDate, formData.endDate);
    if (!dateValidation.isValid) {
      alert(dateValidation.message);
      return false;
    }

    // Check monitoring server
    if (!formData.monitoringServer) {
      alert('Please select a Monitoring Server');
      return false;
    }

    // // Check area
    // if (!formData.area) {
    //   alert('Please select an Area');
    //   return false;
    // }

    // // Check PCBA type
    // if (!formData.pcbaType) {
    //   alert('Please select a PCBA Type');
    //   return false;
    // }

    // Validate required fields based on view mode
    if (formData.viewMode === 'linewise' && !formData.lineNo) {
      alert('Please select Line No for Line Wise view');
      return false;
    }
    
    if (formData.viewMode === 'projectwise' && !formData.project) {
      alert('Please select a Project for Project Wise view');
      return false;
    }

    return true;
  };

  const handleFind = async () => {
    console.log('Search with:', formData);
    
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    setShowResults(true); // Show results container immediately
    setShowCharts(false);
    setNoDataMessage('');
    
    try {
      // Load data from API
      const fpyResult = await GetFPYDatas(1);
      const cpkResult = await GetCPKData();
      
      // Check if any data was found
      const hasFpyData = fpyResult && fpyResult.length > 0;
      const hasCpkData = cpkResult && cpkResult.length > 0;
      
      if (hasFpyData || hasCpkData) {
        setShowCharts(true);
        setNoDataMessage('');
      } else {
        setShowCharts(false);
        setNoDataMessage('No data found for selected criteria');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setShowCharts(false);
      setNoDataMessage('Error occurred while fetching data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Get current server from localStorage when resetting
    const savedServerId = localStorage.getItem('server');
    let serverName = 'RCP JAIPUR'; // default
    let serverId = 2; // default
    
    if (savedServerId) {
      serverId = parseInt(savedServerId);
      const serverInfo = ServerInfo.find(server => server.id === serverId);
      if (serverInfo) {
        serverName = serverInfo.name;
      }
    }
    
    setSelectedServer(serverId);
    setSelectedProject('');
    setFormData({
      monitoringServer: serverName,
      area: 'PCBA',
      pcbaType: 'Main PCB',
      lineNo: '',
      project: '',
      startDate: '',
      endDate: '',
      viewMode: 'linewise'
    });
    
    // Hide results area completely
    setShowResults(false);
    setShowCharts(false);
    setFpyData(null);
    setCpkData(null);
    setCpkList([]);
    setNoDataMessage('');
    setIsLoading(false);
  };

  const lineNumbers = [
    'RCP 01',
    'RCP 02',
    'RCP 03',
    'RCP 04',
    'RCP 05',
    'PL01',
    'PL02',
    'PL03',
    'PL04',
    'PL05',
    'PL06',
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="search-form">
          <h2 className="form-title">JHALAK APPLICATION</h2>
          
          <div className="form-row first-row">
            <div className="form-group">
              <label>Monitoring Server</label>
              <input 
                type="text" 
                name="monitoringServer"
                value={formData.monitoringServer}
                onChange={handleInputChange}
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label>Start Date <span style={{color: 'red'}}>*</span></label>
              <input 
                type="date" 
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="date-input"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date <span style={{color: 'red'}}>*</span></label>
              <input 
                type="date" 
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="date-input"
                max={new Date().toISOString().split('T')[0]}
                min={formData.startDate}
                required
              />
            </div>
          </div>

          <div className="form-row second-row">
            <div className="form-group">
              <label>View Mode</label>
              <div className="toggle-switch">
                <button 
                  type="button"
                  className={`toggle-option ${formData.viewMode === 'linewise' ? 'active' : ''}`}
                  onClick={() => handleViewModeToggle('linewise')}
                >
                  Line Wise
                </button>
                <button 
                  type="button"
                  className={`toggle-option ${formData.viewMode === 'projectwise' ? 'active' : ''}`}
                  onClick={() => handleViewModeToggle('projectwise')}
                >
                  Project Wise
                </button>
              </div>
            </div>

            {formData.viewMode === 'linewise' && (
              <div className="form-group">
                <label>Select Line No <span style={{color: 'red'}}>*</span></label>
                <select 
                  name="lineNo"
                  value={formData.lineNo}
                  onChange={handleInputChange}
                  className="select-input"
                  required
                >
                  <option value="">Select Line No</option>
                  {lineNumbers.map(line => (
                    <option key={line} value={line}>{line}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.viewMode === 'projectwise' && (
              <div className="form-group">
                <label>Select Project <span style={{color: 'red'}}>*</span></label>
                <select 
                  name="project"
                  value={selectedProject}
                  onChange={handleProjectChange}
                  className="select-input"
                  required
                  disabled={projectsLoading}
                >
                  <option value="">
                    {projectsLoading ? 'Loading projects...' : 
                     projectsError ? 'Failed to load projects' : 'Select Project'}
                  </option>
                  {projects.map(project => (
                    <option 
                      key={project.projId || project.ProjId} 
                      value={project.projCode || project.ProjCode}
                    >
                      {project.projCode || project.ProjCode}
                    </option>
                  ))}
                </select>
                
                {/* Loading/Error feedback */}
                {projectsLoading && (
                  <div style={{ fontSize: '12px', color: '#007bff', marginTop: '4px' }}>
                    ⏳ Loading project list...
                  </div>
                )}
                
                {projectsError && !projectsLoading && (
                  <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
                    ⚠️ {projectsError} 
                    <button 
                      type="button"
                      onClick={retryLoadProjects}
                      style={{ 
                        marginLeft: '8px', 
                        background: 'none', 
                        border: 'none', 
                        color: '#007bff', 
                        cursor: 'pointer', 
                        textDecoration: 'underline',
                        fontSize: '12px'
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}
                
                {projects.length > 0 && !projectsLoading && !projectsError && (
                  <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
                    ✓ {projects.length} projects loaded
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              className={`find-btn ${isLoading ? 'loading' : ''}`}
              onClick={handleFind}
              disabled={isLoading}
            >
              <span className="btn-icon">
                {isLoading ? '⏳' : '🔍'}
              </span>
              {isLoading ? 'Searching...' : 'Find Data'}
            </button>
            <button className="reset-btn" onClick={handleReset} disabled={isLoading}>
              <span className="btn-icon">🔄</span>
              Reset
            </button>
          </div>
        </div>

        {/* Results Area - Only visible after clicking Find Data */}
        {showResults && (
          <div className="results-area" ref={resultsRef}>
            <div className="results-header">
              <h3>SMART METER PRODUCTION ANALYSIS</h3>
              <div className="results-info">
                <span className="info-tag">
                  Mode: <strong>{formData.viewMode === 'linewise' ? 'Line Wise' : 'Project Wise'}</strong>
                </span>
                {formData.lineNo && formData.viewMode === 'linewise' && (
                  <span className="info-tag">
                    Line No: <strong>{formData.lineNo}</strong>
                  </span>
                )}
                {formData.project && (
                  <span className="info-tag">
                    Project: <strong>{formData.project}</strong>
                  </span>
                )}
                {formData.startDate && formData.endDate && (
                  <span className="info-tag">
                    Date: <strong>{formData.startDate}</strong> to <strong>{formData.endDate}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Searching for data...</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Please wait while we fetch the results
                  </div>
                </div>
              </div>
            )}

            {/* No Data Message */}
            {!isLoading && noDataMessage && (
              <div className="no-data-message">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{noDataMessage}</div>
                <div style={{ fontSize: '14px', color: '#999' }}>
                  Please try different selection criteria or date range
                </div>
              </div>
            )}

            {/* Charts Container - Only show when showCharts is true and not loading */}
            {!isLoading && showCharts && (
              <div className="charts-container">
                {fpyData && fpyData.length > 0 && (
                  <div className="chart-block">
                  <FPYChart
                    data={fpyData}
                    serverID={selectedServer}
                    projCode={formData.project}
                    Option={formData.viewMode}
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                  />
                  </div>
                )}

                {cpkData && cpkData.length > 0 && (
                  <div className="chart-block">
                    <CPKChart
                      data={cpkData}
                      cpkList={cpkList}
                      serverId={selectedServer}
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      project={formData.project}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;