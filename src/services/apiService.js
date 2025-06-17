import config, { baseUrl } from "../config";

// Common constants
const HEADERS = { 'Content-Type': 'application/json' };

// API endpoints
const ENDPOINTS = {
  SETTING: {
    // PROJECT_LIST: '/Setting/ProjectList',
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

// Helper: centralized fetch handler
const fetchData = async (url, options = {}, fallback = null) => {
  debugger;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // Only log in development to avoid console spam in production
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error fetching ${url}:`, error);
    }
    return fallback;
  }
};

// Helper: query string builder
const buildQueryString = (params) => {
  // Filter out null/undefined values
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

// API Service Functions
export const apiService = {
  // Setting APIs
  getProjectList: (serverID) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_LIST, { serverID })),

  getLiveProjectList: (serverID) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.LIVE_PROJECT_LIST, { serverID })),

  getProjectDetails: (projCode, serverID) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_DETAILS, { projCode, serverID }), {}, null),

  saveConfig: (plantCode, projectCode) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.SAVE_CONFIG), {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ plantCode, projectCode })
    }, null),

  // FPY APIs
  getFPYData: (projectData) =>
    fetchData(buildUrl(ENDPOINTS.FPY.GET_FPYS), {
      
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(projectData)
    }),

  getParetoData: (projectData) =>
    fetchData(buildUrl(ENDPOINTS.FPY.GET_PARETO), {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(projectData)
    }),

  getCPKData: (cpkData) =>
    fetchData(buildUrl(ENDPOINTS.FPY.GET_CPK), {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(cpkData)
    }),

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
    })
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

// Data structure creators
export const createProjectData = (formData, option = 1) => {
  const { serverId, lineNo, project, startDate, endDate, viewMode } = formData;
  
  return {
    serverID: serverId,
    projCode: project,
    stage: 0,  // ✅ Default to 0 to get all stages
    startDate,
    endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null,
    Option: option
  };
};
// export const createProjectData = (formData, option = 1) => {
//   const { serverId, area, pcbaType, lineNo, project, startDate, endDate, viewMode } = formData;
  
//   // Determine stage based on area and pcbaType
//   const stage = (area === 'PCBA' && pcbaType) ? pcbaType : area;
  
//   return {
//     serverID: serverId,
//     projCode: project,
//     stage,
//     startDate,
//     endDate,
//     lineNo: viewMode === 'linewise' ? lineNo : null,
//     viewMode,
//     Option: option
//   };
// };

export const createCPKData = (formData, paramName = null, option = 1) => {
  const { serverId, project, startDate, endDate, lineNo, viewMode } = formData;
  
  return {
    serverID: serverId,
    projCode: project,
    startDate,
    endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null,
    paramName,
    //viewMode,
    Option: option
  };
};

// Utility functions
export const getServerName = (serverId) =>
  SERVER_CONFIG[serverId] || 'Unknown';

export const validateApiResponse = (response) =>
  Array.isArray(response) && response.length > 0;

// Export for testing or debugging
export const __internal__ = {
  fetchData,
  buildQueryString,
  buildUrl,
  ENDPOINTS
};