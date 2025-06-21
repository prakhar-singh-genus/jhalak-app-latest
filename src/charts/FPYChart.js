import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { apiService } from '../services/apiService';
import ParetoChart from './ParetoChart'; // ✅ Import ParetoChart component

const FPYChart = ({ 
  data, 
  serverID,
  startDate, 
  endDate, 
  projCode,
  Option = 1,
  lineNo = null 
}) => {
  const [stageName, setStageName] = useState(null);
  const [paretoData, setParetoData] = useState(null);
  const [showPareto, setShowPareto] = useState(false); // ✅ Add state to control Pareto visibility

  // ✅ ENHANCED: Better debugging and validation
  useEffect(() => {
    console.log('=== FPY Chart Debug Info ===');
    console.log('Props received:', { 
      data: data ? `Array with ${data.length} items` : 'null/undefined',
      serverID, 
      startDate, 
      endDate, 
      projCode, 
      Option, 
      lineNo 
    });
    
    if (data && data.length > 0) {
      console.log('First data item:', data[0]);
      console.log('Data structure check:');
      data.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          stageName: item.stageName || 'Missing',
          stageID: item.stageID || 'Missing', 
          passCount: item.passCount || 0,
          failCount: item.failCount || 0,
          hasRequiredFields: item.hasOwnProperty('passCount') && item.hasOwnProperty('failCount')
        });
      });
    }
    console.log('=== End Debug Info ===');
  }, [data, serverID, startDate, endDate, projCode, Option, lineNo]);

  // ✅ ENHANCED: Better validation with specific error messages
  if (!serverID) {
    console.error('FPY Chart - Missing serverID prop');
    return <div style={{padding: '20px', border: '1px solid #ff0000', color: '#ff0000'}}>
      Error: Missing server configuration for FPY Chart
    </div>;
  }

  if (!projCode) {
    console.error('FPY Chart - Missing projCode prop');
    return <div style={{padding: '20px', border: '1px solid #ff0000', color: '#ff0000'}}>
      Error: Missing project configuration for FPY Chart
    </div>;
  }

  if (!startDate || !endDate) {
    console.error('FPY Chart - Missing date range props');
    return <div style={{padding: '20px', border: '1px solid #ff0000', color: '#ff0000'}}>
      Error: Missing date range for FPY Chart
    </div>;
  }

  if (!data) {
    console.log('FPY Chart - No data provided');
    return <div style={{padding: '20px', border: '1px solid #ffa500', color: '#ffa500'}}>
      No data provided for FPY Chart
    </div>;
  }

  if (!Array.isArray(data)) {
    console.log('FPY Chart - Data is not an array:', typeof data, data);
    return <div style={{padding: '20px', border: '1px solid #ff0000', color: '#ff0000'}}>
      Error: Invalid data format for FPY Chart (expected array, got {typeof data})
    </div>;
  }

  if (data.length === 0) {
    console.log('FPY Chart - Empty data array');
    return <div style={{padding: '20px', border: '1px solid #0066cc', color: '#0066cc'}}>
      No data available for FPY Chart (empty array)
    </div>;
  }

  // ✅ ENHANCED: Better data processing with more detailed logging
  const dataPoints = data.map((item, index) => {
    console.log(`Processing FPY item ${index}:`, item);
    
    // ✅ FLEXIBLE: Handle different possible field names
    const passCount = Number(item.passCount || item.PassCount || item.pass || 0);
    const failCount = Number(item.failCount || item.FailCount || item.fail || 0);
    const stageName = item.stageName || item.StageName || item.stage || `Stage ${index + 1}`;
    const stageID = item.stageID || item.StageID || item.id || index;
    
    const totalCount = passCount + failCount;
    
    if (totalCount === 0) {
      console.warn(`FPY Chart - Zero total count for item ${index}:`, item);
      return {
        name: stageName,
        id: stageID,
        y: 0,
        drilldown: stageName,
        header: `[Pass:${passCount} Fail:${failCount}]`,
        color: '#ff0000' // Red for zero values
      };
    }

    const fpyPercentage = (passCount / totalCount) * 100;
    
    return {
      name: stageName,
      id: stageID,
      y: fpyPercentage,
      drilldown: stageName,
      header: `[Pass:${passCount} Fail:${failCount}]`,
      color: fpyPercentage >= 95 ? '#28a745' : fpyPercentage >= 80 ? '#ffc107' : '#dc3545'
    };
  }).filter(Boolean);

  console.log('FPY Chart - Final processed data points:', dataPoints);

  if (dataPoints.length === 0) {
    console.log('FPY Chart - No valid data points after processing');
    return <div style={{padding: '20px', border: '1px solid #ff0000', color: '#ff0000'}}>
      Error: No valid data points found in FPY data
    </div>;
  }

  // ✅ ENHANCED: Better Pareto data fetch with loading state
  const fetchParetoData = async (stageID, stageName) => {
    console.log('FPY Chart - Fetching Pareto data for stage:', stageID, stageName);
    
    // Show loading state
    setStageName(stageName);
    setParetoData(null);
    setShowPareto(true);
    
    try {
      const requestData = {
        serverID: serverID,
        projCode: projCode,
        stage: stageID,
        startDate: startDate,
        endDate: endDate,
        Option: 2  // Pareto option
      };

      console.log('FPY Chart - Pareto request data:', requestData);

      const paretoResponse = await apiService.getParetoData(requestData);
      console.log('FPY Chart - Pareto response:', paretoResponse);
      
      if (paretoResponse && paretoResponse.length > 0) {
        setParetoData(paretoResponse);
      } else {
        setParetoData([]);
        console.log('FPY Chart - No Pareto data found for stage:', stageName);
      }
    } catch (error) {
      console.error('FPY Chart - Error fetching Pareto data:', error);
      setParetoData([]);
    }
  };

  // ✅ ADD: Function to close Pareto chart
  const closeParetoChart = () => {
    setShowPareto(false);
    setParetoData(null);
    setStageName(null);
  };

  const optionsMain = {
    chart: { 
      type: 'column',
      height: 400
    },
    title: { 
      align: 'left', 
      text: 'First Pass Yield (FPY) Analysis' 
    },
    subtitle: { 
      align: 'left', 
      text: 'Click columns to view detailed failure analysis (Pareto)' 
    },
    xAxis: { 
      type: 'category',
      labels: {
        rotation: -45,
        style: {
          fontSize: '11px'
        }
      }
    },
    yAxis: { 
      title: { text: 'First Pass Yield (%)' },
      min: 0,
      max: 100,
      plotLines: [{
        value: 95,
        color: '#28a745',
        dashStyle: 'dash',
        width: 2,
        label: {
          text: 'Target: 95%',
          align: 'right'
        }
      }]
    },
    legend: { enabled: false },
    plotOptions: {
      column: {
        point: {
          events: {
            click: function () {
              console.log('FPY Chart - Column clicked:', this.name, this.options.id);
              fetchParetoData(this.options.id, this.name);
            }
          }
        },
        cursor: 'pointer',
        borderWidth: 1,
        borderColor: '#000000'
      },
      series: {
        dataLabels: { 
          enabled: true, 
          format: '{point.y:.1f}%',
          style: {
            fontWeight: 'bold'
          }
        }
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">{point.name} {point.header}</span>: <b>{point.y:.2f}%</b><br/>Click for detailed analysis'
    },
    series: [{
      name: 'FPY',
      colorByPoint: false,
      data: dataPoints
    }]
  };

  return (
    <div style={{ width: '100%' }}>
      {/* ✅ FPY Chart */}
      <HighchartsReact 
        highcharts={Highcharts} 
        options={optionsMain} 
        containerProps={{ style: { height: '400px', width: '100%' } }}
      />
      
      {/* ✅ Pareto Chart Section */}
      {showPareto && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h4 style={{color: '#333', margin: '0'}}>
              Failure Analysis (Pareto) for: {stageName}
            </h4>
            <button 
              onClick={closeParetoChart}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
          
          {/* ✅ Show loading state while fetching */}
          {paretoData === null ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
              fontStyle: 'italic'
            }}>
              Loading Pareto data for {stageName}...
            </div>
          ) : paretoData.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
              fontStyle: 'italic'
            }}>
              No failure data available for {stageName}
            </div>
          ) : (
            <ParetoChart 
              ParetoData={paretoData} 
              stageName={stageName} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FPYChart;