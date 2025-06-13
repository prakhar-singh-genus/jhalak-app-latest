import config, { baseUrl } from "../config";

// API Service Functions
export const apiService = {
  // Setting APIs
  getProjectList: async (serverID) => {
    try {
      const response = await fetch(`${baseUrl}/Setting/ProjectList?serverID=${serverID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching project list:', error);
      return [];
    }
  },

  getLiveProjectList: async (serverID) => {
    try {
      const response = await fetch(`${baseUrl}/Setting/LiveProjectList?serverID=${serverID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching live project list:', error);
      return [];
    }
  },

  getProjectDetails: async (projCode, serverID) => {
    try {
      const response = await fetch(`${baseUrl}/Setting/ProjectDetails?projCode=${projCode}&serverID=${serverID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching project details:', error);
      return null;
    }
  },

  saveConfig: async (plantCode, projectCode) => {
    try {
      const response = await fetch(`${baseUrl}/Setting/SaveConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantCode, projectCode })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error saving config:', error);
      return null;
    }
  },

  // FPY APIs
  getFPYData: async (projectData) => {
    try {
      const response = await fetch(`${baseUrl}/Fpy/GetFPYs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching FPY data:', error);
      return [];
    }
  },

  getParetoData: async (projectData) => {
    try {
      const response = await fetch(`${baseUrl}/Fpy/GetParetoData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Pareto data:', error);
      return [];
    }
  },

  getCPKData: async (cpkData) => {
    try {
      const response = await fetch(`${baseUrl}/Fpy/GetCPKData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cpkData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching CPK data:', error);
      return [];
    }
  },

  calculateCPK: async (cpkData) => {
    try {
      const response = await fetch(`${baseUrl}/Fpy/CalculateCPK`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cpkData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error calculating CPK:', error);
      return null;
    }
  },

  getScatteredData: async (cpkData) => {
    try {
      const response = await fetch(`${baseUrl}/Fpy/GetScatterred`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cpkData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching scattered data:', error);
      return [];
    }
  }
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

// Updated project data structure to match Dashboard usage
export const createProjectData = (formData) => {
  const { serverId, area, pcbaType, lineNo, project, startDate, endDate, viewMode } = formData;
  
  // Determine stage based on area and pcbaType
  let stage = area; // Default to area
  if (area === 'PCBA' && pcbaType) {
    stage = pcbaType; // Use pcbaType for PCBA area
  }
  
  return {
    serverID: serverId,
    projCode: project,
    stage: stage,
    startDate: startDate,
    endDate: endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null, // Include lineNo only for linewise
    viewMode: viewMode,
    Option: 1
  };
};

// Updated CPK data structure to match Dashboard usage
export const createCPKData = (formData, paramName = null) => {
  const { serverId, project, startDate, endDate, lineNo, viewMode } = formData;
  
  return {
    serverID: serverId,
    projCode: project,
    startDate: startDate,
    endDate: endDate,
    lineNo: viewMode === 'linewise' ? lineNo : null,
    paramName: paramName,
    viewMode: viewMode,
    Option: 1
  };
};

// Helper function to get server name by ID
export const getServerName = (serverId) => {
  return SERVER_CONFIG[serverId] || 'Unknown';
};

// Helper function to validate API response
export const validateApiResponse = (response) => {
  return response && Array.isArray(response) && response.length > 0;
};