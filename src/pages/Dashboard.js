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
  // const ServerInfo = [
  //   { id: 1, name: 'Genus RND - 192.10.10.4', serverIP: '192.10.10.4' },
  //   { id: 2, name: 'RCP Jaipur - 10.141.61.40', serverIP: '10.141.61.40' },
  //   { id: 3, name: 'HDR 1101 - 10.133.100.21', serverIP: '10.133.100.21' },
  //   { id: 4, name: 'HDR 1100 - 10.134.1.21', serverIP: '10.134.1.21' },
  //   { id: 5, name: 'HDR 1201 - 10.133.1.22', serverIP: '10.133.1.22' },
  //   { id: 6, name: 'Guhawati - 10.161.1.22', serverIP: '10.161.1.22' },
  // ];

   const ServerInfo = [
    { id: 1, name: 'Genus RND', serverIP: '192.10.10.4' },
    { id: 2, name: 'RCP Jaipur', serverIP: '10.141.61.40' },
    { id: 3, name: 'HDR 1101', serverIP: '10.133.100.21' },//1101
    { id: 4, name: 'HDR 1100', serverIP: '10.134.1.21' },//3000
    { id: 5, name: 'HDR 1201', serverIP: '10.133.1.22' },//1100
    { id: 6, name: 'Guhawati', serverIP: '10.161.1.22' },
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
    
  // Only show alert if project is selected but dates are missing (i.e., user is not just toggling)
  if (
  mode === 'projectwise' &&
  formData.project && // ✅ Only validate if a project is already selected
  (!formData.startDate || !formData.endDate)
  ) {
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
    
    // return (
    //   <>
    //     <div className="form-group">
    //       <label>
    //         Start Date {isRequired && <span style={{color: 'red'}}>*</span>}
    //         {formData.viewMode === 'linewise' && (
    //           <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
    //             {' '}(Optional for Live Projects)
    //           </span>
    //         )}
    //       </label>
    //       <input 
    //         type="date" 
    //         name="startDate"
    //         value={formData.startDate}
    //         onChange={handleInputChange}
    //         className="date-input"
    //         max={new Date().toISOString().split('T')[0]}
    //         required={isRequired}
    //       />
    //       <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
    //         📅 {isProjectWise ? 'Max 65 days range allowed' : 'Optional for Live Projects'}
    //       </div>
    //     </div>

    //     <div className="form-group">
    //       <label>
    //         End Date {isRequired && <span style={{color: 'red'}}>*</span>}
    //         {formData.viewMode === 'linewise' && (
    //           <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
    //             {' '}(Optional for Live Projects)
    //           </span>
    //         )}
    //       </label>
    //       <input 
    //         type="date" 
    //         name="endDate"
    //         value={formData.endDate}
    //         onChange={handleInputChange}
    //         className="date-input"
    //         max={new Date().toISOString().split('T')[0]}
    //         min={formData.startDate}
    //         required={isRequired}
    //       />
    //       {formData.startDate && formData.endDate && (() => {
    //         const validation = validateDateRange(formData.startDate, formData.endDate);
    //         if (validation.isValid && validation.daysDifference) {
    //           return (
    //             <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
    //               ✅ {validation.daysDifference} days selected
    //             </div>
    //           );
    //         }
    //         return null;
    //       })()}
    //     </div>
    //   </>
    // );
return (
  <>
    <div className="form-group">
      <label>
        Start Date {isRequired && <span style={{ color: 'red' }}>*</span>}
        {formData.viewMode === 'linewise' && (
          <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
            {' '} (Optional for Live Projects)
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
        onKeyDown={(e) => e.preventDefault()} // ⛔ Prevent manual typing
        onFocus={(e) => e.target.showPicker()} // ✅ Open calendar on focus/click
        style={{ cursor: 'pointer' }} // ✅ Show pointer cursor for better UX
      />
      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
        📅 {isProjectWise ? 'Max 65 days range allowed' : 'Optional for Live Projects'}
      </div>
    </div>

    <div className="form-group">
      <label>
        End Date {isRequired && <span style={{ color: 'red' }}>*</span>}
        {formData.viewMode === 'linewise' && (
          <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
            {' '} (Optional for Live Projects)
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
        onKeyDown={(e) => e.preventDefault()} // ⛔ Prevent manual typing
        onFocus={(e) => e.target.showPicker()} // ✅ Open calendar on focus/click
        style={{ cursor: 'pointer' }} // ✅ Show pointer cursor for better UX
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
)
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