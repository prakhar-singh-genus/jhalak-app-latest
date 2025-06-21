import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { apiService, createCPKData } from '../services/apiService';

const CPKChart = ({ data, cpkList, serverId, startDate, endDate, selectedProject }) => {
  const [plotscatter, setScatterGraphStatus] = useState(false);
  const [pointvals, setPoints] = useState(null);
  const [lowerLimit, setLowerLimit] = useState(-25);
  const [upperLimit, setUpperLimit] = useState(25);
  const [name, setCPKName] = useState('');
  const [isLoadingScatter, setIsLoadingScatter] = useState(false);

  // Add validation for required props
  if (!serverId) {
    console.error('CPKChart: serverId is required but not provided');
    return <div>Error: Server ID is required</div>;
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div>No CPK data available</div>;
  }

  if (!cpkList || !Array.isArray(cpkList) || cpkList.length === 0) {
    return <div>No CPK list configuration available</div>;
  }

  const tempdataPoints = data.map((item, index) =>
    cpkList[index]?.state
      ? {
          name: item.parameterName,
          y: item.cpkValue,
          count: item.metercount,
          lowerLimit: item.lowerLimit,
          upperLimit: item.upperLimit,
        }
      : null
  );

  const dataPoints = tempdataPoints.filter(Boolean);

  if (dataPoints.length === 0) {
    return <div>No CPK parameters are enabled for display</div>;
  }

  const category = dataPoints.map(item => item.name);

  const handleBarClick = async function () {
    const paramName = this.name;
    console.log('🎯 CPK Bar clicked:', paramName);

    // Show loading state
    setIsLoadingScatter(true);
    setScatterGraphStatus(true);
    setCPKName(paramName);

    // Enhanced request data structure
    const requestData = {
      serverId: serverId,
      serverID: serverId, // Include both for compatibility
      projCode: selectedProject,
      project: selectedProject, // Include both for compatibility
      startDate: startDate,
      endDate: endDate,
      lineNo: null,
      paramName: paramName,
      viewMode: 'projectwise',
    };

    console.log('📊 CPK Scatter Request Data:', requestData);

    try {
      const apiPayload = createCPKData(requestData, paramName, 1); // Option 1 for scatter data
      console.log('📤 CPK API Payload:', apiPayload);

      const scatterResponse = await apiService.getScatteredData(apiPayload);
      console.log('📥 Scatter Response:', scatterResponse);

      if (scatterResponse && Array.isArray(scatterResponse) && scatterResponse.length > 0) {
        // Handle different response structures
        if (scatterResponse[0]?.config && scatterResponse[0]?.lstVal) {
          // Structure with config and lstVal
          const { config, lstVal } = scatterResponse[0];
          setLowerLimit(config?.lowerLimit ?? -25);
          setUpperLimit(config?.upperLimit ?? 25);
          setPoints(lstVal || []);
        } else if (scatterResponse[0]?.lowerLimit !== undefined) {
          // Direct structure with limits
          setLowerLimit(scatterResponse[0].lowerLimit ?? -25);
          setUpperLimit(scatterResponse[0].upperLimit ?? 25);
          setPoints(scatterResponse.map(item => item.value || item.y || item));
        } else {
          // Simple array of values
          setPoints(scatterResponse);
        }
      } else {
        console.warn('⚠️ No scatter data received');
        setPoints([]);
      }
    } catch (error) {
      console.error('❌ Error loading scatter data:', error);
      setPoints([]);
    } finally {
      setIsLoadingScatter(false);
    }
  };

  const optionsMain = {
    chart: {
      type: 'bar',
      height: 400,
    },
    title: {
      text: 'CPK Chart',
      align: 'left',
      style: {
        fontSize: '18px',
        fontWeight: 'bold'
      }
    },
    subtitle: {
      text: '📊 Click a bar to view scatter data',
      align: 'left',
      style: {
        fontSize: '14px',
        color: '#666'
      }
    },
    xAxis: {
      categories: category,
      title: { text: null },
      gridLineWidth: 1,
      lineWidth: 0,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yAxis: {
      min: 0,
      title: { 
        text: 'CPK Value', 
        align: 'high',
        style: {
          fontSize: '14px'
        }
      },
      labels: { 
        overflow: 'justify',
        style: {
          fontSize: '12px'
        }
      },
      gridLineWidth: 1,
      plotLines: [{
        color: 'red',
        dashStyle: 'dash',
        value: 1.67, // CPK acceptable limit
        width: 2,
        label: {
          text: 'CPK Target (1.67)',
          style: {
            color: 'red'
          }
        }
      }]
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.point.name}</b><br/>
                CPK Value: <b>${this.point.y.toFixed(3)}</b><br/>
                Count: <b>${this.point.count}</b><br/>
                Lower Limit: ${this.point.lowerLimit}<br/>
                Upper Limit: ${this.point.upperLimit}`;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ccc',
      borderRadius: 8,
      shadow: true
    },
    plotOptions: {
      bar: {
        point: {
          events: {
            click: handleBarClick,
          },
        },
        borderRadius: 3,
        dataLabels: {
          enabled: true,
          format: '{point.y:.2f}',
          style: {
            fontSize: '11px',
            fontWeight: 'bold'
          }
        },
        groupPadding: 0.1,
        colorByPoint: true,
        colors: [
          '#7CB342', '#FB8C00', '#E53935', '#8E24AA', '#00ACC1',
          '#FFB300', '#6D4C41', '#546E7A', '#D4E157', '#FF7043'
        ]
      },
    },
    legend: {
      enabled: false
    },
    credits: { enabled: false },
    series: [
      {
        name: 'CPK Values',
        data: dataPoints,
      },
    ],
  };

  // Enhanced scatter plot options
  const scatterOptions = {
    chart: {
      type: 'scatter',
      zoomType: 'xy',
      height: 500,
      backgroundColor: '#fafafa'
    },
    title: {
      text: `📈 Scatter Plot: ${name}`,
      style: {
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    subtitle: {
      text: `Parameter measurements over time • Total points: ${pointvals?.length || 0}`,
      style: {
        fontSize: '12px',
        color: '#666'
      }
    },
    xAxis: {
      title: { 
        text: 'Sample Index',
        style: { fontSize: '14px' }
      },
      gridLineWidth: 1,
      labels: {
        style: { fontSize: '12px' }
      }
    },
    yAxis: {
      title: { 
        text: 'Measured Value',
        style: { fontSize: '14px' }
      },
      min: lowerLimit * 0.95, // Add some padding
      max: upperLimit * 1.05,
      gridLineWidth: 1,
      labels: {
        style: { fontSize: '12px' }
      },
      plotLines: [
        {
          color: '#FF4444',
          dashStyle: 'dash',
          value: lowerLimit,
          width: 2,
          zIndex: 5,
          label: {
            text: `Lower Limit (${lowerLimit})`,
            align: 'right',
            style: {
              color: '#FF4444',
              fontSize: '11px'
            }
          }
        },
        {
          color: '#FF4444',
          dashStyle: 'dash',
          value: upperLimit,
          width: 2,
          zIndex: 5,
          label: {
            text: `Upper Limit (${upperLimit})`,
            align: 'right',
            style: {
              color: '#FF4444',
              fontSize: '11px'
            }
          }
        },
        {
          color: '#4CAF50',
          dashStyle: 'solid',
          value: (upperLimit + lowerLimit) / 2,
          width: 1,
          zIndex: 5,
          label: {
            text: 'Target',
            style: {
              color: '#4CAF50',
              fontSize: '11px'
            }
          }
        }
      ]
    },
    tooltip: {
      formatter: function () {
        const outOfSpec = this.point.y < lowerLimit || this.point.y > upperLimit;
        return `<b>Sample ${this.point.x}</b><br/>
                Value: <b>${this.point.y.toFixed(4)}</b><br/>
                Status: <span style="color: ${outOfSpec ? 'red' : 'green'}">
                  ${outOfSpec ? 'Out of Spec' : 'Within Spec'}
                </span>`;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ccc',
      borderRadius: 8,
      shadow: true
    },
    plotOptions: {
      scatter: {
        marker: {
          radius: 4,
          states: {
            hover: {
              enabled: true,
              lineColor: 'rgb(100,100,100)'
            }
          }
        },
        states: {
          hover: {
            marker: {
              enabled: false
            }
          }
        }
      }
    },
    series: [
      {
        name: name,
        color: function() {
          // Color points based on whether they're within spec
          return 'rgba(33, 150, 243, 0.7)'; // Default blue
        },
        data: pointvals?.map((val, i) => {
          const outOfSpec = val < lowerLimit || val > upperLimit;
          return {
            x: i + 1,
            y: val,
            color: outOfSpec ? 'rgba(244, 67, 54, 0.8)' : 'rgba(76, 175, 80, 0.7)'
          };
        }) || [],
        tooltip: {
          pointFormat: 'Sample {point.x}: <b>{point.y:.4f}</b>'
        }
      },
    ],
    legend: {
      enabled: false
    },
    credits: { enabled: false },
  };

  const closeScatterPlot = () => {
    setScatterGraphStatus(false);
    setPoints(null);
    setCPKName('');
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Main CPK Chart */}
      <div style={{ marginBottom: '20px' }}>
        <HighchartsReact highcharts={Highcharts} options={optionsMain} />
      </div>

      {/* Scatter Plot Modal/Section */}
      {plotscatter && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>
              🎯 Detailed Analysis: {name}
            </h3>
            <button 
              onClick={closeScatterPlot}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕ Close
            </button>
          </div>

          {isLoadingScatter ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: '#666'
            }}>
              <div>🔄 Loading scatter data...</div>
            </div>
          ) : pointvals && pointvals.length > 0 ? (
            <>
              <div style={{ 
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <strong>Statistics:</strong> {pointvals.length} samples • 
                Range: {Math.min(...pointvals).toFixed(4)} to {Math.max(...pointvals).toFixed(4)} • 
                Out of Spec: {pointvals.filter(val => val < lowerLimit || val > upperLimit).length} points
              </div>
              <HighchartsReact highcharts={Highcharts} options={scatterOptions} />
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: '#999'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
              <p>No scatter data available for <strong>{name}</strong></p>
              <p style={{ fontSize: '14px' }}>
                This could mean no measurement data exists for the selected time period.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CPKChart;
