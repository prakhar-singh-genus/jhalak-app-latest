import React, { useState, useRef } from 'react';
// import './CumulativeFPY.css'; // Removed to use Dashboard.css for consistent styling
import FPYChart from '../charts/FPYChart';
import { apiService } from '../services/apiService';

const getYearOptions = () => {
  // Return years 2025 to 2030 as single years
  const years = [];
  for (let y = 2025; y <= 2030; y++) {
    years.push(y);
  }
  return years;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const durationOptions = [
  { label: 'First Half', value: 'first' },
  { label: 'Second Half', value: 'second' }
];

const CumulativeFPY = () => {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [duration, setDuration] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fpyData, setFpyData] = useState(null);
  const [noDataMessage, setNoDataMessage] = useState('');
  const resultsRef = useRef(null);

  const handleFind = async () => {
    if (!year || !month || !duration) {
      alert('Please select Year, Month, and Duration.');
      return;
    }
    setIsLoading(true);
    setShowResults(true);
    setNoDataMessage('');
    // Calculate start and end date
    const [startYear] = year.split('-');
    const monthIndex = monthNames.indexOf(month);
    const startDate = duration === 'first'
      ? `${startYear}-${String(monthIndex + 1).padStart(2, '0')}-01`
      : `${startYear}-${String(monthIndex + 1).padStart(2, '0')}-16`;
    const endDate = (() => {
      if (duration === 'first') {
        return `${startYear}-${String(monthIndex + 1).padStart(2, '0')}-15`;
      } else {
        // Get last day of month
        const lastDay = new Date(startYear, monthIndex + 1, 0).getDate();
        return `${startYear}-${String(monthIndex + 1).padStart(2, '0')}-${lastDay}`;
      }
    })();
    try {
      const data = await apiService.getFPYData({
        startDate,
        endDate,
        Option: 3 // or whatever option is needed
      });
      setFpyData(data && data.length > 0 ? data : null);
      setNoDataMessage(data && data.length > 0 ? '' : 'No FPY data found for the selected period.');
    } catch (error) {
      setFpyData(null);
      setNoDataMessage('Error fetching FPY data.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleReset = () => {
    setYear('');
    setMonth('');
    setDuration('');
    setShowResults(false);
    setIsLoading(false);
    setFpyData(null);
    setNoDataMessage('');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="search-form">
          <h2 className="form-title">CUMULATIVE FPY</h2>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', marginBottom: '30px', alignItems: 'end' }}>
            <div className="form-group">
              <label>Year <span style={{ color: 'red' }}>*</span></label>
              <select value={year} onChange={e => setYear(e.target.value)} className="select-input" required>
                <option value="">Select Year</option>
                {getYearOptions().map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Month <span style={{ color: 'red' }}>*</span></label>
              <select value={month} onChange={e => setMonth(e.target.value)} className="select-input" required>
                <option value="">Select Month</option>
                {monthNames.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Duration <span style={{ color: 'red' }}>*</span></label>
              <select value={duration} onChange={e => setDuration(e.target.value)} className="select-input" required>
                <option value="">Select Duration</option>
                {durationOptions.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
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
        {showResults && (
          <div className="results-area" ref={resultsRef}>
            <div className="results-header">
              <h3>CUMULATIVE FPY ANALYSIS</h3>
              <div className="results-info">
                <span className="info-tag">Year: <strong>{year}</strong></span>
                <span className="info-tag">Month: <strong>{month}</strong></span>
                <span className="info-tag">Duration: <strong>{duration === 'first' ? 'First Half' : 'Second Half'}</strong></span>
              </div>
            </div>
            {isLoading && (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <div className="loading-text">Searching for data...</div>
              </div>
            )}
            {!isLoading && noDataMessage && (
              <div className="no-data-message">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{noDataMessage}</div>
              </div>
            )}
            {!isLoading && fpyData && (
              <div className="charts-container">
                <div className="chart-block">
                  <FPYChart
                    data={fpyData}
                    startDate={''}
                    endDate={''}
                    Option={3}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CumulativeFPY;
