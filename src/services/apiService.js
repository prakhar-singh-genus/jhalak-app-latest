
import config, { baseUrl } from "../config";

// Common constants
const HEADERS = { 'Content-Type': 'application/json' };

// API endpoints
const ENDPOINTS = {
  SETTING: {
    PROJECT_LIST: '/Setting/LiveProjectList',
    LIVE_PROJECT_LIST: '/Setting/LiveProjectList', // ✅ FIX: This should be the actual live projects endpoint
    PROJECT_DETAILS: '/Setting/ProjectDetails',
    SAVE_CONFIG: '/Setting/SaveConfig',
    GET_LINE_LIST: '/Setting/Get_LineList',
    LIVE_PROJECT_LIST_LINEWISE: '/Setting/LiveProjectList_LineWise',
    PROJECT_LIST_DATE_RANGE_WISE: '/Setting/ProjectListDateRangeWise'
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
    
    // const data = await response.json();
    // console.log(`API Response from ${url}:`, data);
    // Check if response has content before parsing JSON
const text = await response.text();
if (!text || text.trim() === '') {
  console.warn(`⚠️ Empty response from ${url}`);
  return fallback || [];
}

let data;
try {
  data = JSON.parse(text);
} catch (parseError) {
  console.error(`❌ JSON parse error for ${url}:`, parseError);
  return fallback || [];
}

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
  // ✅ FIXED: Project List API with proper server ID handling
  getProjectList: async (serverID) => {
    console.log('🔍 API Service - getProjectList called with serverID:', serverID);
    
    if (!serverID) {
      console.error('❌ Project List API - Missing serverID parameter');
      return [];
    }
    
    try {
      const response = await fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_LIST, { 
        serverID: Number(serverID)
      }), {}, []);
      
      if (validateApiData(response, 'Project List Data')) {
        console.log('✅ Project List fetched successfully for serverID:', serverID, '- Count:', response.length);
      } else {
        console.log('⚠️ No projects found for serverID:', serverID);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error in getProjectList for serverID:', serverID, error);
      return [];
    }
  },

  // ✅ NEW: Date Range Project List API
  getProjectListDateRangeWise: async (serverID, fromDate, toDate) => {
    console.log('🔍 API Service - getProjectListDateRangeWise called with:', { serverID, fromDate, toDate });
    
    if (!serverID || !fromDate || !toDate) {
      console.error('❌ Date Range Project List API - Missing required parameters:', { serverID, fromDate, toDate });
      return [];
    }
    
    try {
      const response = await fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_LIST_DATE_RANGE_WISE, { 
        serverID: Number(serverID),
        FromDt: fromDate,
        ToDate: toDate
      }), {}, []);
      
      if (validateApiData(response, 'Date Range Project List Data')) {
        console.log('✅ Date Range Project List fetched successfully for serverID:', serverID, '- Count:', response.length);
      } else {
        console.log('⚠️ No projects found for serverID:', serverID, 'in date range:', fromDate, 'to', toDate);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error in getProjectListDateRangeWise:', error);
      return [];
    }
  },

  // ✅ FIXED: Actual Live Projects API - This calls the real live projects endpoint
  getLiveProjectList: async (serverID) => {
    console.log('🔍 API Service - getLiveProjectList called with serverID:', serverID);
    
    if (!serverID) {
      console.error('❌ Live Project List API - Missing serverID parameter');
      return [];
    }
    
    try {
      // ✅ FIX: Use the actual live projects endpoint that returns currently running projects
      const response = await fetchData(buildUrl(ENDPOINTS.SETTING.LIVE_PROJECT_LIST, { 
        serverID: Number(serverID)
      }), {}, []);
      
      if (validateApiData(response, 'Live Project List Data')) {
        console.log('✅ Live Project List fetched successfully for serverID:', serverID, '- Count:', response.length);
      } else {
        console.log('⚠️ No live projects found for serverID:', serverID);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error in getLiveProjectList for serverID:', serverID, error);
      return [];
    }
  },

  getProjectDetails: (projCode, serverID) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_DETAILS, { projCode, serverID }), {}, null),

  saveConfig: (plantCode, projectCode) =>
    fetchData(buildUrl(ENDPOINTS.SETTING.SAVE_CONFIG), {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ plantCode, projectCode })
    }, null),

  // ✅ FIXED: Get Line List API with proper server ID handling
  getLineList: async (serverID) => {    
    console.log('🔍 API Service - getLineList called with serverID:', serverID);
    
    if (!serverID) {
      console.error('❌ Line List API - Missing serverID parameter');
      return [];
    }
    
    try {
      const response = await fetchData(buildUrl(ENDPOINTS.SETTING.GET_LINE_LIST, { 
        serverID: Number(serverID)
      }), {}, []);      
      
      if (validateApiData(response, 'Line List Data')) {
        console.log('✅ Line List fetched successfully for serverID:', serverID, '- Count:', response.length);
      } else {
        console.log('⚠️ No lines found for serverID:', serverID);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error in getLineList for serverID:', serverID, error);
      return [];
    }
  },

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
    
    const requestData = {
      serverID: Number(projectData.serverID),
      projCode: String(projectData.projCode),
      stage: Number(projectData.stage),
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      Option: Number(projectData.Option || 2)
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

    console.log('🏗️ createCPKData Debug:', {
    receivedFormData: formData,
    serverId,
    serverID,
    project,
    projCode
  });
  
  const finalServerID = serverID || serverId;
  const finalProjCode = project || projCode;
  
  console.log('🏗️ Creating CPK data:', { finalServerID, finalProjCode, paramName, option });
  
  const result = {
    serverID: Number(finalServerID),
    projCode: String(finalProjCode),
    startDate,
    endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null,
    paramName: paramName || '0',
    Option: Number(option)
  };
  
  console.log('🏗️ Final CPK request object:', result);
  
  return result;
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

// ✅ NEW: Helper function to validate date range (max 60 days)
export const validateDateRange = (startDate, endDate) => {
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
  
  // ✅ NEW: Check if date range exceeds 60 days
  const timeDifference = end.getTime() - start.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  
  if (daysDifference > 65) {
    return { 
      isValid: false, 
      message: `Date range cannot exceed 65 days. Current selection: ${daysDifference} days. Please select a shorter date range.` 
    };
  }
  
  return { isValid: true, message: '', daysDifference };
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


// import config, { baseUrl } from "../config";

// // Common constants
// const HEADERS = { 'Content-Type': 'application/json' };

// // API endpoints
// const ENDPOINTS = {
//   SETTING: {
//     PROJECT_LIST: '/Setting/LiveProjectList',
//     LIVE_PROJECT_LIST: '/Setting/LiveProjectList',
//     PROJECT_DETAILS: '/Setting/ProjectDetails',
//     SAVE_CONFIG: '/Setting/SaveConfig',
//     // ✅ NEW: Added Line List endpoint
//     GET_LINE_LIST: '/Setting/Get_LineList',
//     // ✅ NEW: Added LineWise Project List endpoint
//     LIVE_PROJECT_LIST_LINEWISE: '/Setting/LiveProjectList_LineWise',
//     // ✅ NEW: Added Date Range Project List endpoint
//     PROJECT_LIST_DATE_RANGE_WISE: '/Setting/ProjectListDateRangeWise'
//   },
//   FPY: {
//     GET_FPYS: '/Fpy/GetFPYs',
//     GET_PARETO: '/Fpy/GetParetoData',
//     GET_CPK: '/Fpy/GetCPKData',
//     CALCULATE_CPK: '/Fpy/CalculateCPK',
//     GET_SCATTERED: '/Fpy/GetScatterred'
//   }
// };

// // Helper: centralized fetch handler with better error handling
// const fetchData = async (url, options = {}, fallback = null) => {
//   try {
//     console.log(`API Call: ${url}`, options.body ? JSON.parse(options.body) : 'GET request');
    
//     const response = await fetch(url, options);
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
//     }
    
//     const data = await response.json();
//     console.log(`API Response from ${url}:`, data);
    
//     return data;
//   } catch (error) {
//     console.error(`Error fetching ${url}:`, error);
//     if (process.env.NODE_ENV === 'development') {
//       console.error('Request details:', options);
//     }
//     return fallback;
//   }
// };

// // Helper: query string builder
// const buildQueryString = (params) => {
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

// // ✅ Enhanced validation helper
// const validateApiData = (data, context = '') => {
//   if (!data) {
//     console.warn(`${context}: No data received`);
//     return false;
//   }
//   if (!Array.isArray(data)) {
//     console.warn(`${context}: Data is not an array:`, typeof data);
//     return false;
//   }
//   if (data.length === 0) {
//     console.warn(`${context}: Empty data array`);
//     return false;
//   }
//   return true;
// };

// // API Service Functions
// export const apiService = {
//   // ✅ FIXED: Project List API with proper server ID handling
//   getProjectList: async (serverID) => {
//     console.log('🔍 API Service - getProjectList called with serverID:', serverID);
    
//     if (!serverID) {
//       console.error('❌ Project List API - Missing serverID parameter');
//       return [];
//     }
    
//     try {
//       const response = await fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_LIST, { 
//         serverID: Number(serverID)  // Ensure it's a number
//       }), {}, []);
      
//       if (validateApiData(response, 'Project List Data')) {
//         console.log('✅ Project List fetched successfully for serverID:', serverID, '- Count:', response.length);
//       } else {
//         console.log('⚠️ No projects found for serverID:', serverID);
//       }
      
//       return response;
//     } catch (error) {
//       console.error('❌ Error in getProjectList for serverID:', serverID, error);
//       return [];
//     }
//   },

//   // ✅ NEW: Date Range Project List API
//   getProjectListDateRangeWise: async (serverID, fromDate, toDate) => {
//     console.log('🔍 API Service - getProjectListDateRangeWise called with:', { serverID, fromDate, toDate });
    
//     if (!serverID || !fromDate || !toDate) {
//       console.error('❌ Date Range Project List API - Missing required parameters:', { serverID, fromDate, toDate });
//       return [];
//     }
    
//     try {
//       const response = await fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_LIST_DATE_RANGE_WISE, { 
//         serverID: Number(serverID),
//         FromDt: fromDate,
//         ToDate: toDate
//       }), {}, []);
      
//       if (validateApiData(response, 'Date Range Project List Data')) {
//         console.log('✅ Date Range Project List fetched successfully for serverID:', serverID, '- Count:', response.length);
//       } else {
//         console.log('⚠️ No projects found for serverID:', serverID, 'in date range:', fromDate, 'to', toDate);
//       }
      
//       return response;
//     } catch (error) {
//       console.error('❌ Error in getProjectListDateRangeWise:', error);
//       return [];
//     }
//   },

//   getLiveProjectList: (serverID) =>
//     fetchData(buildUrl(ENDPOINTS.SETTING.LIVE_PROJECT_LIST, { serverID }), {}, []),

//   getProjectDetails: (projCode, serverID) =>
//     fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_DETAILS, { projCode, serverID }), {}, null),

//   saveConfig: (plantCode, projectCode) =>
//     fetchData(buildUrl(ENDPOINTS.SETTING.SAVE_CONFIG), {
//       method: 'POST',
//       headers: HEADERS,
//       body: JSON.stringify({ plantCode, projectCode })
//     }, null),

//   // ✅ FIXED: Get Line List API with proper server ID handling
//   getLineList: async (serverID) => {    
//     console.log('🔍 API Service - getLineList called with serverID:', serverID);
    
//     // ✅ Validate serverID
//     if (!serverID) {
//       console.error('❌ Line List API - Missing serverID parameter');
//       return [];
//     }
    
//     try {
//       const response = await fetchData(buildUrl(ENDPOINTS.SETTING.GET_LINE_LIST, { 
//         serverID: Number(serverID)  // Ensure it's a number
//       }), {}, []);      
      
//       if (validateApiData(response, 'Line List Data')) {
//         console.log('✅ Line List fetched successfully for serverID:', serverID, '- Count:', response.length);
        
//         // ✅ Log structure for debugging
//         response.slice(0, 3).forEach((item, index) => {
//           console.log(`📋 Line Item ${index}:`, {
//             tabId: item.tabId || item.TabId,
//             userId: item.userId || item.UserId,
//             allFields: Object.keys(item)
//           });
//         });
//       } else {
//         console.log('⚠️ No lines found for serverID:', serverID);
//       }
      
//       return response;
//     } catch (error) {
//       console.error('❌ Error in getLineList for serverID:', serverID, error);
//       return [];
//     }
//   },

//   // ✅ FIXED: Get Live Project List for LineWise API with proper server ID handling
//   // getLiveProjectListLineWise: async (serverID, lineId) => {
//   //   console.log('🔍 API Service - getLiveProjectListLineWise called with:', { serverID, lineId });
    
//   //   // ✅ Validate input parameters
//   //   if (!serverID || !lineId) {
//   //     console.error('❌ LineWise Project API - Missing required parameters:', {
//   //       serverID: serverID,
//   //       lineId: lineId
//   //     });
//   //     return [];
//   //   }
    
//   //   try {
//   //     // ✅ FIX: Ensure both parameters are properly formatted
//   //     // serverID should be numeric ID (1, 2, 3, etc.)
//   //     // lineId should be string/numeric line identifier
//   //     const response = await fetchData(buildUrl(ENDPOINTS.SETTING.LIVE_PROJECT_LIST_LINEWISE, { 
//   //       serverID: Number(serverID),  // Make sure it's a number
//   //       LineId: String(lineId)       // Make sure it's a string
//   //     }), {}, []);
      
//   //     console.log('📊 LineWise Project API - Raw response:', response);
      
//   //     if (validateApiData(response, 'LineWise Project Data')) {
//   //       console.log('✅ LineWise Project Data fetched successfully:', response.length, 'projects');
        
//   //       // ✅ Log first few items for debugging
//   //       response.slice(0, 3).forEach((item, index) => {
//   //         console.log(`📊 LineWise Project Item ${index}:`, {
//   //           projId: item.projId || item.ProjId,
//   //           projCode: item.projCode || item.ProjCode,
//   //           allFields: Object.keys(item)
//   //         });
//   //       });
//   //     } else {
//   //       console.log('⚠️ No LineWise projects found for serverID:', serverID, 'lineId:', lineId);
//   //     }
      
//   //     return response;
//   //   } catch (error) {
//   //     console.error('❌ Error in getLiveProjectListLineWise:', error);
//   //     console.error('❌ Request parameters were:', { serverID, lineId });
//   //     return [];
//   //   }
//   // },
//   // In your apiService.js, update the getLiveProjectList function

// // ✅ FIXED: Get Live Project List API with proper endpoint
// getLiveProjectList: async (serverID) => {
//   console.log('🔍 API Service - getLiveProjectList called with serverID:', serverID);
  
//   if (!serverID) {
//     console.error('❌ Live Project List API - Missing serverID parameter');
//     return [];
//   }
  
//   try {
//     // ✅ FIX: Use today's date for live projects
//     const today = new Date().toISOString().split('T')[0];
    
//     // Use the date range API with today's date to get live projects
//     const response = await fetchData(buildUrl(ENDPOINTS.SETTING.PROJECT_LIST_DATE_RANGE_WISE, { 
//       serverID: Number(serverID),
//       FromDt: today,
//       ToDate: today
//     }), {}, []);
    
//     if (validateApiData(response, 'Live Project List Data')) {
//       console.log('✅ Live Project List fetched successfully for serverID:', serverID, '- Count:', response.length);
//     } else {
//       console.log('⚠️ No live projects found for serverID:', serverID, 'for today:', today);
//     }
    
//     return response;
//   } catch (error) {
//     console.error('❌ Error in getLiveProjectList for serverID:', serverID, error);
//     return [];
//   }
// },
//   // ✅ Enhanced FPY API with better logging
//   getFPYData: async (projectData) => {
//     console.log('🔍 API Service - getFPYData called with:', projectData);
    
//     try {
//       const response = await fetchData(buildUrl(ENDPOINTS.FPY.GET_FPYS), {
//         method: 'POST',
//         headers: HEADERS,
//         body: JSON.stringify(projectData)
//       }, []);
      
//       if (validateApiData(response, 'FPY Data')) {
//         console.log('✅ FPY Data fetched successfully:', response.length, 'records');
//       }
      
//       return response;
//     } catch (error) {
//       console.error('❌ Error in getFPYData:', error);
//       return [];
//     }
//   },

//   // ✅ Enhanced Pareto API with detailed logging and validation
//   getParetoData: async (projectData) => {
//     console.log('📊 API Service - getParetoData called with:', projectData);
    
//     // ✅ Validate input parameters
//     if (!projectData.serverID || !projectData.projCode || !projectData.stage) {
//       console.error('❌ Pareto API - Missing required parameters:', {
//         serverID: projectData.serverID,
//         projCode: projectData.projCode,
//         stage: projectData.stage,
//         startDate: projectData.startDate,
//         endDate: projectData.endDate
//       });
//       return [];
//     }
    
//     // ✅ Ensure proper data types
//     const requestData = {
//       serverID: Number(projectData.serverID),
//       projCode: String(projectData.projCode),
//       stage: Number(projectData.stage),
//       startDate: projectData.startDate,
//       endDate: projectData.endDate,
//       Option: Number(projectData.Option || 2) // Default to Option 2 for Pareto
//     };
    
//     console.log('📊 Pareto API - Sending request:', requestData);
    
//     try {
//       const response = await fetchData(buildUrl(ENDPOINTS.FPY.GET_PARETO), {
//         method: 'POST',
//         headers: HEADERS,
//         body: JSON.stringify(requestData)
//       }, []);
      
//       console.log('📊 Pareto API - Raw response:', response);
      
//       if (validateApiData(response, 'Pareto Data')) {
//         console.log('✅ Pareto Data fetched successfully:', response.length, 'error types');
        
//         // ✅ Log first few items for debugging
//         response.slice(0, 3).forEach((item, index) => {
//           console.log(`📊 Pareto Item ${index}:`, {
//             error: item.error || item.errorDescription || item.defectType,
//             count: item.errCount || item.errorCount || item.count,
//             allFields: Object.keys(item)
//           });
//         });
//       } else {
//         console.log('⚠️ No Pareto data found for stage:', projectData.stage);
//       }
      
//       return response;
//     } catch (error) {
//       console.error('❌ Error in getParetoData:', error);
//       return [];
//     }
//   },

//   // ✅ Enhanced CPK API
//   getCPKData: async (cpkData) => {
//     console.log('📈 API Service - getCPKData called with:', cpkData);
      
//     try {
//       const response = await fetchData(buildUrl(ENDPOINTS.FPY.GET_CPK), {
//         method: 'POST',
//         headers: HEADERS,
//         body: JSON.stringify(cpkData)
//       }, []);
      
//       if (validateApiData(response, 'CPK Data')) {
//         console.log('✅ CPK Data fetched successfully:', response.length, 'parameters');
//       }
      
//       return response;
//     } catch (error) {
//       console.error('❌ Error in getCPKData:', error);
//       return [];
//     }
//   },

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
//     }, [])
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

// // ✅ Enhanced FPY Data structure creator
// export const createProjectData = (formData, option = 3) => {
//   const { serverID, serverId, projCode, project, stage, startDate, endDate, lineNo, viewMode } = formData;
  
//   const finalServerID = serverID || serverId;
//   const finalProjCode = projCode || project;
  
//   console.log('🏗️ Creating project data:', { finalServerID, finalProjCode, stage, startDate, endDate, option });
  
//   return {
//     serverID: Number(finalServerID),
//     projCode: String(finalProjCode),
//     stage: Number(stage || 1),
//     startDate,
//     endDate,
//     lineNo: viewMode === 'linewise' ? lineNo : null,
//     Option: Number(option)
//   };
// };

// // ✅ Enhanced CPK Data structure creator
// export const createCPKData = (formData, paramName = 0, option = 1) => {
//   const { serverId, serverID, project, projCode, startDate, endDate, lineNo, viewMode } = formData;
  
//   const finalServerID = serverId || serverID;
//   const finalProjCode = project || projCode;
  
//   console.log('🏗️ Creating CPK data:', { finalServerID, finalProjCode, paramName, option });
  
//   return {
//     serverID: Number(finalServerID),
//     projCode: String(finalProjCode),
//     startDate,
//     endDate,
//     lineNo: viewMode === 'linewise' ? lineNo : null,
//     paramName: paramName || '0',
//     Option: Number(option)
//   };
// };

// // ✅ NEW: Enhanced Pareto Data structure creator
// export const createParetoData = (formData, stageID, option = 2) => {
//   const { serverId, serverID, project, projCode, startDate, endDate } = formData;
  
//   const finalServerID = serverId || serverID;
//   const finalProjCode = project || projCode;
  
//   console.log('🏗️ Creating Pareto data:', { finalServerID, finalProjCode, stageID, option });
  
//   return {
//     serverID: Number(finalServerID),
//     projCode: String(finalProjCode),
//     stage: Number(stageID),
//     startDate,
//     endDate,
//     Option: Number(option)
//   };
// };

// // ✅ Helper function to create individual parameter requests
// export const createParameterRequest = (formData, parameterName, option = 2) => {
//   return createCPKData(formData, parameterName, option);
// };

// // ✅ Helper function to get all CPK parameters
// export const getCPKParameterNames = () => {
//   return [
//     'PPMValue',
//     'SupOn',
//     'SupOff',
//     'BatOn',
//     'Stage-1 TP 1',
//     'Stage-1 TP 2',
//     'Stage-1 TP 3',
//     'Stage-1 TP 4',
//     'Stage-1 TP 5',
//     'Stage-1 TP 6',
//     'Stage-1 TP 7',
//     'Stage-1 TP 8',
//     'Stage-1 TP 9',
//     'Stage-1 TP 10',
//     'Stage-1 TP 11',
//     'Stage-1 TP 12',
//     'Stage-2 TP 1',
//     'Stage-2 TP 2',
//     'Stage-2 TP 3',
//     'Stage-2 TP 4',
//     'Stage-2 TP 5',
//     'Stage-2 TP 6',
//     'Stage-2 TP 7',
//     'Stage-2 TP 8',
//     'Stage-2 TP 9',
//     'Stage-2 TP 10',
//     'Err_Ph LP 1',
//     'Err_Ph LP 2',
//     'Err_Ph LP 3',
//     'Err_Ph LP 4',
//     'Err_Ph LP 5',
//     'Err_Ph LP 6',
//     'Err_Ph LP 7',
//     'Err_Nu LP 1',
//     'Err_Nu LP 2',
//     'Err_Nu LP 3',
//     'Err_Nu LP 4',
//     'Err_Nu LP 5',
//     'Err_Nu LP 6',
//     'Err_Nu LP 7'
//   ];
// };

// // ✅ NEW: Helper function to validate date range (max 60 days)
// export const validateDateRange = (startDate, endDate) => {
//   if (!startDate || !endDate) {
//     return { isValid: false, message: 'Please select both start date and end date' };
//   }
  
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   const today = new Date();
  
//   // Remove time component for comparison
//   today.setHours(0, 0, 0, 0);
//   start.setHours(0, 0, 0, 0);
//   end.setHours(0, 0, 0, 0);
  
//   if (start > end) {
//     return { isValid: false, message: 'Start date should not be greater than end date' };
//   }
  
//   if (start > today) {
//     return { isValid: false, message: 'Start date cannot be in the future' };
//   }
  
//   if (end > today) {
//     return { isValid: false, message: 'End date cannot be in the future' };
//   }
  
//   // ✅ NEW: Check if date range exceeds 60 days
//   const timeDifference = end.getTime() - start.getTime();
//   const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  
//   if (daysDifference > 65) {
//     return { 
//       isValid: false, 
//       message: `Date range cannot exceed 65 days. Current selection: ${daysDifference} days. Please select a shorter date range.` 
//     };
//   }
  
//   return { isValid: true, message: '', daysDifference };
// };

// // Utility functions
// export const getServerName = (serverId) =>
//   SERVER_CONFIG[serverId] || 'Unknown';

// export const validateApiResponse = (response) =>
//   Array.isArray(response) && response.length > 0;

// // ✅ NEW: Debug helper function
// export const debugApiCall = (endpoint, requestData, response) => {
//   console.group(`🔍 API Debug: ${endpoint}`);
//   console.log('📤 Request:', requestData);
//   console.log('📥 Response:', response);
//   console.log('✅ Success:', Array.isArray(response) && response.length > 0);
//   console.groupEnd();
// };

// // Export for testing or debugging
// export const __internal__ = {
//   fetchData,
//   buildQueryString,
//   buildUrl,
//   ENDPOINTS,
//   validateApiData
// };