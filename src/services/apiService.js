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

// Helper: centralized fetch handler
const fetchData = async (url, options = {}, fallback = null) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error fetching ${url}:`, error);
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

// ✅ FIXED: FPY Data structure creator
export const createProjectData = (formData, option = 3) => {
  const { serverID, projCode, stage, startDate, endDate, lineNo, viewMode } = formData;
  
  return {
    serverID: serverID || formData.serverId,
    projCode: projCode || formData.project,
    stage: stage || 1,
    startDate,
    endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null,
    Option: option
  };
};

// ✅ NEW: Dedicated CPK Data structure creator
export const createCPKData = (formData, paramName = 0, option = 1) => {
  const { serverId, project, startDate, endDate, lineNo, viewMode } = formData;
  
  // ✅ Based on your SQL query, the CPK API expects these parameters:
  return {
    serverID: serverId,
    projCode: project,
    startDate,
    endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null,
    paramName: paramName || '0', // Empty string for all parameters
    Option: option // Option 1 for CPK values, Option 2 for value lists
  };
};

// ✅ NEW: Helper function to create individual parameter requests
export const createParameterRequest = (formData, parameterName, option = 2) => {
  return createCPKData(formData, parameterName, option);
};

// ✅ NEW: Helper function to get all CPK parameters
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

// Export for testing or debugging
export const __internal__ = {
  fetchData,
  buildQueryString,
  buildUrl,
  ENDPOINTS
};

////earier code before copying from jhakah final H Project
// import config, { baseUrl } from "../config";

// // Common constants
// const HEADERS = { 'Content-Type': 'application/json' };

// // API endpoints
// const ENDPOINTS = {
//   SETTING: {
//     // PROJECT_LIST: '/Setting/ProjectList',
//     PROJECT_LIST: '/Setting/LiveProjectList',
//     LIVE_PROJECT_LIST: '/Setting/LiveProjectList',
//     PROJECT_DETAILS: '/Setting/ProjectDetails',
//     SAVE_CONFIG: '/Setting/SaveConfig'
//   },
//   FPY: {
//     GET_FPYS: '/Fpy/GetFPYs',
//     GET_PARETO: '/Fpy/GetParetoData',
//     GET_CPK: '/Fpy/GetCPKData',
//     CALCULATE_CPK: '/Fpy/CalculateCPK',
//     GET_SCATTERED: '/Fpy/GetScatterred'
//   }
// };

// // Helper: centralized fetch handler
// const fetchData = async (url, options = {}, fallback = null) => {
//   debugger;
//   try {
//     const response = await fetch(url, options);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     return await response.json();
//   } catch (error) {
//     // Only log in development to avoid console spam in production
//     if (process.env.NODE_ENV === 'development') {
//       console.error(`Error fetching ${url}:`, error);
//     }
//     return fallback;
//   }
// };

// // Helper: query string builder
// const buildQueryString = (params) => {
//   // Filter out null/undefined values
//   const filtered = Object.fromEntries(
//     Object.entries(params).filter(([_, value]) => value != null)
//   );
//   return new URLSearchParams(filtered).toString();
// };

// // Helper: build full URL
// const buildUrl = (endpoint, params = null) => {
//   const url = `${baseUrl}${endpoint}`;
//   return params ? `${url}?${buildQueryString(params)}` : url;
// };

// // API Service Functions
// export const apiService = {
//   // Setting APIs
//   getProjectList: (serverID) =>
//     fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_LIST, { serverID })),

//   getLiveProjectList: (serverID) =>
//     fetchData(buildUrl(ENDPOINTS.SETTING.LIVE_PROJECT_LIST, { serverID })),

//   getProjectDetails: (projCode, serverID) =>
//     fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_DETAILS, { projCode, serverID }), {}, null),

//   saveConfig: (plantCode, projectCode) =>
//     fetchData(buildUrl(ENDPOINTS.SETTING.SAVE_CONFIG), {
//       method: 'POST',
//       headers: HEADERS,
//       body: JSON.stringify({ plantCode, projectCode })
//     }, null),

//   // FPY APIs
//   getFPYData: (projectData) =>
//     fetchData(buildUrl(ENDPOINTS.FPY.GET_FPYS), {
      
//       method: 'POST',
//       headers: HEADERS,
//       body: JSON.stringify(projectData)
//     }),

//   getParetoData: (projectData) =>
//     fetchData(buildUrl(ENDPOINTS.FPY.GET_PARETO), {
//       method: 'POST',
//       headers: HEADERS,
//       body: JSON.stringify(projectData)
//     }),

//   getCPKData: (cpkData) =>
//     fetchData(buildUrl(ENDPOINTS.FPY.GET_CPK), {
//       method: 'POST',
//       headers: HEADERS,
//       body: JSON.stringify(cpkData)
//     }),

//   calculateCPK: (cpkData) =>
//     fetchData(buildUrl(ENDPOINTS.FPY.CALCULATE_CPK), {
//       method: 'POST',
//       headers: HEADERS,
//       body: JSON.stringify(cpkData)
//     }, null),

//   getScatteredData: (cpkData) =>
//     fetchData(buildUrl(ENDPOINTS.FPY.GET_SCATTERED), {
//       method: 'POST',
//       headers: HEADERS,
//       body: JSON.stringify(cpkData)
//     })
// };

// // Server configurations
// export const SERVER_CONFIG = {
//   1: 'RND',
//   2: 'RCP',
//   3: 'HDR1',
//   4: 'HDR2',
//   5: 'HDR3',
//   6: 'Assam'
// };

// // Data structure creators
// export const createProjectData = (formData, option = 1) => {
//   const { serverId, lineNo, project, startDate, endDate, viewMode } = formData;
  
//   return {
//     serverID: serverId,
//     projCode: project,
//     stage: 0,  // ✅ Default to 0 to get all stages
//     startDate,
//     endDate,
//     lineNo: viewMode === 'linewise' ? lineNo : null,
//     Option: option
//   };
// };
// // export const createProjectData = (formData, option = 1) => {
// //   const { serverId, area, pcbaType, lineNo, project, startDate, endDate, viewMode } = formData;
  
// //   // Determine stage based on area and pcbaType
// //   const stage = (area === 'PCBA' && pcbaType) ? pcbaType : area;
  
// //   return {
// //     serverID: serverId,
// //     projCode: project,
// //     stage,
// //     startDate,
// //     endDate,
// //     lineNo: viewMode === 'linewise' ? lineNo : null,
// //     viewMode,
// //     Option: option
// //   };
// // };

// export const createCPKData = (formData, paramName = null, option = 1) => {
//   const { serverId, project, startDate, endDate, lineNo, viewMode } = formData;
  
//   return {
//     serverID: serverId,
//     projCode: project,
//     startDate,
//     endDate,
//     lineNo: viewMode === 'linewise' ? lineNo : null,
//     paramName,
//     //viewMode,
//     Option: option
//   };
// };

// // Utility functions
// export const getServerName = (serverId) =>
//   SERVER_CONFIG[serverId] || 'Unknown';

// export const validateApiResponse = (response) =>
//   Array.isArray(response) && response.length > 0;

// // Export for testing or debugging
// export const __internal__ = {
//   fetchData,
//   buildQueryString,
//   buildUrl,
//   ENDPOINTS
// };