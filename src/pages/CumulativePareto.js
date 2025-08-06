import React, { useState, useRef } from 'react';
import './CumulativePareto.css';
// import ParetoChart from '../charts/ParetoChart'; // Uncomment when you have the chart

const ServerInfo = [
  { id: 1, name: 'Genus RND Server'},
  { id: 2, name: 'RCP Jaipur Server'},
  { id: 3, name: 'HDR 1101 Server'},
  { id: 4, name: 'HDR 3000 Server'},
  { id: 5, name: 'HDR 1100 Server'},
  { id: 6, name: 'Guhawati Server'},
];

const meterTypes = [
  { label: '1P Smart Meter', value: '1P' },
  { label: '3P Smart Meter', value: '3P' },
  { label: 'Non Smart', value: 'NonSmart' }
];

const CumulativePareto = () => {
  const [server, setServer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [meterType, setMeterType] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [paretoData, setParetoData] = useState(null); // Uncomment when you have data
  // const [noDataMessage, setNoDataMessage] = useState('');
  const resultsRef = useRef(null);

  const handleFind = async () => {
    if (!server || !startDate || !endDate || !meterType) {
      alert('Please select all fields.');
      return;
    }
    setIsLoading(true);
    setShowResults(true);
    // setNoDataMessage('');
    // TODO: Add API call logic here
    setTimeout(() => {
      setIsLoading(false);
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleReset = () => {
    setServer('');
    setStartDate('');
    setEndDate('');
    setMeterType('');
    setShowResults(false);
    setIsLoading(false);
    // setParetoData(null);
    // setNoDataMessage('');
  };

  return (
    <div className="cumulative-pareto">
      <div className="cumulative-pareto-content">
        <div className="search-form">
          <h2 className="form-title">CUMULATIVE PARETO</h2>
          <div className="form-row first-row">
            <div className="form-group">
              <label>Plant Server <span style={{ color: 'red' }}>*</span></label>
              <select value={server} onChange={e => setServer(e.target.value)} className="select-input" required>
                <option value="">Select Server</option>
                {ServerInfo.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Start Date <span style={{ color: 'red' }}>*</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="select-input date-input" required />
            </div>
            <div className="form-group">
              <label>End Date <span style={{ color: 'red' }}>*</span></label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="select-input date-input" required min={startDate} />
            </div>
          </div>
          <div className="form-row second-row">
            <div className="form-group">
              <label>Meter Type <span style={{ color: 'red' }}>*</span></label>
              <select value={meterType} onChange={e => setMeterType(e.target.value)} className="select-input" required>
                <option value="">Select Meter Type</option>
                {meterTypes.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row third-row">
            <div className="form-actions">
              <button className={`find-btn ${isLoading ? 'loading' : ''}`} onClick={handleFind} disabled={isLoading}>
                <span className="btn-icon">{isLoading ? '⏳' : '🔍'}</span>
                {isLoading ? 'Searching...' : 'Find Data'}
              </button>
              <button className="reset-btn" onClick={handleReset} disabled={isLoading}>
                <span className="btn-icon">🔄</span>Reset
              </button>
            </div>
          </div>
        </div>
        {showResults && (
          <div className="results-area" ref={resultsRef}>
            <div className="results-header">
              <h3>CUMULATIVE PARETO ANALYSIS</h3>
              <div className="results-info">
                <span className="info-tag">Server: <strong>{ServerInfo.find(s => s.id === Number(server))?.name || ''}</strong></span>
                <span className="info-tag">Start Date: <strong>{startDate}</strong></span>
                <span className="info-tag">End Date: <strong>{endDate}</strong></span>
                <span className="info-tag">Meter Type: <strong>{meterTypes.find(m => m.value === meterType)?.label || ''}</strong></span>
              </div>
            </div>
            {isLoading && (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <div className="loading-text">Searching for data...</div>
              </div>
            )}
            {/* Uncomment and use when you have data and chart */}
            {/*
            {!isLoading && noDataMessage && (
              <div className="no-data-message">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{noDataMessage}</div>
              </div>
            )}
            {!isLoading && paretoData && (
              <div className="charts-container">
                <div className="chart-block">
                  <ParetoChart
                    data={paretoData}
                    startDate={startDate}
                    endDate={endDate}
                    meterType={meterType}
                  />
                </div>
              </div>
            )}
            */}
          </div>
        )}
      </div>
    </div>
  );
};

export default CumulativePareto;
