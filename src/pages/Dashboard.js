import React, { useState, useEffect } from 'react';
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
    project: 'GJV95-1P4G',
    startDate: '',
    endDate: ''
  });

  const [showCharts, setShowCharts] = useState(false);
  const [fpyData, setFpyData] = useState(null);
  const [cpkData, setCpkData] = useState(null);
  const [cpkList, setCpkList] = useState([]);

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

  // Function to get FPY data from JSON
  const GetFPYDatas = (option) => {
    try {
      let data = null;
      
      if (formData.area === 'PCBA') {
        // For PCBA, we need area -> pcbaType -> lineNo -> project
        if (formData.pcbaType && formData.lineNo && formData.project) {
          data = fpyDataJson[formData.area]?.[formData.pcbaType]?.[formData.lineNo]?.[formData.project];
        }
      } else if (formData.area === 'EMA') {
        // For EMA, we need area -> project
        if (formData.project) {
          data = fpyDataJson[formData.area]?.[formData.project];
        }
      }
      
      if (data) {
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
      
      if (formData.area === 'PCBA') {
        // For PCBA, we need area -> pcbaType -> lineNo -> project
        if (formData.pcbaType && formData.lineNo && formData.project) {
          data = cpkDataJson[formData.area]?.[formData.pcbaType]?.[formData.lineNo]?.[formData.project];
        }
      } else if (formData.area === 'EMA') {
        // For EMA, we need area -> project
        if (formData.project) {
          data = cpkDataJson[formData.area]?.[formData.project];
        }
      }
      
      if (data) {
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset PCBA Type and Line No when area changes to EMA
      ...(name === 'area' && value === 'EMA' && { pcbaType: '', lineNo: '' })
    }));
  };

  const handleFind = () => {
    console.log('Search with:', formData);
    
    // Validate required fields
    if (formData.area === 'PCBA' && (!formData.pcbaType || !formData.lineNo)) {
      alert('Please select PCBA Type and Line No for PCBA area');
      return;
    }
    
    if (!formData.project) {
      alert('Please select a Project');
      return;
    }
    
    // Load data and show charts
    const fpyResult = GetFPYDatas(1);
    const cpkResult = GetCPKData();
    
    if (fpyResult || cpkResult) {
      setShowCharts(true);
    } else {
      alert('No data found for the selected parameters');
      setShowCharts(false);
    }
  };

  const pcbaTypes = [
    'Main PCB',
    'BLE',
    'RF',
  ];

  const lineNumbers = [
    'RCP 01',
    'RCP 02',
    'RCP 03',
    'RCP 04',
    'RCP 05',
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="search-form">
          <h2 className="form-title">Smart Meter Production Analysis</h2>
          
          <div className="form-row">
            <div className="form-group full-width">
              <label>Monitoring Server:</label>
              <input 
                type="text" 
                name="monitoringServer"
                value={formData.monitoringServer}
                onChange={handleInputChange}
                readOnly
                className="readonly-input"
              />
            </div>
          </div>

          <div className="form-row three-column">
            <div className="form-group">
              <label>Select Area:</label>
              <select 
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="select-input"
              >
                <option value="PCBA">PCBA</option>
                <option value="EMA">EMA</option>
              </select>
            </div>

            <div className="form-group">
              <label>Select PCBA Types:</label>
              <select 
                name="pcbaType"
                value={formData.pcbaType}
                onChange={handleInputChange}
                disabled={formData.area === 'EMA'}
                className={`select-input ${formData.area === 'EMA' ? 'disabled-select' : ''}`}
              >
                <option value="">Select PCBA Type</option>
                {pcbaTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {formData.area === 'EMA' && (
                <span className="disabled-note">Not available for EMA</span>
              )}
            </div>

            <div className="form-group">
              <label>Select Line No:</label>
              <select 
                name="lineNo"
                value={formData.lineNo}
                onChange={handleInputChange}
                disabled={formData.area === 'EMA'}
                className={`select-input ${formData.area === 'EMA' ? 'disabled-select' : ''}`}
              >
                <option value="">Select Line No</option>
                {lineNumbers.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
              {formData.area === 'EMA' && (
                <span className="disabled-note">Not available for EMA</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group date-group">
              <div className="date-inputs">
                <div className="date-field">
                  <label>Start Date:</label>
                  <input 
                    type="date" 
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="date-input"
                  />
                </div>
                <div className="date-field">
                  <label>End Date:</label>
                  <input 
                    type="date" 
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="date-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Select Project:</label>
              <select 
                name="project"
                value={formData.project}
                onChange={handleInputChange}
                className="select-input"
              >
                <option value="GJV95-1P4G">GJV95-1P4G</option>
                <option value="GJV95-3P4G">GJV95-3P4G</option>
                <option value="APQDAP-3">APQDAP-1</option>
                <option value="APQDAP-4">APQDAP-4</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button className="find-btn" onClick={handleFind}>
              <span className="btn-icon">🔍</span>
              Find Data
            </button>
            <button className="reset-btn" onClick={() => {
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
                project: 'GJV95-1P4G',
                startDate: '',
                endDate: ''
              });
              setShowCharts(false);
              setFpyData(null);
              setCpkData(null);
              setCpkList([]);
            }}>
              <span className="btn-icon">🔄</span>
              Reset
            </button>
          </div>
        </div>

        <div className="results-area">
          <div className="results-header">
            <h3>Search Results</h3>
            <div className="results-info">
              {formData.area && (
                <span className="info-tag">
                  Area: <strong>{formData.area}</strong>
                </span>
              )}
              {formData.pcbaType && formData.area === 'PCBA' && (
                <span className="info-tag">
                  Type: <strong>{formData.pcbaType}</strong>
                </span>
              )}
              {formData.lineNo && formData.area === 'PCBA' && (
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

          {showCharts && (
            <div className="charts-container">
              {fpyData && fpyData.length > 0 && (
                <div className="chart-block">
                  <h4>FPY Chart</h4>
                  <FPYChart data={fpyData} />
                </div>
              )}

              {cpkData && cpkData.length > 0 && (
                <div className="chart-block">
                  <h4>CPK Chart</h4>
                  <CPKChart data={cpkData} cpkList={cpkList} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
