// import React, { useState, useEffect } from 'react';
// import './Dashboard.css';
// import FPYChart from '../charts/FPYChart';
// import CPKChart from '../charts/CPKChart';

// // Import JSON data
// import fpyDataJson from '../data/fpyData.json';
// import cpkDataJson from '../data/cpkData.json';

// const Dashboard = () => {
//   const [formData, setFormData] = useState({
//     monitoringServer: 'RCP JAIPUR',
//     area: 'PCBA',
//     pcbaType: 'Main PCB',
//     lineNo: '',
//     project: '',
//     startDate: '',
//     endDate: '',
//     viewMode: 'linewise' // 'linewise' or 'projectwise'
//   });

//   const [showCharts, setShowCharts] = useState(false);
//   const [fpyData, setFpyData] = useState(null);
//   const [cpkData, setCpkData] = useState(null);
//   const [cpkList, setCpkList] = useState([]);
//   const [noDataMessage, setNoDataMessage] = useState('');

//   // Server info mapping (same as in Configuration component)
//   const ServerInfo = [
//     { id: 1, name: 'Genus RND - 192.10.10.4' },
//     { id: 2, name: 'RCP Jaipur - 10.141.61.40' },
//     { id: 3, name: 'HDR 1101 - 10.133.100.21' },
//     { id: 4, name: 'HDR 1100 - 10.134.1.21' },
//     { id: 5, name: 'HDR 1201 - 10.133.1.22' },
//     { id: 6, name: 'Guhawati - 10.161.1.22' },
//   ];

//   // Load server configuration from localStorage on component mount
//   useEffect(() => {
//     const savedServerId = localStorage.getItem('server');
//     if (savedServerId) {
//       const serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         setFormData(prev => ({
//           ...prev,
//           monitoringServer: serverInfo.name
//         }));
//       }
//     }
//   }, []);

//   // Date validation function
//   const validateDates = (startDate, endDate) => {
//     if (!startDate || !endDate) {
//       return { isValid: false, message: 'Please select both start date and end date' };
//     }
    
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const today = new Date();
    
//     // Remove time component for comparison
//     today.setHours(0, 0, 0, 0);
//     start.setHours(0, 0, 0, 0);
//     end.setHours(0, 0, 0, 0);
    
//     if (start > end) {
//       return { isValid: false, message: 'Start date should not be greater than end date' };
//     }
    
//     if (start > today) {
//       return { isValid: false, message: 'Start date cannot be in the future' };
//     }
    
//     if (end > today) {
//       return { isValid: false, message: 'End date cannot be in the future' };
//     }
    
//     return { isValid: true, message: '' };
//   };

//   // Function to get FPY data from JSON
//   const GetFPYDatas = (option) => {
//     try {
//       let data = null;
      
//       if (formData.viewMode === 'linewise') {
//         // Line Wise: area -> pcbaType -> lineNo -> project
//         if (formData.lineNo && formData.project) {
//           data = fpyDataJson[formData.area]?.[formData.pcbaType]?.[formData.lineNo]?.[formData.project];
//         }
//       } else if (formData.viewMode === 'projectwise') {
//         // Project Wise: area -> pcbaType -> project (skip lineNo)
//         if (formData.project) {
//           data = fpyDataJson[formData.area]?.[formData.pcbaType]?.[formData.project];
//         }
//       }
      
//       if (data && data.length > 0) {
//         setFpyData(data);
//         console.log('FPY Data loaded:', data);
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

//   // Function to get CPK data from JSON
//   const GetCPKData = () => {
//     try {
//       let data = null;
      
//       if (formData.viewMode === 'linewise') {
//         // Line Wise: area -> pcbaType -> lineNo -> project
//         if (formData.lineNo && formData.project) {
//           data = cpkDataJson[formData.area]?.[formData.pcbaType]?.[formData.lineNo]?.[formData.project];
//         }
//       } else if (formData.viewMode === 'projectwise') {
//         // Project Wise: area -> pcbaType -> project (skip lineNo)
//         if (formData.project) {
//           data = cpkDataJson[formData.area]?.[formData.pcbaType]?.[formData.project];
//         }
//       }
      
//       if (data && data.length > 0) {
//         setCpkData(data);
//         // Create CPK list with all parameters enabled by default
//         const cpkListData = data.map(() => ({ state: true }));
//         setCpkList(cpkListData);
//         console.log('CPK Data loaded:', data);
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

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
    
//     // Real-time date validation
//     if (name === 'startDate' || name === 'endDate') {
//       const newFormData = { ...formData, [name]: value };
      
//       if (name === 'startDate' && newFormData.endDate) {
//         const validation = validateDates(value, newFormData.endDate);
//         if (!validation.isValid) {
//           alert(validation.message);
//           return;
//         }
//       } else if (name === 'endDate' && newFormData.startDate) {
//         const validation = validateDates(newFormData.startDate, value);
//         if (!validation.isValid) {
//           alert(validation.message);
//           return;
//         }
//       }
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       [name]: value,
//       // Reset Line No when switching to project-wise view
//       ...(name === 'viewMode' && value === 'projectwise' && { lineNo: '' })
//     }));

//     // Hide charts and clear messages when form data changes
//     setShowCharts(false);
//     setNoDataMessage('');
//   };

//   const handleViewModeToggle = (mode) => {
//     setFormData(prev => ({
//       ...prev,
//       viewMode: mode,
//       // Reset Line No when switching to project-wise view
//       ...(mode === 'projectwise' && { lineNo: '' })
//     }));
    
//     // Hide charts and clear messages when view mode changes
//     setShowCharts(false);
//     setNoDataMessage('');
//   };

//   const validateForm = () => {
//     // Check if dates are selected
//     if (!formData.startDate || !formData.endDate) {
//       alert('Please select both start date and end date');
//       return false;
//     }

//     // Validate date range
//     const dateValidation = validateDates(formData.startDate, formData.endDate);
//     if (!dateValidation.isValid) {
//       alert(dateValidation.message);
//       return false;
//     }

//     // Check monitoring server
//     if (!formData.monitoringServer) {
//       alert('Please select a Monitoring Server');
//       return false;
//     }

//     // Check area
//     if (!formData.area) {
//       alert('Please select an Area');
//       return false;
//     }

//     // Check PCBA type
//     if (!formData.pcbaType) {
//       alert('Please select a PCBA Type');
//       return false;
//     }

//     // Validate required fields based on view mode
//     if (formData.viewMode === 'linewise' && !formData.lineNo) {
//       alert('Please select Line No for Line Wise view');
//       return false;
//     }
    
//     if (!formData.project) {
//       alert('Please select a Project');
//       return false;
//     }

//     return true;
//   };

//   const handleFind = () => {
//     console.log('Search with:', formData);
    
//     // Validate form before proceeding
//     if (!validateForm()) {
//       return;
//     }
    
//     // Hide previous results and clear messages
//     setShowCharts(false);
//     setNoDataMessage('');
    
//     // Load data
//     const fpyResult = GetFPYDatas(1);
//     const cpkResult = GetCPKData();
    
//     // Check if any data was found
//     const hasFpyData = fpyResult && fpyResult.length > 0;
//     const hasCpkData = cpkResult && cpkResult.length > 0;
    
//     if (hasFpyData || hasCpkData) {
//       setShowCharts(true);
//       setNoDataMessage('');
//     } else {
//       setShowCharts(false);
//       setNoDataMessage('No data found for selected criteria');
//     }
//   };

//   const handleReset = () => {
//     // Get current server from localStorage when resetting
//     const savedServerId = localStorage.getItem('server');
//     let serverName = 'RCP JAIPUR'; // default
    
//     if (savedServerId) {
//       const serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         serverName = serverInfo.name;
//       }
//     }
    
//     setFormData({
//       monitoringServer: serverName,
//       area: 'PCBA',
//       pcbaType: 'Main PCB',
//       lineNo: '',
//       project: '',
//       startDate: '',
//       endDate: '',
//       viewMode: 'linewise'
//     });
//     setShowCharts(false);
//     setFpyData(null);
//     setCpkData(null);
//     setCpkList([]);
//     setNoDataMessage('');
//   };

//   const lineNumbers = [
//     'RCP 01',
//     'RCP 02',
//     'RCP 03',
//     'RCP 04',
//     'RCP 05',
//     'PL01',
//     'PL02',
//     'PL03',
//     'PL04',
//     'PL05',
//     'PL06',
//   ];

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
//             </div>

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
//             </div>
//           </div>

//           <div className="form-row second-row">
//             <div className="form-group">
//               <label>View Mode</label>
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
//                 >
//                   <option value="">Select Line No</option>
//                   {lineNumbers.map(line => (
//                     <option key={line} value={line}>{line}</option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             <div className="form-group">
//               <label>Select Project <span style={{color: 'red'}}>*</span></label>
//               <select 
//                 name="project"
//                 value={formData.project}
//                 onChange={handleInputChange}
//                 className="select-input"
//                 required
//               >
//                 <option value="">Select Project</option>
//                 <option value="GJV95-1P4G">GJV95-1P4G</option>
//                 <option value="GJV95-3P4G">GJV95-3P4G</option>
//                 <option value="APQDAP-3">APQDAP-1</option>
//                 <option value="APQDAP-4">APQDAP-4</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-actions">
//             <button className="find-btn" onClick={handleFind}>
//               <span className="btn-icon">🔍</span>
//               Find Data
//             </button>
//             <button className="reset-btn" onClick={handleReset}>
//               <span className="btn-icon">🔄</span>
//               Reset
//             </button>
//           </div>
//         </div>

//         <div className="results-area">
//           <div className="results-header">
//             <h3>SMART METER PRODUCTION ANALYSIS</h3>
//             <div className="results-info">
//               <span className="info-tag">
//                 Mode: <strong>{formData.viewMode === 'linewise' ? 'Line Wise' : 'Project Wise'}</strong>
//               </span>
//               {formData.lineNo && formData.viewMode === 'linewise' && (
//                 <span className="info-tag">
//                   Line No: <strong>{formData.lineNo}</strong>
//                 </span>
//               )}
//               {formData.project && (
//                 <span className="info-tag">
//                   Project: <strong>{formData.project}</strong>
//                 </span>
//               )}
//               {formData.startDate && formData.endDate && (
//                 <span className="info-tag">
//                   Date: <strong>{formData.startDate}</strong> to <strong>{formData.endDate}</strong>
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* No Data Message */}
//           {noDataMessage && (
//             <div className="no-data-message" style={{
//               textAlign: 'center',
//               padding: '40px 20px',
//               fontSize: '18px',
//               color: '#666',
//               backgroundColor: '#f8f9fa',
//               border: '1px solid #dee2e6',
//               borderRadius: '8px',
//               margin: '20px 0'
//             }}>
//               <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
//               <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{noDataMessage}</div>
//               <div style={{ fontSize: '14px', color: '#999' }}>
//                 Please try different selection criteria or date range
//               </div>
//             </div>
//           )}

//           {/* Charts Container - Only show when showCharts is true */}
//           {showCharts && (
//             <div className="charts-container">
//               {fpyData && fpyData.length > 0 && (
//                 <div className="chart-block">
//                   <FPYChart data={fpyData} />
//                 </div>
//               )}

//               {cpkData && cpkData.length > 0 && (
//                 <div className="chart-block">
//                   <CPKChart data={cpkData} cpkList={cpkList} />
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

///second code
// import React, { useState, useEffect, useRef } from 'react';
// import './Dashboard.css';
// import FPYChart from '../charts/FPYChart';
// import CPKChart from '../charts/CPKChart';

// // Import JSON data
// import fpyDataJson from '../data/fpyData.json';
// import cpkDataJson from '../data/cpkData.json';

// const Dashboard = () => {
//   const [formData, setFormData] = useState({
//     monitoringServer: 'RCP JAIPUR',
//     area: 'PCBA',
//     pcbaType: 'Main PCB',
//     lineNo: '',
//     project: '',
//     startDate: '',
//     endDate: '',
//     viewMode: 'linewise' // 'linewise' or 'projectwise'
//   });

//   const [showResults, setShowResults] = useState(false); // New state to control results visibility
//   const [fpyData, setFpyData] = useState(null);
//   const [cpkData, setCpkData] = useState(null);
//   const [cpkList, setCpkList] = useState([]);
//   const [noDataMessage, setNoDataMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false); // Loading state

//   // Ref for auto-scroll to results
//   const resultsRef = useRef(null);

//   // Server info mapping (same as in Configuration component)
//   const ServerInfo = [
//     { id: 1, name: 'Genus RND - 192.10.10.4' },
//     { id: 2, name: 'RCP Jaipur - 10.141.61.40' },
//     { id: 3, name: 'HDR 1101 - 10.133.100.21' },
//     { id: 4, name: 'HDR 1100 - 10.134.1.21' },
//     { id: 5, name: 'HDR 1201 - 10.133.1.22' },
//     { id: 6, name: 'Guhawati - 10.161.1.22' },
//   ];

//   // Load server configuration from localStorage on component mount
//   useEffect(() => {
//     const savedServerId = localStorage.getItem('server');
//     if (savedServerId) {
//       const serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         setFormData(prev => ({
//           ...prev,
//           monitoringServer: serverInfo.name
//         }));
//       }
//     }
//   }, []);

//   // Auto-scroll function
//   const scrollToResults = () => {
//     if (resultsRef.current) {
//       resultsRef.current.scrollIntoView({ 
//         behavior: 'smooth', 
//         block: 'start',
//         inline: 'nearest'
//       });
//     }
//   };

//   // Date validation function
//   const validateDates = (startDate, endDate) => {
//     if (!startDate || !endDate) {
//       return { isValid: false, message: 'Please select both start date and end date' };
//     }
    
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const today = new Date();
    
//     // Remove time component for comparison
//     today.setHours(0, 0, 0, 0);
//     start.setHours(0, 0, 0, 0);
//     end.setHours(0, 0, 0, 0);
    
//     if (start > end) {
//       return { isValid: false, message: 'Start date should not be greater than end date' };
//     }
    
//     if (start > today) {
//       return { isValid: false, message: 'Start date cannot be in the future' };
//     }
    
//     if (end > today) {
//       return { isValid: false, message: 'End date cannot be in the future' };
//     }
    
//     return { isValid: true, message: '' };
//   };

//   // Function to get FPY data from JSON
//   const GetFPYDatas = (option) => {
//     try {
//       let data = null;
      
//       if (formData.viewMode === 'linewise') {
//         // Line Wise: area -> pcbaType -> lineNo -> project
//         if (formData.lineNo && formData.project) {
//           data = fpyDataJson[formData.area]?.[formData.pcbaType]?.[formData.lineNo]?.[formData.project];
//         }
//       } else if (formData.viewMode === 'projectwise') {
//         // Project Wise: area -> pcbaType -> project (skip lineNo)
//         if (formData.project) {
//           data = fpyDataJson[formData.area]?.[formData.pcbaType]?.[formData.project];
//         }
//       }
      
//       if (data && data.length > 0) {
//         setFpyData(data);
//         console.log('FPY Data loaded:', data);
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

//   // Function to get CPK data from JSON
//   const GetCPKData = () => {
//     try {
//       let data = null;
      
//       if (formData.viewMode === 'linewise') {
//         // Line Wise: area -> pcbaType -> lineNo -> project
//         if (formData.lineNo && formData.project) {
//           data = cpkDataJson[formData.area]?.[formData.pcbaType]?.[formData.lineNo]?.[formData.project];
//         }
//       } else if (formData.viewMode === 'projectwise') {
//         // Project Wise: area -> pcbaType -> project (skip lineNo)
//         if (formData.project) {
//           data = cpkDataJson[formData.area]?.[formData.pcbaType]?.[formData.project];
//         }
//       }
      
//       if (data && data.length > 0) {
//         setCpkData(data);
//         // Create CPK list with all parameters enabled by default
//         const cpkListData = data.map(() => ({ state: true }));
//         setCpkList(cpkListData);
//         console.log('CPK Data loaded:', data);
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

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
    
//     // Real-time date validation
//     if (name === 'startDate' || name === 'endDate') {
//       const newFormData = { ...formData, [name]: value };
      
//       if (name === 'startDate' && newFormData.endDate) {
//         const validation = validateDates(value, newFormData.endDate);
//         if (!validation.isValid) {
//           alert(validation.message);
//           return;
//         }
//       } else if (name === 'endDate' && newFormData.startDate) {
//         const validation = validateDates(newFormData.startDate, value);
//         if (!validation.isValid) {
//           alert(validation.message);
//           return;
//         }
//       }
//     }
    
//     setFormData(prev => ({
//       ...prev,
//       [name]: value,
//       // Reset Line No when switching to project-wise view
//       ...(name === 'viewMode' && value === 'projectwise' && { lineNo: '' })
//     }));

//     // Hide results when form data changes
//     setShowResults(false);
//     setNoDataMessage('');
//   };

//   const handleViewModeToggle = (mode) => {
//     setFormData(prev => ({
//       ...prev,
//       viewMode: mode,
//       // Reset Line No when switching to project-wise view
//       ...(mode === 'projectwise' && { lineNo: '' })
//     }));
    
//     // Hide results when view mode changes
//     setShowResults(false);
//     setNoDataMessage('');
//   };

//   const validateForm = () => {
//     // Check if dates are selected
//     if (!formData.startDate || !formData.endDate) {
//       alert('Please select both start date and end date');
//       return false;
//     }

//     // Validate date range
//     const dateValidation = validateDates(formData.startDate, formData.endDate);
//     if (!dateValidation.isValid) {
//       alert(dateValidation.message);
//       return false;
//     }

//     // Check monitoring server
//     if (!formData.monitoringServer) {
//       alert('Please select a Monitoring Server');
//       return false;
//     }

//     // Check area
//     if (!formData.area) {
//       alert('Please select an Area');
//       return false;
//     }

//     // Check PCBA type
//     if (!formData.pcbaType) {
//       alert('Please select a PCBA Type');
//       return false;
//     }

//     // Validate required fields based on view mode
//     if (formData.viewMode === 'linewise' && !formData.lineNo) {
//       alert('Please select Line No for Line Wise view');
//       return false;
//     }
    
//     if (!formData.project) {
//       alert('Please select a Project');
//       return false;
//     }

//     return true;
//   };

//   const handleFind = async () => {
//     console.log('Search with:', formData);
    
//     // Validate form before proceeding
//     if (!validateForm()) {
//       return;
//     }
    
//     // Show loading state
//     setIsLoading(true);
//     setShowResults(false);
//     setNoDataMessage('');
    
//     // Simulate API call delay for better UX
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     // Load data
//     const fpyResult = GetFPYDatas(1);
//     const cpkResult = GetCPKData();
    
//     // Check if any data was found
//     const hasFpyData = fpyResult && fpyResult.length > 0;
//     const hasCpkData = cpkResult && cpkResult.length > 0;
    
//     setIsLoading(false);
//     setShowResults(true); // Always show results container after search
    
//     if (hasFpyData || hasCpkData) {
//       setNoDataMessage('');
//     } else {
//       setNoDataMessage('No data found for selected criteria');
//     }
    
//     // Auto-scroll to results after a short delay
//     setTimeout(() => {
//       scrollToResults();
//     }, 100);
//   };

//   const handleReset = () => {
//     // Get current server from localStorage when resetting
//     const savedServerId = localStorage.getItem('server');
//     let serverName = 'RCP JAIPUR'; // default
    
//     if (savedServerId) {
//       const serverId = parseInt(savedServerId);
//       const serverInfo = ServerInfo.find(server => server.id === serverId);
//       if (serverInfo) {
//         serverName = serverInfo.name;
//       }
//     }
    
//     setFormData({
//       monitoringServer: serverName,
//       area: 'PCBA',
//       pcbaType: 'Main PCB',
//       lineNo: '',
//       project: '',
//       startDate: '',
//       endDate: '',
//       viewMode: 'linewise'
//     });
//     setShowResults(false); // Hide results on reset
//     setFpyData(null);
//     setCpkData(null);
//     setCpkList([]);
//     setNoDataMessage('');
//     setIsLoading(false);
//   };

//   const lineNumbers = [
//     'RCP 01',
//     'RCP 02',
//     'RCP 03',
//     'RCP 04',
//     'RCP 05',
//     'PL01',
//     'PL02',
//     'PL03',
//     'PL04',
//     'PL05',
//     'PL06',
//   ];

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
//             </div>

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
//             </div>
//           </div>

//           <div className="form-row second-row">
//             <div className="form-group">
//               <label>View Mode</label>
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
//                 >
//                   <option value="">Select Line No</option>
//                   {lineNumbers.map(line => (
//                     <option key={line} value={line}>{line}</option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             <div className="form-group">
//               <label>Select Project <span style={{color: 'red'}}>*</span></label>
//               <select 
//                 name="project"
//                 value={formData.project}
//                 onChange={handleInputChange}
//                 className="select-input"
//                 required
//               >
//                 <option value="">Select Project</option>
//                 <option value="GJV95-1P4G">GJV95-1P4G</option>
//                 <option value="GJV95-3P4G">GJV95-3P4G</option>
//                 <option value="APQDAP-3">APQDAP-1</option>
//                 <option value="APQDAP-4">APQDAP-4</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-actions">
//             <button 
//               className="find-btn" 
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

//         {/* Results Area - Only show when showResults is true */}
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
//                 <div style={{
//                   textAlign: 'center',
//                   padding: '60px 40px',
//                   fontSize: '18px',
//                   color: '#666'
//                 }}>
//                   <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
//                   <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Loading data...</div>
//                   <div style={{ fontSize: '14px', color: '#999' }}>
//                     Please wait while we fetch your results
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* No Data Message */}
//             {!isLoading && noDataMessage && (
//               <div className="no-data-message" style={{
//                 textAlign: 'center',
//                 padding: '40px 20px',
//                 fontSize: '18px',
//                 color: '#666',
//                 backgroundColor: '#f8f9fa',
//                 border: '1px solid #dee2e6',
//                 borderRadius: '8px',
//                 margin: '20px 0'
//               }}>
//                 <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
//                 <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{noDataMessage}</div>
//                 <div style={{ fontSize: '14px', color: '#999' }}>
//                   Please try different selection criteria or date range
//                 </div>
//               </div>
//             )}

//             {/* Charts Container - Only show when not loading and has data */}
//             {!isLoading && !noDataMessage && (fpyData?.length > 0 || cpkData?.length > 0) && (
//               <div className="charts-container">
//                 {fpyData && fpyData.length > 0 && (
//                   <div className="chart-block">
//                     <FPYChart data={fpyData} />
//                   </div>
//                 )}

//                 {cpkData && cpkData.length > 0 && (
//                   <div className="chart-block">
//                     <CPKChart data={cpkData} cpkList={cpkList} />
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

import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import FPYChart from '../charts/FPYChart';
import CPKChart from '../charts/CPKChart';

// Import JSON data
import fpyDataJson from '../data/fpyData.json';
import cpkDataJson from '../data/cpkData.json';

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

  // Ref for auto-scrolling to results
  const resultsRef = useRef(null);

  // Server info mapping (same as in Configuration component)
  const ServerInfo = [
    { id: 1, name: 'Genus RND - 192.10.10.4' },
    { id: 2, name: 'RCP Jaipur - 10.141.61.40' },
    { id: 3, name: 'HDR 1101 - 10.133.100.21' },
    { id: 4, name: 'HDR 1100 - 10.134.1.21' },
    { id: 5, name: 'HDR 1201 - 10.133.1.22' },
    { id: 6, name: 'Guhawati - 10.161.1.22' },
  ];

  // Load server configuration from localStorage on component mount
  useEffect(() => {
    const savedServerId = localStorage.getItem('server');
    if (savedServerId) {
      const serverId = parseInt(savedServerId);
      const serverInfo = ServerInfo.find(server => server.id === serverId);
      if (serverInfo) {
        setFormData(prev => ({
          ...prev,
          monitoringServer: serverInfo.name
        }));
      }
    }
  }, []);

  // Auto-scroll to results when they become visible
  useEffect(() => {
    if (showResults && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100); // Small delay to ensure the element is rendered
    }
  }, [showResults]);

  // Date validation function
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

  // Function to get FPY data from JSON
  const GetFPYDatas = (option) => {
    try {
      let data = null;
      
      if (formData.viewMode === 'linewise') {
        // Line Wise: area -> pcbaType -> lineNo -> project
        if (formData.lineNo && formData.project) {
          data = fpyDataJson[formData.area]?.[formData.pcbaType]?.[formData.lineNo]?.[formData.project];
        }
      } else if (formData.viewMode === 'projectwise') {
        // Project Wise: area -> pcbaType -> project (skip lineNo)
        if (formData.project) {
          data = fpyDataJson[formData.area]?.[formData.pcbaType]?.[formData.project];
        }
      }
      
      if (data && data.length > 0) {
        setFpyData(data);
        console.log('FPY Data loaded:', data);
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

  // Function to get CPK data from JSON
  const GetCPKData = () => {
    try {
      let data = null;
      
      if (formData.viewMode === 'linewise') {
        // Line Wise: area -> pcbaType -> lineNo -> project
        if (formData.lineNo && formData.project) {
          data = cpkDataJson[formData.area]?.[formData.pcbaType]?.[formData.lineNo]?.[formData.project];
        }
      } else if (formData.viewMode === 'projectwise') {
        // Project Wise: area -> pcbaType -> project (skip lineNo)
        if (formData.project) {
          data = cpkDataJson[formData.area]?.[formData.pcbaType]?.[formData.project];
        }
      }
      
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

  const handleViewModeToggle = (mode) => {
    setFormData(prev => ({
      ...prev,
      viewMode: mode,
      // Reset Line No when switching to project-wise view
      ...(mode === 'projectwise' && { lineNo: '' })
    }));
    
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

    // Check area
    if (!formData.area) {
      alert('Please select an Area');
      return false;
    }

    // Check PCBA type
    if (!formData.pcbaType) {
      alert('Please select a PCBA Type');
      return false;
    }

    // Validate required fields based on view mode
    if (formData.viewMode === 'linewise' && !formData.lineNo) {
      alert('Please select Line No for Line Wise view');
      return false;
    }
    
    if (!formData.project) {
      alert('Please select a Project');
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
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      // Load data
      const fpyResult = GetFPYDatas(1);
      const cpkResult = GetCPKData();
      
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
      
      setIsLoading(false);
    }, 1000); // 1 second loading delay
  };

  const handleReset = () => {
    // Get current server from localStorage when resetting
    const savedServerId = localStorage.getItem('server');
    let serverName = 'RCP JAIPUR'; // default
    
    if (savedServerId) {
      const serverId = parseInt(savedServerId);
      const serverInfo = ServerInfo.find(server => server.id === serverId);
      if (serverInfo) {
        serverName = serverInfo.name;
      }
    }
    
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

            <div className="form-group">
              <label>Select Project <span style={{color: 'red'}}>*</span></label>
              <select 
                name="project"
                value={formData.project}
                onChange={handleInputChange}
                className="select-input"
                required
              >
                <option value="">Select Project</option>
                <option value="GJV95-1P4G">GJV95-1P4G</option>
                <option value="GJV95-3P4G">GJV95-3P4G</option>
                <option value="APQDAP-3">APQDAP-1</option>
                <option value="APQDAP-4">APQDAP-4</option>
              </select>
            </div>
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
                    <FPYChart data={fpyData} />
                  </div>
                )}

                {cpkData && cpkData.length > 0 && (
                  <div className="chart-block">
                    <CPKChart data={cpkData} cpkList={cpkList} />
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