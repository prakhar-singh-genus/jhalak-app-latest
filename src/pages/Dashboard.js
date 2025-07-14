import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Dashboard.css';
import FPYChart from '../charts/FPYChart';
import CPKChart from '../charts/CPKChart';

// ✅ UPDATED: Import the correct API functions
import { apiService, createCPKData, createProjectData, validateDateRange } from '../services/apiService';

const Dashboard = () => {
  const [formData, setFormData] = useState({
    monitoringServer: 'RCP JAIPUR',
    lineNo: '',
    project: '',
    startDate: '',
    endDate: '',
    viewMode: '' // No default selection - user must choose
  });

  const [showResults, setShowResults] = useState(false);
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
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  
  // ✅ ENHANCED: Server-specific CPK parameters state
  const [cpkParameters, setCpkParameters] = useState([]);
  const [cpkParametersLoaded, setCpkParametersLoaded] = useState(false);
  
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

  // ✅ ENHANCED: Load server-specific CPK parameters from localStorage
  useEffect(() => {
    const loadCpkParameters = () => {
      try {
        // ✅ FIX: Try server-specific key first
        const serverSpecificKey = `LocalData_Server_${selectedServer}`;
        let savedCpkParams = localStorage.getItem(serverSpecificKey);
        
        if (!savedCpkParams) {
          // ✅ FALLBACK: Try generic key
          savedCpkParams = localStorage.getItem('LocalData');
        }
        
        if (savedCpkParams) {
          const parsedParams = JSON.parse(savedCpkParams);
          setCpkParameters(parsedParams);
          setCpkParametersLoaded(true);
          console.log(`✅ CPK Parameters loaded for server ${selectedServer}:`, parsedParams);
        } else {
          // ✅ DEFAULT: Create default CPK parameters if none exist
          console.log(`⚠️ No CPK parameters found for server ${selectedServer}, creating defaults`);
          const defaultParams = createDefaultCpkParameters();
          setCpkParameters(defaultParams);
          setCpkParametersLoaded(true);
          
          // ✅ Save default parameters for this server
          localStorage.setItem(serverSpecificKey, JSON.stringify(defaultParams));
        }
      } catch (error) {
        console.error('❌ Error loading CPK parameters:', error);
        // ✅ FALLBACK: Create default parameters on error
        const defaultParams = createDefaultCpkParameters();
        setCpkParameters(defaultParams);
        setCpkParametersLoaded(true);
      }
    };

    loadCpkParameters();
  }, [selectedServer]); // ✅ IMPORTANT: Reload when server changes

  // ✅ NEW: Create default CPK parameters function
  const createDefaultCpkParameters = () => {
    const defaultParameterNames = [
      'PPMValue', 'SupOn', 'SupOff', 'BatOn',
      'Stage-1 TP 1', 'Stage-1 TP 2', 'Stage-1 TP 3', 'Stage-1 TP 4',
      'Stage-1 TP 5', 'Stage-1 TP 6', 'Stage-1 TP 7', 'Stage-1 TP 8',
      'Stage-1 TP 9', 'Stage-1 TP 10', 'Stage-1 TP 11', 'Stage-1 TP 12',
      'Stage-2 TP 1', 'Stage-2 TP 2', 'Stage-2 TP 3', 'Stage-2 TP 4',
      'Stage-2 TP 5', 'Stage-2 TP 6', 'Stage-2 TP 7', 'Stage-2 TP 8',
      'Stage-2 TP 9', 'Stage-2 TP 10',
      'Err_Ph LP 1', 'Err_Ph LP 2', 'Err_Ph LP 3', 'Err_Ph LP 4',
      'Err_Ph LP 5', 'Err_Ph LP 6', 'Err_Ph LP 7',
      'Err_Nu LP 1', 'Err_Nu LP 2', 'Err_Nu LP 3', 'Err_Nu LP 4',
      'Err_Nu LP 5', 'Err_Nu LP 6', 'Err_Nu LP 7'
    ];

    return defaultParameterNames.map(name => ({
      name: name,
      state: true // Default to enabled
    }));
  };

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

  // ✅ ENHANCED: GetCPKData function with better error handling and debugging
  const GetCPKData = async () => {
    try {
      if (!selectedServer || !formData.project) {
        console.error('❌ CPK Data - Missing required parameters:', { selectedServer, project: formData.project });
        setCpkData([]);
        setCpkList([]);
        return null;
      }

      // ✅ FIXED: For live projects, dates are optional
      if (formData.viewMode === 'projectwise' && (!formData.startDate || !formData.endDate)) {
        console.error('❌ CPK Data - Missing date parameters for project-wise mode');
        setCpkData([]);
        setCpkList([]);
        return null;
      }

      // ✅ ENHANCED: Wait for CPK parameters to be loaded
      if (!cpkParametersLoaded) {
        console.log('⏳ CPK Data - Waiting for CPK parameters to load...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }

      const cpkRequestData = createCPKData({
        serverId: selectedServer,
        projCode: formData.project,
        startDate: formData.startDate,  
        endDate: formData.endDate,
        lineNo: formData.lineNo,
        viewMode: formData.viewMode
      }, null, 1);

      console.log('🔍 CPK Request Debug:', { 
        selectedServer, 
        cpkRequestData, 
        serverIDInRequest: cpkRequestData.serverID,
        fullRequestData: cpkRequestData
      });

      console.log(`📊 CPK Data - Sending request for server ${selectedServer}:`, cpkRequestData);
      const data = await apiService.getCPKData(cpkRequestData);
      console.log(`📊 CPK Data - Response for server ${selectedServer}:`, data);

      if (data && Array.isArray(data) && data.length > 0) {
        setCpkData(data);
        
        // ✅ ENHANCED: Create CPK list with better parameter matching
        const cpkListData = data.map((item, index) => {
          const parameterName = item.ParameterName || item.parameterName || item.parameter_name;
          const paramConfig = cpkParameters.find(p => 
            p.name === parameterName || 
            p.name.toLowerCase() === parameterName?.toLowerCase()
          );
          
          console.log(`🔍 CPK Parameter matching - Item: ${parameterName}, Config found: ${!!paramConfig}`);
          
          return { 
            state: paramConfig ? paramConfig.state : true, // Default to enabled if not found
            parameterName: parameterName
          };
        });
        
        setCpkList(cpkListData);
        console.log(`✅ CPK Data loaded for server ${selectedServer}:`, {
          dataCount: data.length,
          parametersCount: cpkParameters.length,
          listCount: cpkListData.length
        });
      } else {
        console.log(`⚠️ No CPK data found for server ${selectedServer} with current selection`);
        setCpkData([]);
        setCpkList([]);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error loading CPK data for server ${selectedServer}:`, error);
      setCpkData([]);
      setCpkList([]);
      return null;
    }
  };

  // ✅ ENHANCED: GetFPYDatas function with server-specific debugging
  const GetFPYDatas = async (option = 3) => {
    try {
      if (!selectedServer || !formData.project) {
        console.error('❌ FPY Data - Missing required parameters:', { selectedServer, project: formData.project });
        setFpyData([]);
        return null;
      }

      // ✅ FIXED: For live projects, dates are optional
      if (formData.viewMode === 'projectwise' && (!formData.startDate || !formData.endDate)) {
        console.error('❌ FPY Data - Missing date parameters for project-wise mode');
        setFpyData([]);
        return null;
      }

      const projectData = {
        serverID: selectedServer,
        projCode: formData.project,
        stage: 1,
        startDate: formData.startDate,
        endDate: formData.endDate,
        Option: 3
      };

      console.log(`📈 FPY Data - Sending request for server ${selectedServer}:`, projectData);
      const data = await apiService.getFPYData(projectData);
      console.log(`📈 FPY Data - Response for server ${selectedServer}:`, data);

      if (data && Array.isArray(data) && data.length > 0) {
        setFpyData(data);
        console.log(`✅ FPY Data loaded for server ${selectedServer}:`, data.length, 'records');
      } else {
        console.log(`⚠️ No FPY data found for server ${selectedServer}`);
        setFpyData([]);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error loading FPY data for server ${selectedServer}:`, error);
      setFpyData([]);
      return null;
    }
  };

  // ✅ FIXED: Project loading effect with corrected date requirements
  useEffect(() => {
    let isCancelled = false;

    const loadProjects = async () => {
      if (formData.viewMode === 'linewise' || formData.viewMode === 'projectwise') {
        // ✅ FIXED: Only require dates for project-wise mode
        if (formData.viewMode === 'projectwise') {
          if (!formData.startDate || !formData.endDate) {
            setProjects([]);
            setSelectedProject('');
            setProjectsError('Please select start and end dates first');
            setProjectsLoading(false);
            return;
          }
        }

        setProjectsLoading(true);
        setProjectsError('');

        try {
          let projectData;
          
          console.log(`🔄 Loading projects for server ${selectedServer} in ${formData.viewMode} mode`);
          
          if (formData.viewMode === 'linewise') {
            // ✅ FIXED: Live projects don't require date validation
            projectData = await apiService.getLiveProjectList(selectedServer);
          } else {
            const dateValidation = validateDateRange(formData.startDate, formData.endDate);
            if (!dateValidation.isValid) {
              if (!isCancelled) {
                alert(`Invalid date range: ${dateValidation.message}`);
                setProjects([]);
                setProjectsError('');
                setProjectsLoading(false);
              }
              return;
            }
            
            projectData = await apiService.getProjectListDateRangeWise(
              selectedServer,
              formData.startDate,
              formData.endDate
            );
          }

          if (!isCancelled) {
            setProjects(Array.isArray(projectData) ? projectData : []);
            console.log(`✅ Projects loaded for server ${selectedServer}:`, projectData?.length || 0);
            
            if (formData.viewMode === 'linewise') {
              setProjectsError(
                projectData?.length === 0 ? 'No live projects currently running' : ''
              );
            } else {
              setProjectsError(
                projectData?.length === 0 ? 'No projects found in the selected date range' : ''
              );
            }
          }
        } catch (error) {
          if (!isCancelled) {
            console.error(`❌ Project load failed for server ${selectedServer}:`, error);
            setProjects([]);
            setProjectsError('Failed to load projects');
          }
        } finally {
          if (!isCancelled) setProjectsLoading(false);
        }
      } else {
        setProjects([]);
        setSelectedProject('');
        setProjectsError('');
        setProjectsLoading(false);
      }
    };

    const timeout = setTimeout(loadProjects, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [selectedServer, formData.viewMode, formData.startDate, formData.endDate]);

  // ✅ FIXED: Form validation with corrected date requirements
  const validateFormEnhanced = () => {
    console.log(`🔍 Validating form for server ${selectedServer}:`, {
      viewMode: formData.viewMode,
      project: formData.project,
      startDate: formData.startDate,
      endDate: formData.endDate,
      cpkParametersLoaded: cpkParametersLoaded,
      cpkParametersCount: cpkParameters.length
    });

    // Check if view mode is selected
    if (!formData.viewMode) {
      alert('❌ Missing View Mode\n\nPlease select a View Mode (Live Projects or Project Wise)');
      return false;
    }

    // Check monitoring server
    if (!formData.monitoringServer) {
      alert('❌ Missing Server\n\nPlease select a Monitoring Server');
      return false;
    }

    // ✅ FIXED: Only require dates for project-wise mode
    if (formData.viewMode === 'projectwise') {
      if (!formData.startDate || !formData.endDate) {
        alert('❌ Missing Required Dates\n\nStart Date and End Date are mandatory for Project Wise view.\n\nPlease select both dates to proceed.');
        return false;
      }

      // Validate date range for project-wise mode
      const dateValidation = validateDateRange(formData.startDate, formData.endDate);
      if (!dateValidation.isValid) {
        alert(`❌ Date Range Error\n\n${dateValidation.message}`);
        return false;
      }
    }
      if (formData.viewMode === 'linewise') {
        if (formData.project && (!formData.startDate || !formData.endDate)) {
        alert('⚠️ Missing Dates\n\nYou have selected a project under Live Projects but did not select Start and End Dates.\n\nPlease select both dates to proceed.');
        return false;
      }
    }

    // Check if project is selected
    if (!formData.project) {
      const modeText = formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise';
      alert(`❌ Missing Project\n\nPlease select a Project for ${modeText} view.`);
      return false;
    }

    // ✅ NEW: Check if CPK parameters are loaded
    if (!cpkParametersLoaded) {
      console.warn(`⚠️ CPK parameters not loaded for server ${selectedServer}`);
      // Don't block the search, but log the warning
    }

    return true;
  };

  // ✅ ENHANCED: handleFind function with server-specific debugging
  const handleFind = async () => {
    console.log(`🔍 Search initiated for server ${selectedServer}:`, {
      formData,
      cpkParametersLoaded,
      cpkParametersCount: cpkParameters.length
    });
    
    if (!validateFormEnhanced()) {
      return;
    }
    
    setIsLoading(true);
    setShowResults(true);
    setShowCharts(false);
    setNoDataMessage('');
    
    // Auto-scroll to results
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
    
    try {
      console.log(`🔄 Loading data for server ${selectedServer} in ${formData.viewMode} mode`);
      
      // Load data from API
      const fpyResult = await GetFPYDatas(1);
      const cpkResult = await GetCPKData();
      
      // Check if any data was found
      const hasFpyData = fpyResult && fpyResult.length > 0;
      const hasCpkData = cpkResult && cpkResult.length > 0;

      console.log(`📊 Data summary for server ${selectedServer}:`, {
        FPY: hasFpyData ? fpyResult.length : 0,
        CPK: hasCpkData ? cpkResult.length : 0,
        CPKParametersLoaded: cpkParametersLoaded
      });
      
      if (hasFpyData || hasCpkData) {
        setShowCharts(true);
        setNoDataMessage('');
        console.log(`✅ Charts will be displayed for server ${selectedServer}`);
      } else {
        setShowCharts(false);
        const modeText = formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise';
        setNoDataMessage(`No data found for selected criteria in ${modeText} mode for server ${selectedServer}`);
        console.log(`❌ No data found for server ${selectedServer}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching data for server ${selectedServer}:`, error);
      setShowCharts(false);
      setNoDataMessage('Error occurred while fetching data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'startDate' || name === 'endDate') {
      const newFormData = { ...formData, [name]: value };
      
      // ✅ FIXED: Only validate dates for project-wise mode
      if (formData.viewMode === 'projectwise') {
        if (name === 'startDate' && newFormData.endDate) {
          const validation = validateDateRange(value, newFormData.endDate);
          if (!validation.isValid) {
            alert(`❌ Date Selection Error\n\n${validation.message}`);
            return;
          }
        } else if (name === 'endDate' && newFormData.startDate) {
          const validation = validateDateRange(newFormData.startDate, value);
          if (!validation.isValid) {
            alert(`❌ Date Selection Error\n\n${validation.message}`);
            return;
          }
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'lineNo') {
      setSelectedProject('');
      setFormData(prev => ({
        ...prev,
        [name]: value,
        project: ''
      }));
    }
  };

  const handleProjectChange = (e) => {
    const value = e.target.value;
    setSelectedProject(value);
    setFormData(prev => ({
      ...prev,
      project: value
    }));
  };

  // ✅ FIXED: View mode toggle with corrected date requirements
  const handleViewModeToggle = (mode) => {
    console.log('🔄 Switching to mode:', mode);
    
    // ✅ FIXED: Only require dates for project-wise mode
    if (mode === 'projectwise' && (!formData.startDate || !formData.endDate)) {
      alert('❌ Date Selection Required\n\nProject Wise mode requires start and end dates.');
      return;
    }
    
    // ✅ REMOVED: Date requirement for live projects mode
    
    const newFormData = {
      ...formData,
      viewMode: mode,
      lineNo: '',
      project: '',
      startDate: formData.startDate,
      endDate: formData.endDate
    };

    setFormData(newFormData);
    setSelectedProject('');
    setProjects([]);
    setProjectsError('');
  };

  // ✅ UPDATED: Date inputs with dynamic requirements
  const renderDateInputs = () => {
    const isProjectWise = formData.viewMode === 'projectwise';
    const isRequired = isProjectWise;
    
    return (
      <>
        <div className="form-group">
          <label>
            Start Date {isRequired && <span style={{color: 'red'}}>*</span>}
            {formData.viewMode === 'linewise' && (
              <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                {' '}(Optional for Live Projects)
              </span>
            )}
          </label>
          <input 
            type="date" 
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className="date-input"
            max={new Date().toISOString().split('T')[0]}
            required={isRequired}
          />
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
            📅 {isProjectWise ? 'Max 65 days range allowed' : 'Optional for Live Projects'}
          </div>
        </div>

        <div className="form-group">
          <label>
            End Date {isRequired && <span style={{color: 'red'}}>*</span>}
            {formData.viewMode === 'linewise' && (
              <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                {' '}(Optional for Live Projects)
              </span>
            )}
          </label>
          <input 
            type="date" 
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            className="date-input"
            max={new Date().toISOString().split('T')[0]}
            min={formData.startDate}
            required={isRequired}
          />
          {formData.startDate && formData.endDate && (() => {
            const validation = validateDateRange(formData.startDate, formData.endDate);
            if (validation.isValid && validation.daysDifference) {
              return (
                <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
                  ✅ {validation.daysDifference} days selected
                </div>
              );
            }
            return null;
          })()}
        </div>
      </>
    );
  };

  const handleReset = () => {
    const savedServerId = localStorage.getItem('server');
    let serverName = 'RCP JAIPUR';
    let serverId = 2;
    
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
      lineNo: '',
      project: '',
      startDate: '',
      endDate: '',
      viewMode: ''
    });
    
    setShowResults(false);
    setShowCharts(false);
    setFpyData(null);
    setCpkData(null);
    setCpkList([]);
    setNoDataMessage('');
    setIsLoading(false);
    setProjects([]);
    setProjectsError('');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="search-form">
          <h2 className="form-title">
            JHALAK APPLICATION
            {/* ✅ NEW: Show current server info */}
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginTop: '4px' }}>
              Server: {formData.monitoringServer}
            </div>
          </h2>
          
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
            {renderDateInputs()}
          </div>

          <div className="form-row second-row">
            <div className="form-group">
              <label>View Mode <span style={{color: 'red'}}>*</span></label>
              <div className="toggle-switch">
                <button 
                  type="button"
                  className={`toggle-option ${formData.viewMode === 'linewise' ? 'active' : ''}`}
                  onClick={() => handleViewModeToggle('linewise')}
                >
                  Live Projects
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

            {formData.viewMode && (
              <div className="form-group">
                <label>
                  Select Project <span style={{color: 'red'}}>*</span>
                  {formData.viewMode === 'linewise' && (
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                      {' '}(Live Projects)
                    </span>
                  )}
                  {formData.viewMode === 'projectwise' && (
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                      {' '}(Date Range Based)
                    </span>
                  )}
                </label>
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
                     projectsError ? (formData.viewMode === 'projectwise' ? 'Select dates first' : 'Loading...') : 
                     formData.viewMode === 'linewise' ? 'Select Live Project' : 'Select Project'}
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
                
                {projectsLoading && (
                  <div style={{ fontSize: '12px', color: '#007bff', marginTop: '4px' }}>
                    ⏳ Loading project list...
                  </div>
                )}
                
                {projectsError && !projectsLoading && (
                  <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
                    ⚠️ {projectsError}
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
                  Mode: <strong>
                    {formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise'}
                  </strong>
                </span>
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
                    Please wait while we fetch the results for {formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise'} mode
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
                      projCode={formData.project}
                      cpkParameters={cpkParameters}
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


//----------------------------------------------------------------------------
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './Dashboard.css';
// import FPYChart from '../charts/FPYChart';
// import CPKChart from '../charts/CPKChart';

// // ✅ UPDATED: Import the correct API functions
// import { apiService, createCPKData, createProjectData, validateDateRange } from '../services/apiService';

// const Dashboard = () => {
//   const [formData, setFormData] = useState({
//     monitoringServer: 'RCP JAIPUR',
//     lineNo: '',
//     project: '',
//     startDate: '',
//     endDate: '',
//     viewMode: '' // No default selection - user must choose
//   });

//   const [showResults, setShowResults] = useState(false); // Controls entire results area visibility
//   const [showCharts, setShowCharts] = useState(false);
//   const [fpyData, setFpyData] = useState(null);
//   const [cpkData, setCpkData] = useState(null);
//   const [cpkList, setCpkList] = useState([]);
//   const [noDataMessage, setNoDataMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   // Add state for project selection
//   const [selectedServer, setSelectedServer] = useState(2); // Default RCP
//   const [projects, setProjects] = useState([]);
//   const [selectedProject, setSelectedProject] = useState('');
//   const [projectsLoading, setProjectsLoading] = useState(false);
//   const [projectsError, setProjectsError] = useState('');
  
//   // ✅ CPK parameters state
//   const [cpkParameters, setCpkParameters] = useState([]);
  
//   // Ref for auto-scrolling to results
//   const resultsRef = useRef(null);

//   // Server info mapping with actual server IPs
//   const ServerInfo = [
//     { id: 1, name: 'Genus RND - 192.10.10.4', serverIP: '192.10.10.4' },
//     { id: 2, name: 'RCP Jaipur - 10.141.61.40', serverIP: '10.141.61.40' },
//     { id: 3, name: 'HDR 1101 - 10.133.100.21', serverIP: '10.133.100.21' },
//     { id: 4, name: 'HDR 1100 - 10.134.1.21', serverIP: '10.134.1.21' },
//     { id: 5, name: 'HDR 1201 - 10.133.1.22', serverIP: '10.133.1.22' },
//     { id: 6, name: 'Guhawati - 10.161.1.22', serverIP: '10.161.1.22' },
//   ];

//   // ✅ Load CPK parameters from localStorage on mount
//   useEffect(() => {
//     const savedCpkParams = localStorage.getItem('LocalData');
//     if (savedCpkParams) {
//       try {
//         const parsedParams = JSON.parse(savedCpkParams);
//         setCpkParameters(parsedParams);
//         console.log('CPK Parameters loaded from localStorage:', parsedParams);
//       } catch (error) {
//         console.error('Error parsing CPK parameters from localStorage:', error);
//       }
//     }
//   }, []);

//   // Load server configuration from localStorage on component mount
//   useEffect(() => {
//     const savedServerId = localStorage.getItem('server');
//     if (savedServerId) {
//       const serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         setSelectedServer(serverId);
//         setFormData(prev => ({
//           ...prev,
//           monitoringServer: serverInfo.name
//         }));
//       }
//     }
//   }, []);

//   // ✅ FIXED: Project loading for both linewise (live projects) and projectwise modes
//   const previousViewMode = useRef(formData.viewMode);
//   const hasShownAlert = useRef(false);

//   // ✅ FIXED: Project loading effect with proper API calls
//   useEffect(() => {
//     let isCancelled = false;

//     const loadProjects = async () => {
//       if (formData.viewMode === 'linewise' || formData.viewMode === 'projectwise') {
//         // ✅ For projectwise mode, check if dates are required
//         if (formData.viewMode === 'projectwise') {
//           if (!formData.startDate || !formData.endDate) {
//             setProjects([]);
//             setSelectedProject('');
//             setProjectsError('Please select start and end dates first');
//             setProjectsLoading(false);
//             return;
//           }
//         }

//         setProjectsLoading(true);
//         setProjectsError('');

//         try {
//           let projectData;
          
//           if (formData.viewMode === 'linewise') {
//             // ✅ For live projects, use the actual LIVE projects API
//             console.log('🔄 Loading LIVE projects from actual live API');
//             projectData = await apiService.getLiveProjectList(selectedServer);
            
//           } else {
//             // For projectwise, validate date range first
//             const dateValidation = validateDateRange(formData.startDate, formData.endDate);
//             if (!dateValidation.isValid) {
//               if (!isCancelled) {
//                 alert(`Invalid date range: ${dateValidation.message}`);
//                 setProjects([]);
//                 setProjectsError('');
//                 setProjectsLoading(false);
//               }
//               return;
//             }
            
//             // Use the date range API for project wise
//             projectData = await apiService.getProjectListDateRangeWise(
//               selectedServer,
//               formData.startDate,
//               formData.endDate
//             );
//           }

//           if (!isCancelled) {
//             setProjects(Array.isArray(projectData) ? projectData : []);
            
//             if (formData.viewMode === 'linewise') {
//               setProjectsError(
//                 projectData?.length === 0 ? 'No live projects currently running' : ''
//               );
//             } else {
//               setProjectsError(
//                 projectData?.length === 0 ? 'No projects found in the selected date range' : ''
//               );
//             }
//           }
//         } catch (error) {
//           if (!isCancelled) {
//             console.error('Project load failed:', error);
//             setProjects([]);
//             setProjectsError('Failed to load projects');
//           }
//         } finally {
//           if (!isCancelled) setProjectsLoading(false);
//         }
//       } else {
//         setProjects([]);
//         setSelectedProject('');
//         setProjectsError('');
//         setProjectsLoading(false);
//       }
//     };

//     const timeout = setTimeout(loadProjects, 300);

//     return () => {
//       isCancelled = true;
//       clearTimeout(timeout);
//     };
//   }, [selectedServer, formData.viewMode, formData.startDate, formData.endDate]);

//   // ✅ FIXED: GetFPYDatas function with proper date handling
//   const GetFPYDatas = async (option = 3) => {
//     try {
//       if (!selectedServer || !formData.project) {
//         console.error('Missing required parameters for FPY data');
//         setFpyData([]);
//         return null;
//       }

//       // ✅ FIXED: Use the actual form dates for both modes
//       if (!formData.startDate || !formData.endDate) {
//         console.error('Missing date parameters for FPY data');
//         setFpyData([]);
//         return null;
//       }

//       const projectData = {
//         serverID: selectedServer,
//         projCode: formData.project,
//         stage: 1,
//         startDate: formData.startDate,
//         endDate: formData.endDate,
//         Option: 3
//       };

//       console.log('Dashboard - Sending FPY request:', projectData);
//       const data = await apiService.getFPYData(projectData);
//       console.log('Dashboard - FPY API Response:', data);

//       if (data && Array.isArray(data) && data.length > 0) {
//         setFpyData(data);
//         console.log('FPY Data loaded successfully:', data.length, 'records');
//       } else {
//         console.log('No FPY data found for current selection');
//         setFpyData([]);
//       }

//       return data;
//     } catch (error) {
//       console.error('Error loading FPY data:', error);
//       setFpyData([]);
//       return null;
//     }
//   };

//   // ✅ FIXED: GetCPKData function with proper date handling
//   const GetCPKData = async () => {
//     try {
//       if (!selectedServer || !formData.project) {
//         console.error('Missing required parameters for CPK data');
//         setCpkData([]);
//         setCpkList([]);
//         return null;
//       }

//       // ✅ FIXED: Use the actual form dates for both modes
//       if (!formData.startDate || !formData.endDate) {
//         console.error('Missing date parameters for CPK data');
//         setCpkData([]);
//         setCpkList([]);
//         return null;
//       }

//       const cpkRequestData = createCPKData({
//         serverId: selectedServer,
//         projCode: formData.project,
//         startDate: formData.startDate,
//         endDate: formData.endDate,
//         lineNo: formData.lineNo,
//         viewMode: formData.viewMode
//       }, null, 1);

//       console.log('Dashboard - Sending CPK request:', cpkRequestData);
//       const data = await apiService.getCPKData(cpkRequestData);
//       console.log('Dashboard - CPK API Response:', data);

//       if (data && Array.isArray(data) && data.length > 0) {
//         setCpkData(data);
        
//         const cpkListData = data.map((item, index) => {
//           const paramConfig = cpkParameters.find(p => 
//             p.name === item.ParameterName || 
//             p.name === item.parameterName
//           );
//           return { 
//             state: paramConfig ? paramConfig.state : true
//           };
//         });
        
//         setCpkList(cpkListData);
//         console.log('CPK Data loaded:', data);
//         console.log('CPK List created:', cpkListData);
//       } else {
//         console.log('No CPK data found for current selection');
//         setCpkData([]);
//         setCpkList([]);
//       }

//       return data;
//     } catch (error) {
//       console.error('Error loading CPK data:', error);
//       setCpkData([]);
//       setCpkList([]);
//       return null;
//     }
//   };

//   // ✅ FIXED: Enhanced input change handler with proper validation
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
    
//     // ✅ Enhanced date validation for both modes
//     if (name === 'startDate' || name === 'endDate') {
//       const newFormData = { ...formData, [name]: value };
      
//       // Only validate if both dates are selected
//       if (name === 'startDate' && newFormData.endDate) {
//         const validation = validateDateRange(value, newFormData.endDate);
//         if (!validation.isValid) {
//           alert(`❌ Date Selection Error\n\n${validation.message}`);
//           return;
//         } else if (validation.daysDifference) {
//           console.log(`✅ Valid date range selected: ${validation.daysDifference} days`);
//         }
//       } else if (name === 'endDate' && newFormData.startDate) {
//         const validation = validateDateRange(newFormData.startDate, value);
//         if (!validation.isValid) {
//           alert(`❌ Date Selection Error\n\n${validation.message}`);
//           return;
//         } else if (validation.daysDifference) {
//           console.log(`✅ Valid date range selected: ${validation.daysDifference} days`);
//         }
//       }
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     // Reset project selection when line changes
//     if (name === 'lineNo') {
//       setSelectedProject('');
//       setFormData(prev => ({
//         ...prev,
//         [name]: value,
//         project: ''
//       }));
//     }
//   };

//   const handleProjectChange = (e) => {
//     const value = e.target.value;
//     setSelectedProject(value);
//     setFormData(prev => ({
//       ...prev,
//       project: value
//     }));
//   };

//   // ✅ FIXED: Modified handleViewModeToggle function - preserve dates and add validation
//   const handleViewModeToggle = (mode) => {
//     console.log('🔄 Switching to mode:', mode);
    
//     // ✅ NEW: Check if dates are required for the mode being switched to
//     if (mode === 'projectwise' && (!formData.startDate || !formData.endDate)) {
//       alert('❌ Date Selection Required\n\nProject Wise mode requires start and end dates to be selected.\n\nPlease select both dates before switching to Project Wise mode.');
//       return;
//     }
    
//     // ✅ NEW: Check if dates are required for Live Projects mode
//     if (mode === 'linewise' && (!formData.startDate || !formData.endDate)) {
//       alert('❌ Date Selection Required\n\nLive Projects mode requires start and end dates to be selected.\n\nPlease select both dates before switching to Live Projects mode.');
//       return;
//     }
    
//     // ✅ FIXED: Preserve existing dates when switching modes
//     const newFormData = {
//       ...formData,
//       viewMode: mode,
//       // Reset only project-related fields, preserve dates
//       lineNo: '',
//       project: '',
//       // ✅ PRESERVE: Keep existing dates
//       startDate: formData.startDate,
//       endDate: formData.endDate
//     };

//     setFormData(newFormData);
    
//     // Reset selected project
//     setSelectedProject('');
    
//     // Clear projects list temporarily (will be reloaded by useEffect)
//     setProjects([]);
//     setProjectsError('');
    
//     // Reset alert flag
//     hasShownAlert.current = false;
    
//     console.log('✅ Mode switched to:', mode, 'with preserved dates:', {
//       startDate: newFormData.startDate,
//       endDate: newFormData.endDate
//     });
//   };

//   // ✅ UPDATED: Enhanced date input rendering - same for both modes
//   const renderDateInputs = () => {
//     return (
//       <>
//         {/* Start Date Input */}
//         <div className="form-group">
//           <label>
//             Start Date <span style={{color: 'red'}}>*</span>
//           </label>
//           <input 
//             type="date" 
//             name="startDate"
//             value={formData.startDate}
//             onChange={handleInputChange}
//             className="date-input"
//             max={new Date().toISOString().split('T')[0]}
//             required
//           />
//           <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
//             📅 Max 65 days range allowed
//           </div>
//         </div>

//         {/* End Date Input */}
//         <div className="form-group">
//           <label>
//             End Date <span style={{color: 'red'}}>*</span>
//           </label>
//           <input 
//             type="date" 
//             name="endDate"
//             value={formData.endDate}
//             onChange={handleInputChange}
//             className="date-input"
//             max={new Date().toISOString().split('T')[0]}
//             min={formData.startDate}
//             required
//           />
//           {/* Show date range info */}
//           {formData.startDate && formData.endDate && (() => {
//             const validation = validateDateRange(formData.startDate, formData.endDate);
//             if (validation.isValid && validation.daysDifference) {
//               return (
//                 <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
//                   ✅ {validation.daysDifference} days selected
//                 </div>
//               );
//             }
//             return null;
//           })()}
//         </div>
//       </>
//     );
//   };

//   // ✅ ENHANCED: Comprehensive form validation
//   const validateFormEnhanced = () => {
//     // Check if view mode is selected
//     if (!formData.viewMode) {
//       alert('❌ Missing View Mode\n\nPlease select a View Mode (Live Projects or Project Wise)');
//       return false;
//     }

//     // Check monitoring server
//     if (!formData.monitoringServer) {
//       alert('❌ Missing Server\n\nPlease select a Monitoring Server');
//       return false;
//     }

//     // ✅ ENHANCED: Check dates for both modes
//     if (!formData.startDate || !formData.endDate) {
//       const modeText = formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise';
//       alert(`❌ Missing Required Dates\n\nStart Date and End Date are mandatory for ${modeText} view.\n\nPlease select both dates to proceed.`);
//       return false;
//     }

//     // ✅ ENHANCED: Validate date range with 65-day limit for both modes
//     const dateValidation = validateDateRange(formData.startDate, formData.endDate);
//     if (!dateValidation.isValid) {
//       alert(`❌ Date Range Error\n\n${dateValidation.message}`);
//       return false;
//     }

//     // ✅ ENHANCED: Check if project is selected
//     if (!formData.project) {
//       const modeText = formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise';
//       alert(`❌ Missing Project\n\nPlease select a Project for ${modeText} view.\n\nNote: Projects are loaded based on your date selection.`);
//       return false;
//     }

//     // ✅ ENHANCED: Additional validation for Live Projects mode
//     if (formData.viewMode === 'linewise') {
//       // Check if projects list is loaded
//       if (projects.length === 0) {
//         alert('❌ No Live Projects Available\n\nNo live projects are currently running on the selected server.\n\nPlease check with your administrator or try a different server.');
//         return false;
//       }

//       // Validate that selected project exists in live projects
//       const projectExists = projects.some(p => 
//         (p.projCode || p.ProjCode) === formData.project
//       );
      
//       if (!projectExists) {
//         alert('❌ Invalid Project Selection\n\nThe selected project is not available in the current live projects list.\n\nPlease select a valid live project.');
//         return false;
//       }
//     }

//     // ✅ ENHANCED: Additional validation for Project Wise mode
//     if (formData.viewMode === 'projectwise') {
//       // Check if projects list is loaded for the date range
//       if (projects.length === 0) {
//         alert('❌ No Projects Found\n\nNo projects were found in the selected date range.\n\nPlease try:\n• Different date range\n• Different server\n• Verify project availability');
//         return false;
//       }

//       // Validate that selected project exists in date range projects
//       const projectExists = projects.some(p => 
//         (p.projCode || p.ProjCode) === formData.project
//       );
      
//       if (!projectExists) {
//         alert('❌ Invalid Project Selection\n\nThe selected project is not available in the current date range.\n\nPlease select a valid project from the dropdown.');
//         return false;
//       }
//     }

//     if (dateValidation.daysDifference) {
//       const modeText = formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise';
//       console.log(`✅ ${modeText} mode validation passed. Date range: ${dateValidation.daysDifference} days`);
//     }

//     return true;
//   };

//   // ✅ UPDATED: Enhanced handleFind function with comprehensive validation
//   const handleFind = async () => {
//     console.log('🔍 Search initiated with:', formData);
//     console.log('Selected Server:', selectedServer);
//     console.log('CPK Parameters:', cpkParameters);
    
//     // ✅ Enhanced validation
//     if (!validateFormEnhanced()) {
//       return;
//     }
    
//     // Show loading state and results area
//     setIsLoading(true);
//     setShowResults(true);
//     setShowCharts(false);
//     setNoDataMessage('');
    
//     // ✅ Auto-scroll to results
//     setTimeout(() => {
//       if (resultsRef.current) {
//         resultsRef.current.scrollIntoView({
//           behavior: 'smooth',
//           block: 'start'
//         });
//       }
//     }, 100);
    
//     try {
//       console.log('🔄 Loading data for mode:', formData.viewMode);
//       console.log('🔄 Date range:', formData.startDate, 'to', formData.endDate);
      
//       // Load data from API
//       const fpyResult = await GetFPYDatas(1);
//       const cpkResult = await GetCPKData();
      
//       // Check if any data was found
//       const hasFpyData = fpyResult && fpyResult.length > 0;
//       const hasCpkData = cpkResult && cpkResult.length > 0;

//       console.log('📊 FPY Data available:', hasFpyData);
//       console.log('📊 CPK Data available:', hasCpkData);
      
//       if (hasFpyData || hasCpkData) {
//         setShowCharts(true);
//         setNoDataMessage('');
//         console.log('✅ Charts will be displayed');
//       } else {
//         setShowCharts(false);
//         const modeText = formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise';
//         setNoDataMessage(`No data found for selected criteria in ${modeText} mode`);
//         console.log('❌ No data found - charts will not be displayed');
//       }
//     } catch (error) {
//       console.error('❌ Error fetching data:', error);
//       setShowCharts(false);
//       setNoDataMessage('Error occurred while fetching data. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ✅ UPDATED: Enhanced reset function
//   const handleReset = () => {
//     // Get current server from localStorage when resetting
//     const savedServerId = localStorage.getItem('server');
//     let serverName = 'RCP JAIPUR';
//     let serverId = 2;
    
//     if (savedServerId) {
//       serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         serverName = serverInfo.name;
//       }
//     }
    
//     setSelectedServer(serverId);
//     setSelectedProject('');
//     setFormData({
//       monitoringServer: serverName,
//       lineNo: '',
//       project: '',
//       startDate: '',
//       endDate: '',
//       viewMode: '' // No default selection
//     });
    
//     // Hide results area completely
//     setShowResults(false);
//     setShowCharts(false);
//     setFpyData(null);
//     setCpkData(null);
//     setCpkList([]);
//     setNoDataMessage('');
//     setIsLoading(false);
    
//     // Clear projects
//     setProjects([]);
//     setProjectsError('');
    
//     // Reset the alert flag
//     hasShownAlert.current = false;
//   };

//   return (
//     <div className="dashboard">
//       <div className="dashboard-content">
//         <div className="search-form">
//           <h2 className="form-title">JHALAK APPLICATION</h2>
          
//           {/* ✅ UPDATED: Enhanced form with consistent date inputs */}
//           <div className="form-row first-row">
//             <div className="form-group">
//               <label>Monitoring Server</label>
//               <input 
//                 type="text" 
//                 name="monitoringServer"
//                 value={formData.monitoringServer}
//                 onChange={handleInputChange}
//                 readOnly
//                 className="readonly-input"
//               />
//             </div>

//             {renderDateInputs()}
//           </div>

//           <div className="form-row second-row">
//             <div className="form-group">
//               <label>View Mode <span style={{color: 'red'}}>*</span></label>
//               <div className="toggle-switch">
//                 <button 
//                   type="button"
//                   className={`toggle-option ${formData.viewMode === 'linewise' ? 'active' : ''}`}
//                   onClick={() => handleViewModeToggle('linewise')}
//                 >
//                   Live Projects
//                 </button>
//                 <button 
//                   type="button"
//                   className={`toggle-option ${formData.viewMode === 'projectwise' ? 'active' : ''}`}
//                   onClick={() => handleViewModeToggle('projectwise')}
//                 >
//                   Project Wise
//                 </button>
//               </div>
//             </div>

//             {/* ✅ ENHANCED: Project selection with better validation feedback */}
//             {formData.viewMode && (
//               <div className="form-group">
//                 <label>
//                   Select Project <span style={{color: 'red'}}>*</span>
//                   {formData.viewMode === 'linewise' && (
//                     <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
//                       {' '}(Live Projects)
//                     </span>
//                   )}
//                   {formData.viewMode === 'projectwise' && (
//                     <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
//                       {' '}(Date Range Based)
//                     </span>
//                   )}
//                 </label>
//                 <select 
//                   name="project"
//                   value={selectedProject}
//                   onChange={handleProjectChange}
//                   className="select-input"
//                   required
//                   disabled={projectsLoading}
//                 >
//                   <option value="">
//                     {projectsLoading ? 'Loading projects...' : 
//                      projectsError ? 'Select dates first' : 
//                      formData.viewMode === 'linewise' ? 'Select Live Project' : 'Select Project'}
//                   </option>
//                   {projects.map(project => (
//                     <option 
//                       key={project.projId || project.ProjId} 
//                       value={project.projCode || project.ProjCode}
//                     >
//                       {project.projCode || project.ProjCode}
//                     </option>
//                   ))}
//                 </select>
                
//                 {/* ✅ ENHANCED: Project Loading/Error feedback */}
//                 {projectsLoading && (
//                   <div style={{ fontSize: '12px', color: '#007bff', marginTop: '4px' }}>
//                     ⏳ Loading project list...
//                   </div>
//                 )}
                
//                 {projectsError && !projectsLoading && (
//                   <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
//                     ⚠️ {projectsError}
//                   </div>
//                 )}
                
//                 {projects.length > 0 && !projectsLoading && !projectsError && (
//                   <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
//                     ✓ {projects.length} projects loaded
//                     {formData.viewMode === 'linewise' && (
//                       <span style={{ color: '#666' }}> (Live)</span>
//                     )}
//                     {formData.viewMode === 'projectwise' && (
//                       <span style={{ color: '#666' }}> (Date Range)</span>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           <div className="form-actions">
//             <button 
//               className={`find-btn ${isLoading ? 'loading' : ''}`}
//               onClick={handleFind}
//               disabled={isLoading}
//             >
//               <span className="btn-icon">
//                 {isLoading ? '⏳' : '🔍'}
//               </span>
//               {isLoading ? 'Searching...' : 'Find Data'}
//             </button>
//             <button className="reset-btn" onClick={handleReset} disabled={isLoading}>
//               <span className="btn-icon">🔄</span>
//               Reset
//             </button>
//           </div>
//         </div>

//         {/* Results Area - Only visible after clicking Find Data */}
//         {showResults && (
//           <div className="results-area" ref={resultsRef}>
//             <div className="results-header">
//               <h3>SMART METER PRODUCTION ANALYSIS</h3>
//               <div className="results-info">
//                 <span className="info-tag">
//                   Mode: <strong>
//                     {formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise'}
//                   </strong>
//                 </span>
//                 {formData.project && (
//                   <span className="info-tag">
//                     Project: <strong>{formData.project}</strong>
//                   </span>
//                 )}
//                 {formData.startDate && formData.endDate && (
//                   <span className="info-tag">
//                     Date: <strong>{formData.startDate}</strong> to <strong>{formData.endDate}</strong>
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Loading State */}
//             {isLoading && (
//               <div className="loading-message">
//                 <div className="loading-spinner"></div>
//                 <div className="loading-text">
//                   <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Searching for data...</div>
//                   <div style={{ fontSize: '14px', color: '#666' }}>
//                     Please wait while we fetch the results for {formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise'} mode
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* No Data Message */}
//             {!isLoading && noDataMessage && (
//               <div className="no-data-message">
//                 <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
//                 <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{noDataMessage}</div>
//                 <div style={{ fontSize: '14px', color: '#999' }}>
//                   Please try different selection criteria or date range
//                 </div>
//               </div>
//             )}

//             {/* Charts Container - Only show when showCharts is true and not loading */}
//             {!isLoading && showCharts && (
//               <div className="charts-container">
//                 {fpyData && fpyData.length > 0 && (
//                   <div className="chart-block">
//                   <FPYChart
//                     data={fpyData}
//                     serverID={selectedServer}
//                     projCode={formData.project}
//                     Option={formData.viewMode}
//                     startDate={formData.startDate}
//                     endDate={formData.endDate}
//                   />
//                   </div>
//                 )}

//                 {cpkData && cpkData.length > 0 && (
//                   <div className="chart-block">
//                     <CPKChart
//                       data={cpkData}
//                       cpkList={cpkList}
//                       serverId={selectedServer}
//                       startDate={formData.startDate}
//                       endDate={formData.endDate}
//                       projCode={formData.project}
//                       cpkParameters={cpkParameters}
//                     />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

//Auto date selection code
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './Dashboard.css';
// import FPYChart from '../charts/FPYChart';
// import CPKChart from '../charts/CPKChart';

// // ✅ UPDATED: Import the correct API functions
// import { apiService, createCPKData, createProjectData, validateDateRange } from '../services/apiService';

// // ✅ NEW: Helper function to get today's date
// const getTodayDate = () => {
//   return new Date().toISOString().split('T')[0];
// };

// const Dashboard = () => {
//   const [formData, setFormData] = useState({
//     monitoringServer: 'RCP JAIPUR',
//     lineNo: '',
//     project: '',
//     startDate: '',
//     endDate: '',
//     viewMode: '' // ✅ No default selection - user must choose
//   });

//   const [showResults, setShowResults] = useState(false); // Controls entire results area visibility
//   const [showCharts, setShowCharts] = useState(false);
//   const [fpyData, setFpyData] = useState(null);
//   const [cpkData, setCpkData] = useState(null);
//   const [cpkList, setCpkList] = useState([]);
//   const [noDataMessage, setNoDataMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   // Add state for project selection
//   const [selectedServer, setSelectedServer] = useState(2); // Default RCP
//   const [projects, setProjects] = useState([]);
//   const [selectedProject, setSelectedProject] = useState('');
//   const [projectsLoading, setProjectsLoading] = useState(false);
//   const [projectsError, setProjectsError] = useState('');
  
//   // ✅ NEW: Add CPK parameters state
//   const [cpkParameters, setCpkParameters] = useState([]);
  
//   // Ref for auto-scrolling to results
//   const resultsRef = useRef(null);

//   // Server info mapping with actual server IPs
//   const ServerInfo = [
//     { id: 1, name: 'Genus RND - 192.10.10.4', serverIP: '192.10.10.4' },
//     { id: 2, name: 'RCP Jaipur - 10.141.61.40', serverIP: '10.141.61.40' },
//     { id: 3, name: 'HDR 1101 - 10.133.100.21', serverIP: '10.133.100.21' },
//     { id: 4, name: 'HDR 1100 - 10.134.1.21', serverIP: '10.134.1.21' },
//     { id: 5, name: 'HDR 1201 - 10.133.1.22', serverIP: '10.133.1.22' },
//     { id: 6, name: 'Guhawati - 10.161.1.22', serverIP: '10.161.1.22' },
//   ];

//   // ✅ Load CPK parameters from localStorage on mount
//   useEffect(() => {
//     const savedCpkParams = localStorage.getItem('LocalData');
//     if (savedCpkParams) {
//       try {
//         const parsedParams = JSON.parse(savedCpkParams);
//         setCpkParameters(parsedParams);
//         console.log('CPK Parameters loaded from localStorage:', parsedParams);
//       } catch (error) {
//         console.error('Error parsing CPK parameters from localStorage:', error);
//       }
//     }
//   }, []);

//   // Load server configuration from localStorage on component mount
//   useEffect(() => {
//     const savedServerId = localStorage.getItem('server');
//     if (savedServerId) {
//       const serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         setSelectedServer(serverId);
//         setFormData(prev => ({
//           ...prev,
//           monitoringServer: serverInfo.name
//         }));
//       }
//     }
//   }, []);

//   // ✅ FIXED: Project loading for both linewise (live projects) and projectwise modes
//   const previousViewMode = useRef(formData.viewMode);
//   const hasShownAlert = useRef(false);

//   // 👇 Detect switching and show alert if needed
//   useEffect(() => {
//     const justSwitchedToMode = previousViewMode.current !== formData.viewMode && formData.viewMode !== '';

//     if (
//       justSwitchedToMode &&
//       formData.viewMode === 'projectwise' && // Only show alert for projectwise mode
//       (!formData.startDate || !formData.endDate) &&
//       !hasShownAlert.current
//     ) {
//       alert('Please select start and end dates first');
//       hasShownAlert.current = true;
//     }

//     previousViewMode.current = formData.viewMode;
//   }, [formData.viewMode, formData.startDate, formData.endDate]);

//   // ✅ FIXED: Project loading effect with proper API calls
//   useEffect(() => {
//     let isCancelled = false;

//     const loadProjects = async () => {
//       if (formData.viewMode === 'linewise' || formData.viewMode === 'projectwise') {
//         // For projectwise mode, check if dates are selected
//         if (formData.viewMode === 'projectwise') {
//           if (!formData.startDate || !formData.endDate) {
//             setProjects([]);
//             setSelectedProject('');
//             setProjectsError('');
//             setProjectsLoading(false);
//             return;
//           }
//         }

//         setProjectsLoading(true);
//         setProjectsError('');

//         try {
//           let projectData;
          
//           if (formData.viewMode === 'linewise') {
//             // ✅ FIX: For live projects, use the actual LIVE projects API
//             console.log('🔄 Loading LIVE projects from actual live API');
//             projectData = await apiService.getLiveProjectList(selectedServer);
            
//           } else {
//             // For projectwise, validate date range first
//             const dateValidation = validateDateRange(formData.startDate, formData.endDate);
//             if (!dateValidation.isValid) {
//               if (!isCancelled) {
//                 alert(`Invalid date range: ${dateValidation.message}`);
//                 setProjects([]);
//                 setProjectsError('');
//                 setProjectsLoading(false);
//               }
//               return;
//             }
            
//             // Use the date range API for project wise
//             projectData = await apiService.getProjectListDateRangeWise(
//               selectedServer,
//               formData.startDate,
//               formData.endDate
//             );
//           }

//           if (!isCancelled) {
//             setProjects(Array.isArray(projectData) ? projectData : []);
            
//             if (formData.viewMode === 'linewise') {
//               setProjectsError(
//                 projectData?.length === 0 ? 'No live projects currently running' : ''
//               );
//             } else {
//               setProjectsError(
//                 projectData?.length === 0 ? 'No projects found in the selected date range' : ''
//               );
//             }
//           }
//         } catch (error) {
//           if (!isCancelled) {
//             console.error('Project load failed:', error);
//             setProjects([]);
//             setProjectsError('Failed to load projects');
//           }
//         } finally {
//           if (!isCancelled) setProjectsLoading(false);
//         }
//       } else {
//         setProjects([]);
//         setSelectedProject('');
//         setProjectsError('');
//         setProjectsLoading(false);
//       }
//     };

//     const timeout = setTimeout(loadProjects, 300);

//     return () => {
//       isCancelled = true;
//       clearTimeout(timeout);
//     };
//   }, [selectedServer, formData.viewMode, formData.startDate, formData.endDate]);

//   // ✅ UPDATED: Enhanced date validation function with 60-day limit
//   const validateDates = (startDate, endDate) => {
//     // Use the new validateDateRange function from apiService
//     return validateDateRange(startDate, endDate);
//   };

//   // ✅ FIXED: GetFPYDatas function with proper date handling for live projects
//   const GetFPYDatas = async (option = 3) => {
//     try {
//       if (!selectedServer || !formData.project) {
//         console.error('Missing required parameters for FPY data');
//         setFpyData([]);
//         return null;
//       }

//       // ✅ FIX: For Live Projects, use today's date consistently
//       let finalStartDate = formData.startDate;
//       let finalEndDate = formData.endDate;
      
//       if (formData.viewMode === 'linewise') {
//         const today = getTodayDate();
//         finalStartDate = today;
//         finalEndDate = today;
//         console.log('🔄 Live Projects mode - Using today\'s date for FPY:', today);
//       }

//       if (!finalStartDate || !finalEndDate) {
//         console.error('Missing date parameters for FPY data');
//         setFpyData([]);
//         return null;
//       }

//       const projectData = {
//         serverID: selectedServer,
//         projCode: formData.project,
//         stage: 1,
//         startDate: finalStartDate,
//         endDate: finalEndDate,
//         Option: 3
//       };

//       console.log('Dashboard - Sending FPY request:', projectData);
//       const data = await apiService.getFPYData(projectData);
//       console.log('Dashboard - FPY API Response:', data);

//       if (data && Array.isArray(data) && data.length > 0) {
//         setFpyData(data);
//         console.log('FPY Data loaded successfully:', data.length, 'records');
//       } else {
//         console.log('No FPY data found for current selection');
//         setFpyData([]);
//       }

//       return data;
//     } catch (error) {
//       console.error('Error loading FPY data:', error);
//       setFpyData([]);
//       return null;
//     }
//   };

//   // ✅ FIXED: GetCPKData function with proper date handling for live projects
//   const GetCPKData = async () => {
//     try {
//       if (!selectedServer || !formData.project) {
//         console.error('Missing required parameters for CPK data');
//         setCpkData([]);
//         setCpkList([]);
//         return null;
//       }

//       // ✅ FIX: For Live Projects, use today's date consistently
//       let finalStartDate = formData.startDate;
//       let finalEndDate = formData.endDate;
      
//       if (formData.viewMode === 'linewise') {
//         const today = getTodayDate();
//         finalStartDate = today;
//         finalEndDate = today;
//         console.log('🔄 Live Projects mode - Using today\'s date for CPK:', today);
//       }

//       if (!finalStartDate || !finalEndDate) {
//         console.error('Missing date parameters for CPK data');
//         setCpkData([]);
//         setCpkList([]);
//         return null;
//       }

//       const cpkRequestData = createCPKData({
//         serverId: selectedServer,
//         projCode: formData.project,
//         startDate: finalStartDate,
//         endDate: finalEndDate,
//         lineNo: formData.lineNo,
//         viewMode: formData.viewMode
//       }, null, 1);

//       console.log('Dashboard - Sending CPK request:', cpkRequestData);
//       const data = await apiService.getCPKData(cpkRequestData);
//       console.log('Dashboard - CPK API Response:', data);

//       if (data && Array.isArray(data) && data.length > 0) {
//         setCpkData(data);
        
//         const cpkListData = data.map((item, index) => {
//           const paramConfig = cpkParameters.find(p => 
//             p.name === item.ParameterName || 
//             p.name === item.parameterName
//           );
//           return { 
//             state: paramConfig ? paramConfig.state : true
//           };
//         });
        
//         setCpkList(cpkListData);
//         console.log('CPK Data loaded:', data);
//         console.log('CPK List created:', cpkListData);
//       } else {
//         console.log('No CPK data found for current selection');
//         setCpkData([]);
//         setCpkList([]);
//       }

//       return data;
//     } catch (error) {
//       console.error('Error loading CPK data:', error);
//       setCpkData([]);
//       setCpkList([]);
//       return null;
//     }
//   };

//   // ✅ UPDATED: Enhanced input change handler with real-time 60-day validation
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
    
//     // ✅ ENHANCED: Real-time date validation with 60-day limit (only for projectwise mode)
//     if ((name === 'startDate' || name === 'endDate') && formData.viewMode === 'projectwise') {
//       const newFormData = { ...formData, [name]: value };
      
//       if (name === 'startDate' && newFormData.endDate) {
//         const validation = validateDateRange(value, newFormData.endDate);
//         if (!validation.isValid) {
//           alert(`❌ Date Selection Error\n\n${validation.message}`);
//           return;
//         } else if (validation.daysDifference) {
//           console.log(`✅ Valid date range selected: ${validation.daysDifference} days`);
//         }
//       } else if (name === 'endDate' && newFormData.startDate) {
//         const validation = validateDateRange(newFormData.startDate, value);
//         if (!validation.isValid) {
//           alert(`❌ Date Selection Error\n\n${validation.message}`);
//           return;
//         } else if (validation.daysDifference) {
//           console.log(`✅ Valid date range selected: ${validation.daysDifference} days`);
//         }
//       }
//     }
    
//     // ✅ FIX: Prevent manual date changes in Live Projects mode
//     if ((name === 'startDate' || name === 'endDate') && formData.viewMode === 'linewise') {
//       console.log('🚫 Date changes blocked in Live Projects mode');
//       return;
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     // ✅ Reset project selection when line changes (not needed for temp fix but keeping for future)
//     if (name === 'lineNo') {
//       setSelectedProject('');
//       setFormData(prev => ({
//         ...prev,
//         [name]: value,
//         project: ''
//       }));
//     }
//   };

//   const handleProjectChange = (e) => {
//     const value = e.target.value;
//     setSelectedProject(value);
//     setFormData(prev => ({
//       ...prev,
//       project: value
//     }));
//   };

//   // ✅ FIXED: Modified handleViewModeToggle function with proper date handling
//   const handleViewModeToggle = (mode) => {
//     console.log('🔄 Switching to mode:', mode);
    
//     const newFormData = {
//       ...formData,
//       viewMode: mode,
//       // Reset fields when switching modes
//       lineNo: '',
//       project: ''
//     };

//     // ✅ FIX: Handle dates properly based on mode
//     if (mode === 'linewise') {
//       // For Live Projects mode, auto-set to today's date
//       const today = getTodayDate();
//       newFormData.startDate = today;
//       newFormData.endDate = today;
//       console.log('📅 Live Projects mode - Auto-set dates to today:', today);
//     } else {
//       // ✅ FIX: For Project Wise mode, clear the auto-set dates
//       newFormData.startDate = '';
//       newFormData.endDate = '';
//       console.log('📅 Project Wise mode - Cleared auto-set dates');
//     }

//     setFormData(newFormData);
    
//     // Reset selected project
//     setSelectedProject('');
    
//     // Clear projects list
//     setProjects([]);
//     setProjectsError('');
    
//     // Reset alert flag
//     hasShownAlert.current = false;
//   };

//   // ✅ UPDATED: Enhanced date input rendering with conditional readonly for Live Projects
//   const renderDateInputs = () => {
//     const isLiveMode = formData.viewMode === 'linewise';
    
//     return (
//       <>
//         {/* Start Date Input */}
//         <div className="form-group">
//           <label>
//             Start Date <span style={{color: 'red'}}>*</span>
//             {isLiveMode && (
//               <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
//                 {' '}(Auto-set to today)
//               </span>
//             )}
//           </label>
//           <input 
//             type="date" 
//             name="startDate"
//             value={formData.startDate}
//             onChange={handleInputChange}
//             className={`date-input ${isLiveMode ? 'readonly-input' : ''}`}
//             max={new Date().toISOString().split('T')[0]}
//             required
//             readOnly={isLiveMode}
//             disabled={isLiveMode}
//             style={isLiveMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
//           />
//           {/* Date limit info */}
//           {!isLiveMode && (
//             <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
//               📅 Max 65 days range allowed
//             </div>
//           )}
//           {isLiveMode && (
//             <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
//               📅 Live mode: Today's date
//             </div>
//           )}
//         </div>

//         {/* End Date Input */}
//         <div className="form-group">
//           <label>
//             End Date <span style={{color: 'red'}}>*</span>
//             {isLiveMode && (
//               <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
//                 {' '}(Auto-set to today)
//               </span>
//             )}
//           </label>
//           <input 
//             type="date" 
//             name="endDate"
//             value={formData.endDate}
//             onChange={handleInputChange}
//             className={`date-input ${isLiveMode ? 'readonly-input' : ''}`}
//             max={new Date().toISOString().split('T')[0]}
//             min={formData.startDate}
//             required
//             readOnly={isLiveMode}
//             disabled={isLiveMode}
//             style={isLiveMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
//           />
//           {/* Show date range info for project mode */}
//           {!isLiveMode && formData.startDate && formData.endDate && (() => {
//             const validation = validateDateRange(formData.startDate, formData.endDate);
//             if (validation.isValid && validation.daysDifference) {
//               return (
//                 <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
//                   ✅ {validation.daysDifference} days selected
//                 </div>
//               );
//             }
//             return null;
//           })()}
//           {isLiveMode && (
//             <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
//               📅 Live mode: Today's date
//             </div>
//           )}
//         </div>
//       </>
//     );
//   };

//   // ✅ FIXED: Enhanced form validation for Live Projects mode
//   const validateFormEnhanced = () => {
//     // Check if view mode is selected
//     if (!formData.viewMode) {
//       alert('❌ Missing View Mode\n\nPlease select a View Mode (Live Projects or Project Wise)');
//       return false;
//     }

//     // Check monitoring server
//     if (!formData.monitoringServer) {
//       alert('❌ Missing Server\n\nPlease select a Monitoring Server');
//       return false;
//     }

//     // Check if project is selected
//     if (!formData.project) {
//       const modeText = formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise';
//       alert(`❌ Missing Project\n\nPlease select a Project for ${modeText} view`);
//       return false;
//     }

//     // ✅ FIX: Handle date validation based on mode
//     if (formData.viewMode === 'linewise') {
//       // For Live Projects mode, ensure dates are set to today
//       const today = getTodayDate();
//       if (!formData.startDate || !formData.endDate) {
//         // Auto-set dates if missing
//         setFormData(prev => ({
//           ...prev,
//           startDate: today,
//           endDate: today
//         }));
//       }
//       console.log('✅ Live Projects mode validation passed');
//     } else {
//       // For Project Wise mode, check if dates are selected
//       if (!formData.startDate || !formData.endDate) {
//         alert('❌ Missing Required Fields\n\nStart Date and End Date are mandatory for Project Wise view.');
//         return false;
//       }

//       // Validate date range with 60-day limit
//       const dateValidation = validateDateRange(formData.startDate, formData.endDate);
//       if (!dateValidation.isValid) {
//         alert(`❌ Date Range Error\n\n${dateValidation.message}`);
//         return false;
//       }

//       if (dateValidation.daysDifference) {
//         console.log(`✅ Project Wise mode validation passed. Date range: ${dateValidation.daysDifference} days`);
//       }
//     }

//     return true;
//   };

//   // ✅ UPDATED: Enhanced handleFind function with scroll behavior
//   const handleFind = async () => {
//     console.log('🔍 Search initiated with:', formData);
//     console.log('Selected Server:', selectedServer);
//     console.log('CPK Parameters:', cpkParameters);
    
//     // ✅ Enhanced validation
//     if (!validateFormEnhanced()) {
//       return;
//     }
    
//     // Show loading state and results area
//     setIsLoading(true);
//     setShowResults(true);
//     setShowCharts(false);
//     setNoDataMessage('');
    
//     // ✅ FIXED: Auto-scroll to results only when Find Data is clicked
//     setTimeout(() => {
//       if (resultsRef.current) {
//         resultsRef.current.scrollIntoView({
//           behavior: 'smooth',
//           block: 'start'
//         });
//       }
//     }, 100);
    
//     try {
//       // Load data from API
//       const fpyResult = await GetFPYDatas(1);
//       const cpkResult = await GetCPKData();
      
//       // Check if any data was found
//       const hasFpyData = fpyResult && fpyResult.length > 0;
//       const hasCpkData = cpkResult && cpkResult.length > 0;

//       console.log('📊 FPY Data available:', hasFpyData);
//       console.log('📊 CPK Data available:', hasCpkData);
      
//       if (hasFpyData || hasCpkData) {
//         setShowCharts(true);
//         setNoDataMessage('');
//         console.log('✅ Charts will be displayed');
//       } else {
//         setShowCharts(false);
//         setNoDataMessage('No data found for selected criteria');
//         console.log('❌ No data found - charts will not be displayed');
//       }
//     } catch (error) {
//       console.error('❌ Error fetching data:', error);
//       setShowCharts(false);
//       setNoDataMessage('Error occurred while fetching data. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ✅ UPDATED: Enhanced reset function to handle Live Projects mode
//   const handleReset = () => {
//     // Get current server from localStorage when resetting
//     const savedServerId = localStorage.getItem('server');
//     let serverName = 'RCP JAIPUR';
//     let serverId = 2;
    
//     if (savedServerId) {
//       serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         serverName = serverInfo.name;
//       }
//     }
    
//     setSelectedServer(serverId);
//     setSelectedProject('');
//     setFormData({
//       monitoringServer: serverName,
//       lineNo: '',
//       project: '',
//       startDate: '',
//       endDate: '',
//       viewMode: '' // No default selection
//     });
    
//     // Hide results area completely
//     setShowResults(false);
//     setShowCharts(false);
//     setFpyData(null);
//     setCpkData(null);
//     setCpkList([]);
//     setNoDataMessage('');
//     setIsLoading(false);
    
//     // Clear projects
//     setProjects([]);
//     setProjectsError('');
    
//     // Reset the alert flag
//     hasShownAlert.current = false;
//   };

//   return (
//     <div className="dashboard">
//       <div className="dashboard-content">
//         <div className="search-form">
//           <h2 className="form-title">JHALAK APPLICATION</h2>
          
//           {/* ✅ UPDATED: Replace the first-row div with enhanced date inputs */}
//           <div className="form-row first-row">
//             <div className="form-group">
//               <label>Monitoring Server</label>
//               <input 
//                 type="text" 
//                 name="monitoringServer"
//                 value={formData.monitoringServer}
//                 onChange={handleInputChange}
//                 readOnly
//                 className="readonly-input"
//               />
//             </div>

//             {renderDateInputs()}
//           </div>

//           <div className="form-row second-row">
//             <div className="form-group">
//               <label>View Mode <span style={{color: 'red'}}>*</span></label>
//               <div className="toggle-switch">
//                 <button 
//                   type="button"
//                   className={`toggle-option ${formData.viewMode === 'linewise' ? 'active' : ''}`}
//                   onClick={() => handleViewModeToggle('linewise')}
//                 >
//                   Live Projects
//                 </button>
//                 <button 
//                   type="button"
//                   className={`toggle-option ${formData.viewMode === 'projectwise' ? 'active' : ''}`}
//                   onClick={() => handleViewModeToggle('projectwise')}
//                 >
//                   Project Wise
//                 </button>
//               </div>
//             </div>

//             {/* ✅ MODIFIED: Show project selection for both modes, remove line selection */}
//             {formData.viewMode && (
//               <div className="form-group">
//                 <label>
//                   Select Project <span style={{color: 'red'}}>*</span>
//                   {formData.viewMode === 'linewise' && (
//                     <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
//                       {' '}(Live Projects)
//                     </span>
//                   )}
//                 </label>
//                 <select 
//                   name="project"
//                   value={selectedProject}
//                   onChange={handleProjectChange}
//                   className="select-input"
//                   required
//                   disabled={projectsLoading}
//                 >
//                   <option value="">
//                     {projectsLoading ? 'Loading projects...' : 
//                      projectsError ? 'Failed to load projects' : 
//                      formData.viewMode === 'linewise' ? 'Select Live Project' : 'Select Project'}
//                   </option>
//                   {projects.map(project => (
//                     <option 
//                       key={project.projId || project.ProjId} 
//                       value={project.projCode || project.ProjCode}
//                     >
//                       {project.projCode || project.ProjCode}
//                     </option>
//                   ))}
//                 </select>
                
//                 {/* Project Loading/Error feedback */}
//                 {projectsLoading && (
//                   <div style={{ fontSize: '12px', color: '#007bff', marginTop: '4px' }}>
//                     ⏳ Loading project list...
//                   </div>
//                 )}
                
//                 {projectsError && !projectsLoading && (
//                   <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
//                     ⚠️ {projectsError}
//                   </div>
//                 )}
                
//                 {projects.length > 0 && !projectsLoading && !projectsError && (
//                   <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
//                     ✓ {projects.length} projects loaded
//                     {formData.viewMode === 'linewise' && (
//                       <span style={{ color: '#666' }}> (Live)</span>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           <div className="form-actions">
//             <button 
//               className={`find-btn ${isLoading ? 'loading' : ''}`}
//               onClick={handleFind}
//               disabled={isLoading}
//             >
//               <span className="btn-icon">
//                 {isLoading ? '⏳' : '🔍'}
//               </span>
//               {isLoading ? 'Searching...' : 'Find Data'}
//             </button>
//             <button className="reset-btn" onClick={handleReset} disabled={isLoading}>
//               <span className="btn-icon">🔄</span>
//               Reset
//             </button>
//           </div>
//         </div>

//         {/* Results Area - Only visible after clicking Find Data */}
//         {showResults && (
//           <div className="results-area" ref={resultsRef}>
//             <div className="results-header">
//               <h3>SMART METER PRODUCTION ANALYSIS</h3>
//               <div className="results-info">
//                 <span className="info-tag">
//                   Mode: <strong>
//                     {formData.viewMode === 'linewise' ? 'Live Projects' : 'Project Wise'}
//                   </strong>
//                 </span>
//                 {formData.project && (
//                   <span className="info-tag">
//                     Project: <strong>{formData.project}</strong>
//                   </span>
//                 )}
//                 {formData.startDate && formData.endDate && (
//                   <span className="info-tag">
//                     Date: <strong>{formData.startDate}</strong> to <strong>{formData.endDate}</strong>
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Loading State */}
//             {isLoading && (
//               <div className="loading-message">
//                 <div className="loading-spinner"></div>
//                 <div className="loading-text">
//                   <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Searching for data...</div>
//                   <div style={{ fontSize: '14px', color: '#666' }}>
//                     Please wait while we fetch the results
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* No Data Message */}
//             {!isLoading && noDataMessage && (
//               <div className="no-data-message">
//                 <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
//                 <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{noDataMessage}</div>
//                 <div style={{ fontSize: '14px', color: '#999' }}>
//                   Please try different selection criteria or date range
//                 </div>
//               </div>
//             )}

//             {/* Charts Container - Only show when showCharts is true and not loading */}
//             {!isLoading && showCharts && (
//               <div className="charts-container">
//                 {fpyData && fpyData.length > 0 && (
//                   <div className="chart-block">
//                   <FPYChart
//                     data={fpyData}
//                     serverID={selectedServer}
//                     projCode={formData.project}
//                     Option={formData.viewMode}
//                     startDate={formData.startDate}
//                     endDate={formData.endDate}
//                   />
//                   </div>
//                 )}

//                 {cpkData && cpkData.length > 0 && (
//                   <div className="chart-block">
//                     <CPKChart
//                       data={cpkData}
//                       cpkList={cpkList}
//                       serverId={selectedServer}
//                       startDate={formData.startDate}
//                       endDate={formData.endDate}
//                       projCode={formData.project}
//                       cpkParameters={cpkParameters}
//                     />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

//---Code before changes in Linewise View Mode targeting Live Projects
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './Dashboard.css';
// import FPYChart from '../charts/FPYChart';
// import CPKChart from '../charts/CPKChart';

// // ✅ UPDATED: Import the new validateDateRange function
// import { apiService, createCPKData, createProjectData, validateDateRange } from '../services/apiService';

// const Dashboard = () => {
//   const [formData, setFormData] = useState({
//     monitoringServer: 'RCP JAIPUR',
//     lineNo: '',
//     project: '',
//     startDate: '',
//     endDate: '',
//     viewMode: '' // ✅ No default selection - user must choose
//   });

//   const [showResults, setShowResults] = useState(false); // Controls entire results area visibility
//   const [showCharts, setShowCharts] = useState(false);
//   const [fpyData, setFpyData] = useState(null);
//   const [cpkData, setCpkData] = useState(null);
//   const [cpkList, setCpkList] = useState([]);
//   const [noDataMessage, setNoDataMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   // Add state for project selection
//   const [selectedServer, setSelectedServer] = useState(2); // Default RCP
//   const [projects, setProjects] = useState([]);
//   const [selectedProject, setSelectedProject] = useState('');
//   const [projectsLoading, setProjectsLoading] = useState(false);
//   const [projectsError, setProjectsError] = useState('');
  
//   // ✅ NEW: Add Line List states
//   const [lineList, setLineList] = useState([]);
//   const [lineListLoading, setLineListLoading] = useState(false);
//   const [lineListError, setLineListError] = useState('');
  
//   // ✅ NEW: Add CPK parameters state
//   const [cpkParameters, setCpkParameters] = useState([]);
  
//   // Ref for auto-scrolling to results
//   const resultsRef = useRef(null);

//   // Server info mapping with actual server IPs
//   const ServerInfo = [
//     { id: 1, name: 'Genus RND - 192.10.10.4', serverIP: '192.10.10.4' },
//     { id: 2, name: 'RCP Jaipur - 10.141.61.40', serverIP: '10.141.61.40' },
//     { id: 3, name: 'HDR 1101 - 10.133.100.21', serverIP: '10.133.100.21' },
//     { id: 4, name: 'HDR 1100 - 10.134.1.21', serverIP: '10.134.1.21' },
//     { id: 5, name: 'HDR 1201 - 10.133.1.22', serverIP: '10.133.1.22' },
//     { id: 6, name: 'Guhawati - 10.161.1.22', serverIP: '10.161.1.22' },
//   ];

//   // ✅ Load CPK parameters from localStorage on mount
//   useEffect(() => {
//     const savedCpkParams = localStorage.getItem('LocalData');
//     if (savedCpkParams) {
//       try {
//         const parsedParams = JSON.parse(savedCpkParams);
//         setCpkParameters(parsedParams);
//         console.log('CPK Parameters loaded from localStorage:', parsedParams);
//       } catch (error) {
//         console.error('Error parsing CPK parameters from localStorage:', error);
//       }
//     }
//   }, []);

//   // Load server configuration from localStorage on component mount
//   useEffect(() => {
//     const savedServerId = localStorage.getItem('server');
//     if (savedServerId) {
//       const serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         setSelectedServer(serverId);
//         setFormData(prev => ({
//           ...prev,
//           monitoringServer: serverInfo.name
//         }));
//       }
//     }
//   }, []);

//   // ✅ FIXED: Line List loading useEffect - Use selectedServer ID consistently
//   useEffect(() => {
//     const loadLineList = async () => {
//       setLineListLoading(true);
//       setLineListError('');
      
//       try {
//         // ✅ FIX: Use selectedServer (ID) directly, remove serverIP logic
//         console.log('Loading line list for serverID:', selectedServer);
        
//         const lineData = await apiService.getLineList(selectedServer);
        
//         if (Array.isArray(lineData) && lineData.length > 0) {
//           setLineList(lineData);
//           console.log('Line list loaded successfully:', lineData);
//         } else {
//           setLineList([]);
//           setLineListError('No lines found for this server');
//         }
//       } catch (error) {
//         console.error('Error loading line list:', error);
//         setLineList([]);
//         setLineListError('Failed to load line list');
//       } finally {
//         setLineListLoading(false);
//       }
//     };

//     // Load line list on component mount and when server changes
//     loadLineList();
//   }, [selectedServer]);

//   // ✅ UPDATED: Enhanced project loading useEffect with date range validation
//   // useEffect(() => {
//   //   let isCancelled = false;

//   //   const loadProjectsForLine = async () => {
//   //     if (formData.viewMode === 'linewise' && formData.lineNo) {
//   //       setProjectsLoading(true);
//   //       setProjectsError('');
        
//   //       try {
//   //         console.log('Loading projects for line:', formData.lineNo, 'serverID:', selectedServer);
          
//   //         // ✅ NEW: Check if we have valid date range for API call
//   //         if (formData.startDate && formData.endDate) {
//   //           const dateValidation = validateDateRange(formData.startDate, formData.endDate);
//   //           if (dateValidation.isValid) {
//   //             // ✅ NEW: Use DateRangeWise API with date parameters
//   //             const projectData = await apiService.getProjectListDateRangeWise(
//   //               selectedServer, 
//   //               formData.startDate, 
//   //               formData.endDate
//   //             );
              
//   //             if (!isCancelled) {
//   //               if (Array.isArray(projectData) && projectData.length > 0) {
//   //                 // ✅ Filter projects by line if needed (depending on API response structure)
//   //                 const filteredProjects = projectData.filter(project => 
//   //                   project.lineNo === formData.lineNo || 
//   //                   project.LineNo === formData.lineNo ||
//   //                   !project.lineNo // Include if no line filtering needed
//   //                 );
                  
//   //                 setProjects(filteredProjects.length > 0 ? filteredProjects : projectData);
//   //                 setProjectsError('');
//   //                 console.log('Projects loaded for line with date range:', projectData);
//   //               } else {
//   //                 setProjects([]);
//   //                 setProjectsError('No projects found for this line in the selected date range');
//   //               }
//   //             }
//   //           } else {
//   //             // ✅ Handle invalid date range
//   //             if (!isCancelled) {
//   //               setProjects([]);
//   //               setProjectsError(`Invalid date range: ${dateValidation.message}`);
//   //             }
//   //           }
//   //         } else {
//   //           // ✅ Fallback to old API if dates not selected
//   //           const projectData = await apiService.getLiveProjectListLineWise(selectedServer, formData.lineNo);
            
//   //           if (!isCancelled) {
//   //             if (Array.isArray(projectData) && projectData.length > 0) {
//   //               setProjects(projectData);
//   //               setProjectsError('');
//   //               console.log('Projects loaded for line (no date filter):', projectData);
//   //             } else {
//   //               setProjects([]);
//   //               setProjectsError('No projects found for this line');
//   //             }
//   //           }
//   //         }
//   //       } catch (error) {
//   //         if (!isCancelled) {
//   //           console.error('Error loading projects for line:', error);
//   //           setProjects([]);
//   //           setProjectsError('Failed to load projects for this line');
//   //         }
//   //       } finally {
//   //         if (!isCancelled) {
//   //           setProjectsLoading(false);
//   //         }
//   //       }
//   //     } else if (formData.viewMode === 'projectwise') {
//   //       // ✅ Load projects for projectwise mode
//   //       setProjectsLoading(true);
//   //       setProjectsError('');
        
//   //       try {
//   //         console.log('Loading all projects for projectwise mode, serverID:', selectedServer);
          
//   //         // ✅ NEW: Use DateRangeWise API if dates are available
//   //         if (formData.startDate && formData.endDate) {
//   //           const dateValidation = validateDateRange(formData.startDate, formData.endDate);
//   //           if (dateValidation.isValid) {
//   //             const projectData = await apiService.getProjectListDateRangeWise(
//   //               selectedServer, 
//   //               formData.startDate, 
//   //               formData.endDate
//   //             );
              
//   //             if (!isCancelled) {
//   //               if (Array.isArray(projectData) && projectData.length > 0) {
//   //                 setProjects(projectData);
//   //                 setProjectsError('');
//   //                 console.log('All projects loaded with date range:', projectData);
//   //               } else {
//   //                 setProjects([]);
//   //                 setProjectsError('No projects found in the selected date range');
//   //               }
//   //             }
//   //           } else {
//   //             // ✅ Handle invalid date range
//   //             if (!isCancelled) {
//   //               setProjects([]);
//   //               setProjectsError(`Invalid date range: ${dateValidation.message}`);
//   //             }
//   //           }
//   //         } else {
//   //           // ✅ Fallback to old API if dates not selected
//   //           const projectData = await apiService.getProjectList(selectedServer);
            
//   //           if (!isCancelled) {
//   //             if (Array.isArray(projectData) && projectData.length > 0) {
//   //               setProjects(projectData);
//   //               setProjectsError('');
//   //               console.log('All projects loaded (no date filter):', projectData);
//   //             } else {
//   //               setProjects([]);
//   //               setProjectsError('No projects found');
//   //             }
//   //           }
//   //         }
//   //       } catch (error) {
//   //         if (!isCancelled) {
//   //           console.error('Error loading all projects:', error);
//   //           setProjects([]);
//   //           setProjectsError('Failed to load projects');
//   //         }
//   //       } finally {
//   //         if (!isCancelled) {
//   //           setProjectsLoading(false);
//   //         }
//   //       }
//   //     } else {
//   //       // Clear projects when no view mode selected or no line selected
//   //       setProjects([]);
//   //       setSelectedProject('');
//   //       setProjectsError('');
//   //       setProjectsLoading(false);
//   //     }
//   //   };

//   //   const debounceTimeout = setTimeout(() => {
//   //     loadProjectsForLine();
//   //   }, 300);

//   //   return () => {
//   //     isCancelled = true;
//   //     clearTimeout(debounceTimeout);
//   //   };
//   // }, [selectedServer, formData.viewMode, formData.lineNo, formData.startDate, formData.endDate]); // ✅ Added date dependencies

//   //----------------
//   // ✅ UPDATED: Fixed project loading useEffect - Only for projectwise mode
// // Add this useRef at the top of your component
// const previousViewMode = useRef(formData.viewMode);
// const hasShownAlert = useRef(false);

// // 👇 Detect switching to projectwise and show alert immediately if needed
// useEffect(() => {
//   const justSwitchedToProjectwise =
//     previousViewMode.current !== 'projectwise' && formData.viewMode === 'projectwise';

//   if (
//     justSwitchedToProjectwise &&
//     (!formData.startDate || !formData.endDate) &&
//     !hasShownAlert.current
//   ) {
//     alert('Please select start and end dates first');
//     hasShownAlert.current = true;
//   }

//   previousViewMode.current = formData.viewMode; // update after comparison
// }, [formData.viewMode, formData.startDate, formData.endDate]);

// useEffect(() => {
//   let isCancelled = false;

//   const loadProjects = async () => {
//     if (formData.viewMode === 'projectwise') {
//       if (!formData.startDate || !formData.endDate) {
//         setProjects([]);
//         setSelectedProject('');
//         setProjectsError('');
//         setProjectsLoading(false);
//         return;
//       }

//       setProjectsLoading(true);
//       setProjectsError('');

//       try {
//         const dateValidation = validateDateRange(formData.startDate, formData.endDate);
//         if (dateValidation.isValid) {
//           const projectData = await apiService.getProjectListDateRangeWise(
//             selectedServer,
//             formData.startDate,
//             formData.endDate
//           );

//           if (!isCancelled) {
//             setProjects(Array.isArray(projectData) ? projectData : []);
//             setProjectsError(
//               projectData?.length === 0 ? 'No projects found in the selected date range' : ''
//             );
//           }
//         } else {
//           if (!isCancelled) {
//             alert(`Invalid date range: ${dateValidation.message}`);
//             setProjects([]);
//             setProjectsError('');
//           }
//         }
//       } catch (error) {
//         if (!isCancelled) {
//           console.error('Project load failed:', error);
//           setProjects([]);
//           setProjectsError('Failed to load projects');
//         }
//       } finally {
//         if (!isCancelled) setProjectsLoading(false);
//       }
//     } else {
//       setProjects([]);
//       setSelectedProject('');
//       setProjectsError('');
//       setProjectsLoading(false);
//     }
//   };

//   const timeout = setTimeout(loadProjects, 300);

//   return () => {
//     isCancelled = true;
//     clearTimeout(timeout);
//   };
// }, [selectedServer, formData.viewMode, formData.startDate, formData.endDate]);


//   // ✅ REMOVED: Auto-scroll to results when they become visible (projects loading shouldn't trigger scroll)
//   // Auto-scroll only happens when Find Data is clicked

//   // ✅ UPDATED: Enhanced date validation function with 60-day limit
//   const validateDates = (startDate, endDate) => {
//     // Use the new validateDateRange function from apiService
//     return validateDateRange(startDate, endDate);
//   };

//   // ✅ FIXED GetFPYDatas function
//   const GetFPYDatas = async (option = 3) => {
//     try {
//       if (!selectedServer || !formData.project || !formData.startDate || !formData.endDate) {
//           console.error('Missing required parameters for FPY data');
//           setFpyData([]);
//           return null;
//       }

//       const projectData = {
//         serverID: selectedServer,
//         projCode: formData.project,
//         stage: 1,
//         startDate: formData.startDate,
//         endDate: formData.endDate,
//         Option: 3
//       };

//       console.log('Dashboard - Sending FPY request:', projectData);
//       const data = await apiService.getFPYData(projectData);
//       console.log('Dashboard - FPY API Response:', data);

//       if (data && Array.isArray(data) && data.length > 0) {
//         setFpyData(data);
//         console.log('FPY Data loaded successfully:', data.length, 'records');
//       } else {
//         console.log('No FPY data found for current selection');
//         setFpyData([]);
//       }

//       return data;
//     } catch (error) {
//       console.error('Error loading FPY data:', error);
//       setFpyData([]);
//       return null;
//     }
//   };

//   // Function to get CPK data from API
//   const GetCPKData = async () => {
//     try {
//       if (!selectedServer || !formData.project || !formData.startDate || !formData.endDate) {
//         console.error('Missing required parameters for CPK data');
//         setCpkData([]);
//         setCpkList([]);
//         return null;
//       }

//       const cpkRequestData = createCPKData({
//         serverId: selectedServer,
//         projCode: formData.project,
//         startDate: formData.startDate,
//         endDate: formData.endDate,
//         lineNo: formData.lineNo,
//         viewMode: formData.viewMode
//       }, null, 1);

//       console.log('Dashboard - Sending CPK request:', cpkRequestData);
//       const data = await apiService.getCPKData(cpkRequestData);
//       console.log('Dashboard - CPK API Response:', data);

//       if (data && Array.isArray(data) && data.length > 0) {
//         setCpkData(data);
        
//         const cpkListData = data.map((item, index) => {
//           const paramConfig = cpkParameters.find(p => 
//             p.name === item.ParameterName || 
//             p.name === item.parameterName
//           );
//           return { 
//             state: paramConfig ? paramConfig.state : true
//           };
//         });
        
//         setCpkList(cpkListData);
//         console.log('CPK Data loaded:', data);
//         console.log('CPK List created:', cpkListData);
//       } else {
//         console.log('No CPK data found for current selection');
//         setCpkData([]);
//         setCpkList([]);
//       }

//       return data;
//     } catch (error) {
//       console.error('Error loading CPK data:', error);
//       setCpkData([]);
//       setCpkList([]);
//       return null;
//     }
//   };

//   // ✅ UPDATED: Enhanced input change handler with real-time 60-day validation
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
    
//     // ✅ ENHANCED: Real-time date validation with 60-day limit
//     if (name === 'startDate' || name === 'endDate') {
//       const newFormData = { ...formData, [name]: value };
      
//       if (name === 'startDate' && newFormData.endDate) {
//         const validation = validateDateRange(value, newFormData.endDate);
//         if (!validation.isValid) {
//           alert(`❌ Date Selection Error\n\n${validation.message}`);
//           return;
//         } else if (validation.daysDifference) {
//           // ✅ Show success message with day count
//           console.log(`✅ Valid date range selected: ${validation.daysDifference} days`);
//         }
//       } else if (name === 'endDate' && newFormData.startDate) {
//         const validation = validateDateRange(newFormData.startDate, value);
//         if (!validation.isValid) {
//           alert(`❌ Date Selection Error\n\n${validation.message}`);
//           return;
//         } else if (validation.daysDifference) {
//           // ✅ Show success message with day count
//           console.log(`✅ Valid date range selected: ${validation.daysDifference} days`);
//         }
//       }
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     // ✅ Reset project selection when line changes
//     if (name === 'lineNo') {
//       setSelectedProject('');
//       setFormData(prev => ({
//         ...prev,
//         [name]: value,
//         project: ''
//       }));
//     }

//     // ✅ DON'T hide results when form data changes - only hide when Find Data is clicked
//   };

//   const handleProjectChange = (e) => {
//     const value = e.target.value;
//     setSelectedProject(value);
//     setFormData(prev => ({
//       ...prev,
//       project: value
//     }));
//   };

//   const handleViewModeToggle = (mode) => {

//     if (mode === 'linewise') {
//       // ✅ Show development message for linewise
//       alert('🚧 Feature Under Development\n\nLine Wise view is currently under development.\nPlease use Project Wise view for now.\n\nThank you for your patience!');
//       return; // Don't set linewise mode
//     }

//     setFormData(prev => ({
//       ...prev,
//       viewMode: mode,
//       // Reset fields when switching modes
//       lineNo: '',
//       project: ''
//     }));
    
//     // Reset selected project
//     setSelectedProject('');
    
//     // Clear projects list
//     setProjects([]);
//     setProjectsError('');
//   };

//   // ✅ UPDATED: Enhanced form validation with 60-day limit check
//   const validateFormEnhanced = () => {
//     // ✅ MANDATORY: Check if dates are selected
//     if (!formData.startDate || !formData.endDate) {
//       alert('❌ Missing Required Fields\n\nStart Date and End Date are mandatory fields. Please select both dates.');
//       return false;
//     }

//     // ✅ ENHANCED: Validate date range with 60-day limit
//     const dateValidation = validateDateRange(formData.startDate, formData.endDate);
//     if (!dateValidation.isValid) {
//       alert(`❌ Date Range Error\n\n${dateValidation.message}`);
//       return false;
//     }

//     // ✅ NEW: Show date range info in console
//     if (dateValidation.daysDifference) {
//       console.log(`✅ Form validation passed. Date range: ${dateValidation.daysDifference} days`);
//     }

//     // Check if view mode is selected
//     if (!formData.viewMode) {
//       alert('❌ Missing View Mode\n\nPlease select a View Mode (Line Wise or Project Wise)');
//       return false;
//     }

//     // Check monitoring server
//     if (!formData.monitoringServer) {
//       alert('❌ Missing Server\n\nPlease select a Monitoring Server');
//       return false;
//     }

//     // Validate required fields based on view mode
//     if (formData.viewMode === 'linewise' && !formData.lineNo) {
//       alert('❌ Missing Line Number\n\nPlease select Line No for Line Wise view');
//       return false;
//     }
    
//     if (formData.viewMode === 'projectwise' && !formData.project) {
//       alert('❌ Missing Project\n\nPlease select a Project for Project Wise view');
//       return false;
//     }

//     // For linewise mode, also check if project is selected
//     if (formData.viewMode === 'linewise' && !formData.project) {
//       alert('❌ Missing Project\n\nPlease select a Project for the selected line');
//       return false;
//     }

//     return true;
//   };

//   // ✅ UPDATED: Enhanced handleFind function with scroll behavior
//   const handleFind = async () => {
//     console.log('Search with:', formData);
//     console.log('Selected Server:', selectedServer);
//     console.log('CPK Parameters:', cpkParameters);
    
//     // ✅ Enhanced validation
//     if (!validateFormEnhanced()) {
//       return;
//     }
    
//     // Show loading state and results area
//     setIsLoading(true);
//     setShowResults(true);
//     setShowCharts(false);
//     setNoDataMessage('');
    
//     // ✅ FIXED: Auto-scroll to results only when Find Data is clicked
//     setTimeout(() => {
//       if (resultsRef.current) {
//         resultsRef.current.scrollIntoView({
//           behavior: 'smooth',
//           block: 'start'
//         });
//       }
//     }, 100);
    
//     try {
//       // Load data from API
//       const fpyResult = await GetFPYDatas(1);
//       const cpkResult = await GetCPKData();
      
//       // Check if any data was found
//       const hasFpyData = fpyResult && fpyResult.length > 0;
//       const hasCpkData = cpkResult && cpkResult.length > 0;

//       console.log('FPY Data available:', hasFpyData);
//       console.log('CPK Data available:', hasCpkData);
      
//       if (hasFpyData || hasCpkData) {
//         setShowCharts(true);
//         setNoDataMessage('');
//       } else {
//         setShowCharts(false);
//         setNoDataMessage('No data found for selected criteria');
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       setShowCharts(false);
//       setNoDataMessage('Error occurred while fetching data. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleReset = () => {
//     // Get current server from localStorage when resetting
//     const savedServerId = localStorage.getItem('server');
//     let serverName = 'RCP JAIPUR';
//     let serverId = 2;
    
//     if (savedServerId) {
//       serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         serverName = serverInfo.name;
//       }
//     }
    
//     setSelectedServer(serverId);
//     setSelectedProject('');
//     setFormData({
//       monitoringServer: serverName,
//       lineNo: '',
//       project: '',
//       startDate: '',
//       endDate: '',
//       viewMode: '' // ✅ No default selection
//     });
    
//     // Hide results area completely
//     setShowResults(false);
//     setShowCharts(false);
//     setFpyData(null);
//     setCpkData(null);
//     setCpkList([]);
//     setNoDataMessage('');
//     setIsLoading(false);
    
//     // Clear projects
//     setProjects([]);
//     setProjectsError('');
//   };

//   return (
//     <div className="dashboard">
//       <div className="dashboard-content">
//         <div className="search-form">
//           <h2 className="form-title">JHALAK APPLICATION</h2>
          
//           <div className="form-row first-row">
//             <div className="form-group">
//               <label>Monitoring Server</label>
//               <input 
//                 type="text" 
//                 name="monitoringServer"
//                 value={formData.monitoringServer}
//                 onChange={handleInputChange}
//                 readOnly
//                 className="readonly-input"
//               />
//             </div>

//             {/* ✅ UPDATED: Start Date Input with 60-day limit info */}
//             <div className="form-group">
//               <label>Start Date <span style={{color: 'red'}}>*</span></label>
//               <input 
//                 type="date" 
//                 name="startDate"
//                 value={formData.startDate}
//                 onChange={handleInputChange}
//                 className="date-input"
//                 max={new Date().toISOString().split('T')[0]}
//                 required
//               />
//               {/* ✅ NEW: 60-day limit info */}
//               <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
//                 📅 Max 65 days range allowed
//               </div>
//             </div>

//             {/* ✅ UPDATED: End Date Input with 60-day limit info */}
//             <div className="form-group">
//               <label>End Date <span style={{color: 'red'}}>*</span></label>
//               <input 
//                 type="date" 
//                 name="endDate"
//                 value={formData.endDate}
//                 onChange={handleInputChange}
//                 className="date-input"
//                 max={new Date().toISOString().split('T')[0]}
//                 min={formData.startDate}
//                 required
//               />
//               {/* ✅ NEW: Show selected date range info */}
//               {formData.startDate && formData.endDate && (() => {
//                 const validation = validateDateRange(formData.startDate, formData.endDate);
//                 if (validation.isValid && validation.daysDifference) {
//                   return (
//                     <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
//                       ✅ {validation.daysDifference} days selected
//                     </div>
//                   );
//                 }
//                 return null;
//               })()}
//             </div>
//           </div>

//           <div className="form-row second-row">
//             <div className="form-group">
//               <label>View Mode <span style={{color: 'red'}}>*</span></label>
//               <div className="toggle-switch">
//                 <button 
//                   type="button"
//                   className={`toggle-option ${formData.viewMode === 'linewise' ? 'active' : ''}`}
//                   onClick={() => handleViewModeToggle('linewise')}
//                 >
//                   Line Wise
//                 </button>
//                 <button 
//                   type="button"
//                   className={`toggle-option ${formData.viewMode === 'projectwise' ? 'active' : ''}`}
//                   onClick={() => handleViewModeToggle('projectwise')}
//                 >
//                   Project Wise
//                 </button>
//               </div>
//             </div>

//             {formData.viewMode === 'linewise' && (
//               <div className="form-group">
//                 <label>Select Line No <span style={{color: 'red'}}>*</span></label>
//                 <select 
//                   name="lineNo"
//                   value={formData.lineNo}
//                   onChange={handleInputChange}
//                   className="select-input"
//                   required
//                   disabled={lineListLoading}
//                 >
//                   <option value="">
//                     {lineListLoading ? 'Loading lines...' : 
//                      lineListError ? 'Failed to load lines' : 'Select Line No'}
//                   </option>
//                   {lineList.map(line => (
//                     <option key={line.tabId || line.TabId} value={line.userId || line.UserId}>
//                       {line.userId || line.UserId}
//                     </option>
//                   ))}
//                 </select>
                
//                 {/* Line List Loading/Error feedback */}
//                 {lineListLoading && (
//                   <div style={{ fontSize: '12px', color: '#007bff', marginTop: '4px' }}>
//                     ⏳ Loading line list...
//                   </div>
//                 )}
                
//                 {lineListError && !lineListLoading && (
//                   <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
//                     ⚠️ {lineListError}
//                   </div>
//                 )}
                
//                 {lineList.length > 0 && !lineListLoading && !lineListError && (
//                   <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
//                     ✓ {lineList.length} lines loaded
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Show project selection for both modes */}
//             {formData.viewMode && (
//               <div className="form-group">
//                 <label>Select Project <span style={{color: 'red'}}>*</span></label>
//                 <select 
//                   name="project"
//                   value={selectedProject}
//                   onChange={handleProjectChange}
//                   className="select-input"
//                   required
//                   disabled={projectsLoading}
//                 >
//                   <option value="">
//                     {projectsLoading ? 'Loading projects...' : 
//                      projectsError ? 'Failed to load projects' : 'Select Project'}
//                   </option>
//                   {projects.map(project => (
//                     <option 
//                       key={project.projId || project.ProjId} 
//                       value={project.projCode || project.ProjCode}
//                     >
//                       {project.projCode || project.ProjCode}
//                     </option>
//                   ))}
//                 </select>
                
//                 {/* Project Loading/Error feedback */}
//                 {projectsLoading && (
//                   <div style={{ fontSize: '12px', color: '#007bff', marginTop: '4px' }}>
//                     ⏳ Loading project list...
//                   </div>
//                 )}
                
//                 {projectsError && !projectsLoading && (
//                   <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
//                     ⚠️ {projectsError}
//                   </div>
//                 )}
                
//                 {projects.length > 0 && !projectsLoading && !projectsError && (
//                   <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
//                     ✓ {projects.length} projects loaded
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           <div className="form-actions">
//             <button 
//               className={`find-btn ${isLoading ? 'loading' : ''}`}
//               onClick={handleFind}
//               disabled={isLoading}
//             >
//               <span className="btn-icon">
//                 {isLoading ? '⏳' : '🔍'}
//               </span>
//               {isLoading ? 'Searching...' : 'Find Data'}
//             </button>
//             <button className="reset-btn" onClick={handleReset} disabled={isLoading}>
//               <span className="btn-icon">🔄</span>
//               Reset
//             </button>
//           </div>
//         </div>

//         {/* Results Area - Only visible after clicking Find Data */}
//         {showResults && (
//           <div className="results-area" ref={resultsRef}>
//             <div className="results-header">
//               <h3>SMART METER PRODUCTION ANALYSIS</h3>
//               <div className="results-info">
//                 <span className="info-tag">
//                   Mode: <strong>{formData.viewMode === 'linewise' ? 'Line Wise' : 'Project Wise'}</strong>
//                 </span>
//                 {formData.lineNo && formData.viewMode === 'linewise' && (
//                   <span className="info-tag">
//                     Line No: <strong>{formData.lineNo}</strong>
//                   </span>
//                 )}
//                 {formData.project && (
//                   <span className="info-tag">
//                     Project: <strong>{formData.project}</strong>
//                   </span>
//                 )}
//                 {formData.startDate && formData.endDate && (
//                   <span className="info-tag">
//                     Date: <strong>{formData.startDate}</strong> to <strong>{formData.endDate}</strong>
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Loading State */}
//             {isLoading && (
//               <div className="loading-message">
//                 <div className="loading-spinner"></div>
//                 <div className="loading-text">
//                   <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Searching for data...</div>
//                   <div style={{ fontSize: '14px', color: '#666' }}>
//                     Please wait while we fetch the results
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* No Data Message */}
//             {!isLoading && noDataMessage && (
//               <div className="no-data-message">
//                 <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
//                 <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{noDataMessage}</div>
//                 <div style={{ fontSize: '14px', color: '#999' }}>
//                   Please try different selection criteria or date range
//                 </div>
//               </div>
//             )}

//             {/* Charts Container - Only show when showCharts is true and not loading */}
//             {!isLoading && showCharts && (
//               <div className="charts-container">
//                 {fpyData && fpyData.length > 0 && (
//                   <div className="chart-block">
//                   <FPYChart
//                     data={fpyData}
//                     serverID={selectedServer}
//                     projCode={formData.project}
//                     Option={formData.viewMode}
//                     startDate={formData.startDate}
//                     endDate={formData.endDate}
//                   />
//                   </div>
//                 )}

//                 {cpkData && cpkData.length > 0 && (
//                   <div className="chart-block">
//                     <CPKChart
//                       data={cpkData}
//                       cpkList={cpkList}
//                       serverId={selectedServer}
//                       startDate={formData.startDate}
//                       endDate={formData.endDate}
//                       projCode={formData.project}
//                       cpkParameters={cpkParameters}
//                     />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;