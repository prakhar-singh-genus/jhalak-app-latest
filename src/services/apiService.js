import config, { baseUrl } from "../config";

// Common constants
const HEADERS = { 'Content-Type': 'application/json' };

// API endpoints
const ENDPOINTS = {
  SETTING: {
    PROJECT_LIST: '/Setting/LiveProjectList',
    LIVE_PROJECT_LIST: '/Setting/LiveProjectList',
    PROJECT_DETAILS: '/Setting/ProjectDetails',
    SAVE_CONFIG: '/Setting/SaveConfig'
  },
  FPY: {
    GET_FPYS: '/Fpy/GetFPYs',
    GET_PARETO: '/Fpy/GetParetoData',
    GET_CPK: '/Fpy/GetCPKData',
    CALCULATE_CPK: '/Fpy/CalculateCPK',
    GET_SCATTERED: '/Fpy/GetScatterred'
  }
};

// Helper: centralized fetch handler with better error handling
const fetchData = async (url, options = {}, fallback = null) => {
  try {
    console.log(`API Call: ${url}`, options.body ? JSON.parse(options.body) : 'GET request');
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`API Response from ${url}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    if (process.env.NODE_ENV === 'development') {
      console.error('Request details:', options);
    }
    return fallback;
  }
};

// Helper: query string builder
const buildQueryString = (params) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value != null)
  );
  return new URLSearchParams(filtered).toString();
};

// Helper: build full URL
const buildUrl = (endpoint, params = null) => {
  const url = `${baseUrl}${endpoint}`;
  return params ? `${url}?${buildQueryString(params)}` : url;
};

// ✅ Enhanced validation helper
const validateApiData = (data, context = '') => {
  if (!data) {
    console.warn(`${context}: No data received`);
    return false;
  }
  if (!Array.isArray(data)) {
    console.warn(`${context}: Data is not an array:`, typeof data);
    return false;
  }
  if (data.length === 0) {
    console.warn(`${context}: Empty data array`);
    return false;
  }
  return true;
};

// API Service Functions
export const apiService = {
  // Setting APIs
  getProjectList: (serverID) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_LIST, { serverID }), {}, []),

  getLiveProjectList: (serverID) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.LIVE_PROJECT_LIST, { serverID }), {}, []),

  getProjectDetails: (projCode, serverID) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_DETAILS, { projCode, serverID }), {}, null),

  saveConfig: (plantCode, projectCode) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.SAVE_CONFIG), {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ plantCode, projectCode })
    }, null),

  // ✅ Enhanced FPY API with better logging
  getFPYData: async (projectData) => {
    console.log('🔍 API Service - getFPYData called with:', projectData);
    
    try {
      const response = await fetchData(buildUrl(ENDPOINTS.FPY.GET_FPYS), {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(projectData)
      }, []);
      
      if (validateApiData(response, 'FPY Data')) {
        console.log('✅ FPY Data fetched successfully:', response.length, 'records');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error in getFPYData:', error);
      return [];
    }
  },

  // ✅ Enhanced Pareto API with detailed logging and validation
  getParetoData: async (projectData) => {
    console.log('📊 API Service - getParetoData called with:', projectData);
    
    // ✅ Validate input parameters
    if (!projectData.serverID || !projectData.projCode || !projectData.stage) {
      console.error('❌ Pareto API - Missing required parameters:', {
        serverID: projectData.serverID,
        projCode: projectData.projCode,
        stage: projectData.stage,
        startDate: projectData.startDate,
        endDate: projectData.endDate
      });
      return [];
    }
    
    // ✅ Ensure proper data types
    const requestData = {
      serverID: Number(projectData.serverID),
      projCode: String(projectData.projCode),
      stage: Number(projectData.stage),
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      Option: Number(projectData.Option || 2) // Default to Option 2 for Pareto
    };
    
    console.log('📊 Pareto API - Sending request:', requestData);
    
    try {
      const response = await fetchData(buildUrl(ENDPOINTS.FPY.GET_PARETO), {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(requestData)
      }, []);
      
      console.log('📊 Pareto API - Raw response:', response);
      
      if (validateApiData(response, 'Pareto Data')) {
        console.log('✅ Pareto Data fetched successfully:', response.length, 'error types');
        
        // ✅ Log first few items for debugging
        response.slice(0, 3).forEach((item, index) => {
          console.log(`📊 Pareto Item ${index}:`, {
            error: item.error || item.errorDescription || item.defectType,
            count: item.errCount || item.errorCount || item.count,
            allFields: Object.keys(item)
          });
        });
      } else {
        console.log('⚠️ No Pareto data found for stage:', projectData.stage);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error in getParetoData:', error);
      return [];
    }
  },

  // ✅ Enhanced CPK API
  getCPKData: async (cpkData) => {
    console.log('📈 API Service - getCPKData called with:', cpkData);
      debugger
    try {
      const response = await fetchData(buildUrl(ENDPOINTS.FPY.GET_CPK), {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(cpkData)
      }, []);
      
      if (validateApiData(response, 'CPK Data')) {
        console.log('✅ CPK Data fetched successfully:', response.length, 'parameters');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error in getCPKData:', error);
      return [];
    }
  },

  calculateCPK: (cpkData) =>
    fetchData(buildUrl(ENDPOINTS.FPY.CALCULATE_CPK), {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(cpkData)
    }, null),

  getScatteredData: (cpkData) =>
    fetchData(buildUrl(ENDPOINTS.FPY.GET_SCATTERED), {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(cpkData)
    }, [])
    
};

// Server configurations
export const SERVER_CONFIG = {
  1: 'RND',
  2: 'RCP',
  3: 'HDR1',
  4: 'HDR2',
  5: 'HDR3',
  6: 'Assam'
};

// ✅ Enhanced FPY Data structure creator
export const createProjectData = (formData, option = 3) => {
  const { serverID, serverId, projCode, project, stage, startDate, endDate, lineNo, viewMode } = formData;
  
  const finalServerID = serverID || serverId;
  const finalProjCode = projCode || project;
  
  console.log('🏗️ Creating project data:', { finalServerID, finalProjCode, stage, startDate, endDate, option });
  
  return {
    serverID: Number(finalServerID),
    projCode: String(finalProjCode),
    stage: Number(stage || 1),
    startDate,
    endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null,
    Option: Number(option)
  };
};

// ✅ Enhanced CPK Data structure creator
export const createCPKData = (formData, paramName = 0, option = 1) => {
  const { serverId, serverID, project, projCode, startDate, endDate, lineNo, viewMode } = formData;
  
  const finalServerID = serverId || serverID;
  const finalProjCode = project || projCode;
  
  console.log('🏗️ Creating CPK data:', { finalServerID, finalProjCode, paramName, option });
  
  return {
    serverID: Number(finalServerID),
    projCode: String(finalProjCode),
    startDate,
    endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null,
    paramName: paramName || '0',
    Option: Number(option)
  };
};

// ✅ NEW: Enhanced Pareto Data structure creator
export const createParetoData = (formData, stageID, option = 2) => {
  const { serverId, serverID, project, projCode, startDate, endDate } = formData;
  
  const finalServerID = serverId || serverID;
  const finalProjCode = project || projCode;
  
  console.log('🏗️ Creating Pareto data:', { finalServerID, finalProjCode, stageID, option });
  
  return {
    serverID: Number(finalServerID),
    projCode: String(finalProjCode),
    stage: Number(stageID),
    startDate,
    endDate,
    Option: Number(option)
  };
};

// ✅ Helper function to create individual parameter requests
export const createParameterRequest = (formData, parameterName, option = 2) => {
  return createCPKData(formData, parameterName, option);
};

// ✅ Helper function to get all CPK parameters
export const getCPKParameterNames = () => {
  return [
    'PPMValue',
    'SupOn',
    'SupOff',
    'BatOn',
    'Stage-1 TP 1',
    'Stage-1 TP 2',
    'Stage-1 TP 3',
    'Stage-1 TP 4',
    'Stage-1 TP 5',
    'Stage-1 TP 6',
    'Stage-1 TP 7',
    'Stage-1 TP 8',
    'Stage-1 TP 9',
    'Stage-1 TP 10',
    'Stage-1 TP 11',
    'Stage-1 TP 12',
    'Stage-2 TP 1',
    'Stage-2 TP 2',
    'Stage-2 TP 3',
    'Stage-2 TP 4',
    'Stage-2 TP 5',
    'Stage-2 TP 6',
    'Stage-2 TP 7',
    'Stage-2 TP 8',
    'Stage-2 TP 9',
    'Stage-2 TP 10',
    'Err_Ph LP 1',
    'Err_Ph LP 2',
    'Err_Ph LP 3',
    'Err_Ph LP 4',
    'Err_Ph LP 5',
    'Err_Ph LP 6',
    'Err_Ph LP 7',
    'Err_Nu LP 1',
    'Err_Nu LP 2',
    'Err_Nu LP 3',
    'Err_Nu LP 4',
    'Err_Nu LP 5',
    'Err_Nu LP 6',
    'Err_Nu LP 7'
  ];
};

// Utility functions
export const getServerName = (serverId) =>
  SERVER_CONFIG[serverId] || 'Unknown';

export const validateApiResponse = (response) =>
  Array.isArray(response) && response.length > 0;

// ✅ NEW: Debug helper function
export const debugApiCall = (endpoint, requestData, response) => {
  console.group(`🔍 API Debug: ${endpoint}`);
  console.log('📤 Request:', requestData);
  console.log('📥 Response:', response);
  console.log('✅ Success:', Array.isArray(response) && response.length > 0);
  console.groupEnd();
};

// Export for testing or debugging
export const __internal__ = {
  fetchData,
  buildQueryString,
  buildUrl,
  ENDPOINTS,
  validateApiData
};