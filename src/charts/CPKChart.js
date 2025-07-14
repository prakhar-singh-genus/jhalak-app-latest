import React, { useState, useMemo, useCallback, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { apiService, createCPKData } from "../services/apiService";

import boost from "highcharts/modules/boost";
if (typeof boost === "function") {
  boost(Highcharts);
}

const MAX_POINTS = 10000;

const CPKChart = ({ serverId, startDate, endDate, projCode }) => {
  // =========================
  // ✅ State Declarations
  // =========================
  const [plotscatter, setScatterGraphStatus] = useState(false);
  const [pointvals, setPoints] = useState([]);
  const [lowerLimit, setLowerLimit] = useState(-25);
  const [upperLimit, setUpperLimit] = useState(25);
  const [name, setCPKName] = useState("");
  const [isLoadingScatter, setIsLoadingScatter] = useState(false);
  const [isCalculatingCPK, setIsCalculatingCPK] = useState(false);
  const [cpkCalculationData, setCpkCalculationData] = useState([]);
  const [isLoadingCPKData, setIsLoadingCPKData] = useState(false);
  const [cpkParameterData, setCpkParameterData] = useState([]);
  const [apiError, setApiError] = useState(null);

  // =========================
  // ✅ FIXED: Enhanced CPK Parameter Data Fetching
  // =========================
  useEffect(() => {
    const fetchCPKParameterData = async () => {
      if (!serverId || !projCode || !startDate || !endDate) {
        console.warn('Missing required parameters for CPK parameter data');
        return;
      }

      console.log(`📊 Fetching CPK parameter data for server ${serverId}...`);
      setIsLoadingCPKData(true);
      setApiError(null);

      try {
        const cpkRequestData = {
          serverID: Number(serverId),
          projCode: String(projCode),
          startDate: startDate,
          endDate: endDate,
          Option: 1, // Option 1 for getting CPK parameter info
          paramName: "0" // Default parameter name
        };

        console.log('📤 CPK Parameter Data Request:', cpkRequestData);
        
        const cpkParamResults = await apiService.getCPKData(cpkRequestData);
        
        // 🔧 FIXED: Better error handling and response validation
        if (cpkParamResults) {
          if (Array.isArray(cpkParamResults) && cpkParamResults.length > 0) {
            console.log(`✅ CPK Parameter Data Results for server ${serverId}:`, cpkParamResults);
            setCpkParameterData(cpkParamResults);
          } else if (cpkParamResults.length === 0) {
            console.warn(`⚠️ No CPK parameter data found for server ${serverId}`);
            setCpkParameterData([]);
          } else {
            console.warn(`⚠️ Unexpected CPK parameter data format for server ${serverId}:`, cpkParamResults);
            setCpkParameterData([]);
          }
        } else {
          console.warn(`⚠️ No CPK parameter data received for server ${serverId}`);
          setCpkParameterData([]);
        }
      } catch (error) {
        console.error(`❌ Error fetching CPK parameter data for server ${serverId}:`, error);
        setApiError(`Failed to fetch CPK parameters: ${error.message}`);
        setCpkParameterData([]);
      } finally {
        setIsLoadingCPKData(false);
      }
    };

    fetchCPKParameterData();
  }, [serverId, projCode, startDate, endDate]);

  // =========================
  // ✅ FIXED: Enhanced CPK Calculation with Better Error Handling
  // =========================
  useEffect(() => {
    const calculateCPKValues = async () => {
      if (!serverId || !projCode || !startDate || !endDate) {
        console.warn('Missing required parameters for CPK calculation');
        return;
      }

      console.log(`🧮 Starting CPK calculation for server ${serverId}...`);
      setIsCalculatingCPK(true);
      setApiError(null);

      try {
        const cpkRequestData = {
          serverID: Number(serverId),
          projCode: String(projCode),
          startDate: startDate,
          endDate: endDate
        };

        console.log(`📊 CPK Calculation Request for server ${serverId}:`, cpkRequestData);
        
        const cpkResults = await apiService.calculateCPK(cpkRequestData);
        
        // 🔧 FIXED: Better handling of different server response formats
        if (cpkResults) {
          if (Array.isArray(cpkResults) && cpkResults.length > 0) {
            console.log(`✅ CPK Calculation Results for server ${serverId}:`, cpkResults);
            setCpkCalculationData(cpkResults);
          } else if (Array.isArray(cpkResults) && cpkResults.length === 0) {
            console.warn(`⚠️ No CPK calculation results for server ${serverId} - empty array`);
            setCpkCalculationData([]);
          } else {
            console.warn(`⚠️ Unexpected CPK calculation format for server ${serverId}:`, cpkResults);
            setCpkCalculationData([]);
          }
        } else {
          console.warn(`⚠️ No CPK calculation results received for server ${serverId}`);
          setCpkCalculationData([]);
        }
      } catch (error) {
        console.error(`❌ Error calculating CPK for server ${serverId}:`, error);
        setApiError(`Failed to calculate CPK: ${error.message}`);
        setCpkCalculationData([]);
      } finally {
        setIsCalculatingCPK(false);
      }
    };

    // 🔧 FIXED: Only calculate if we have the required data
    // Remove dependency on cpkParameterData to avoid blocking
    if (serverId && projCode && startDate && endDate) {
      calculateCPKValues();
    }
  }, [serverId, projCode, startDate, endDate]);

  // =========================
  // ✅ FIXED: Enhanced Data Points with Fallback Logic
  // =========================
  const dataPoints = useMemo(() => {
    console.log(`🔍 Creating data points for server ${serverId}...`);
    console.log('  - cpkCalculationData:', cpkCalculationData.length);
    console.log('  - cpkParameterData:', cpkParameterData.length);
    
    if (!Array.isArray(cpkCalculationData) || cpkCalculationData.length === 0) {
      console.warn(`⚠️ No CPK calculation data available for server ${serverId}`);
      return [];
    }

    // 🔧 FIXED: Enhanced data point creation with better field mapping
    const points = cpkCalculationData.map((item, index) => {
      // Handle different possible field names from different servers
      const paramName = item.ParameterName || 
                       item.parameterName || 
                       item.ParamName || 
                       item.paramName || 
                       item.Name || 
                       item.name || 
                       `Parameter ${index + 1}`;
      
      const cpkValue = item.CPKValue || 
                      item.cpkValue || 
                      item.CPK || 
                      item.cpk || 
                      item.Value || 
                      item.value || 
                      0;
      
      const lowerLimit = item.LowerLimit || 
                        item.lowerLimit || 
                        item.LSL || 
                        item.lsl || 
                        item.Lower || 
                        item.lower || 
                        -25;
      
      const upperLimit = item.UpperLimit || 
                        item.upperLimit || 
                        item.USL || 
                        item.usl || 
                        item.Upper || 
                        item.upper || 
                        25;
      
      const mean = item.Mean || 
                  item.mean || 
                  item.Average || 
                  item.average || 
                  item.Avg || 
                  item.avg || 
                  0;
      
      const stdDev = item.StandardDeviation || 
                    item.standardDeviation || 
                    item.StdDev || 
                    item.stdDev || 
                    item.Sigma || 
                    item.sigma || 
                    0;
      
      const count = item.Count || 
                   item.count || 
                   item.SampleSize || 
                   item.sampleSize || 
                   item.N || 
                   item.n || 
                   0;
      
      return {
        name: paramName,
        y: parseFloat(cpkValue) || 0,
        count: parseInt(count) || 0,
        lowerLimit: parseFloat(lowerLimit) || -25,
        upperLimit: parseFloat(upperLimit) || 25,
        mean: parseFloat(mean) || 0,
        standardDeviation: parseFloat(stdDev) || 0,
        id: item.ID || item.id || item.ParameterID || item.parameterId || index,
        enabled: true,
        serverID: serverId // Add server ID for debugging
      };
    });

    console.log(`✅ Created ${points.length} data points for server ${serverId}`);
    return points;
  }, [cpkCalculationData, serverId]);

  const category = useMemo(() => dataPoints.map((item) => item.name), [dataPoints]);

  // =========================
  // ✅ Statistics Calculation (unchanged)
  // =========================
  const statistics = useMemo(() => {
    if (!Array.isArray(pointvals) || pointvals.length === 0) return null;

    const nums = pointvals
      .map((val) => (typeof val === "string" ? parseFloat(val) : val))
      .filter((n) => !isNaN(n));

    if (nums.length === 0) return null;

    const outOfSpec = nums.filter((val) => val < lowerLimit || val > upperLimit).length;
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length;
    const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / nums.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: nums.length,
      min: Math.min(...nums),
      max: Math.max(...nums),
      mean: mean,
      stdDev: stdDev,
      outOfSpec,
    };
  }, [pointvals, lowerLimit, upperLimit]);

  // =========================
  // ✅ FIXED: Enhanced Refresh Function
  // =========================
  const refreshCPKCalculation = useCallback(async () => {
    if (!serverId || !projCode || !startDate || !endDate) return;

    console.log(`🔄 Refreshing CPK calculation for server ${serverId}...`);
    setIsCalculatingCPK(true);
    setApiError(null);

    try {
      const cpkRequestData = {
        serverID: Number(serverId),
        projCode: String(projCode),
        startDate: startDate,
        endDate: endDate
      };

      const cpkResults = await apiService.calculateCPK(cpkRequestData);
      
      if (cpkResults && Array.isArray(cpkResults)) {
        setCpkCalculationData(cpkResults);
        console.log(`🔄 CPK values refreshed successfully for server ${serverId}`);
      } else {
        console.warn(`⚠️ No CPK data received during refresh for server ${serverId}`);
        setCpkCalculationData([]);
      }
    } catch (error) {
      console.error(`❌ Error refreshing CPK for server ${serverId}:`, error);
      setApiError(`Refresh failed: ${error.message}`);
    } finally {
      setIsCalculatingCPK(false);
    }
  }, [serverId, projCode, startDate, endDate]);

  // =========================
  // ✅ FIXED: Enhanced Bar Click Handler with Better Error Handling
  // =========================
  const handleBarClick = useCallback(
    async function () {
      const paramName = this.name;
      const point = this.options;
      
      console.log(`🎯 CPK Bar clicked for server ${serverId}:`, paramName);
      console.log('🔍 Point data:', point);

      setIsLoadingScatter(true);
      setScatterGraphStatus(true);
      setCPKName(paramName);
      setApiError(null);
      
      // Set limits from the clicked point
      setLowerLimit(point.lowerLimit || -25);
      setUpperLimit(point.upperLimit || 25);

      // 🔧 FIXED: Enhanced request structure with server-specific handling
      const requestData = {
        serverId: serverId,
        serverID: serverId,
        projCode: projCode,
        project: projCode,
        startDate: startDate,
        endDate: endDate,
        lineNo: null,
        paramName: paramName,
        viewMode: 'projectwise',
      };

      console.log(`📊 CPK Scatter Request Data for server ${serverId}:`, requestData);

      try {
        const apiPayload = createCPKData(requestData, paramName, 1);
        console.log(`📤 CPK Scatter API Payload for server ${serverId}:`, apiPayload);

        const scatterResponse = await apiService.getScatteredData(apiPayload);
        console.log(`📥 Scatter Response for server ${serverId}:`, scatterResponse);

        if (scatterResponse) {
          let lstVal = [];
          let lowerLimitValue = point.lowerLimit || -25;
          let upperLimitValue = point.upperLimit || 25;

          // 🔧 FIXED: Enhanced response handling for different server formats
          if (scatterResponse.config && scatterResponse.lstVal !== undefined) {
            lstVal = scatterResponse.lstVal;
            lowerLimitValue = scatterResponse.config?.lowerLimit ?? lowerLimitValue;
            upperLimitValue = scatterResponse.config?.upperLimit ?? upperLimitValue;
          } else if (scatterResponse[0]?.config && scatterResponse[0]?.lstVal) {
            const { config, lstVal: responseData } = scatterResponse[0];
            lstVal = responseData || [];
            lowerLimitValue = config?.lowerLimit ?? lowerLimitValue;
            upperLimitValue = config?.upperLimit ?? upperLimitValue;
          } else if (scatterResponse[0]?.lowerLimit !== undefined) {
            lowerLimitValue = scatterResponse[0].lowerLimit ?? lowerLimitValue;
            upperLimitValue = scatterResponse[0].upperLimit ?? upperLimitValue;
            lstVal = scatterResponse.map(item => item.value || item.y || item);
          } else if (Array.isArray(scatterResponse)) {
            // Handle direct array response - different servers may return different formats
            lstVal = scatterResponse.map(item => {
              if (typeof item === 'object' && item !== null) {
                return item.value || item.y || item.val || item.measurement || item.data || 0;
              }
              return item;
            });
          }

          // Ensure lstVal is always an array
          if (!Array.isArray(lstVal)) {
            lstVal = [lstVal];
          }

          // Filter out invalid values
          lstVal = lstVal.filter(val => val !== null && val !== undefined && !isNaN(val));

          if (lstVal.length > MAX_POINTS) {
            console.warn(`Point count too large (${lstVal.length}) for server ${serverId}, limiting to ${MAX_POINTS}`);
            lstVal = lstVal.slice(0, MAX_POINTS);
          }

          console.log(`📊 Processed scatter data for server ${serverId}:`, lstVal.length, 'points');
          console.log('📊 Sample data:', lstVal.slice(0, 5));

          // Update limits and points
          setLowerLimit(lowerLimitValue);
          setUpperLimit(upperLimitValue);
          setPoints(lstVal);
        } else {
          console.warn(`⚠️ No scatter data received for server ${serverId}`);
          setPoints([]);
        }
      } catch (error) {
        console.error(`❌ Error loading scatter data for server ${serverId}:`, error);
        setApiError(`Failed to load scatter data: ${error.message}`);
        setPoints([]);
      } finally {
        setIsLoadingScatter(false);
      }
    },
    [serverId, projCode, startDate, endDate]
  );

  const closeScatterPlot = useCallback(() => {
    setScatterGraphStatus(false);
    setPoints([]);
    setCPKName("");
    setApiError(null);
  }, []);

  // =========================
  // ✅ FIXED: Enhanced Validation with Better Error Messages
  // =========================
  console.log(`🎯 CPKChart received props for server ${serverId}:`);
  console.log('  - projCode:', projCode);
  console.log('  - serverId:', serverId);
  console.log('  - startDate:', startDate);
  console.log('  - endDate:', endDate);
  console.log('  - cpkCalculationData:', cpkCalculationData.length, 'items');
  console.log('  - dataPoints:', dataPoints.length, 'items');
  console.log('  - apiError:', apiError);

  if (!serverId) {
    console.error('CPKChart: serverId is required but not provided');
    return <div>Error: Server ID is required</div>;
  }

  if (!projCode) {
    console.error('CPKChart: projCode is required but not provided');
    return <div>Error: Project Code is required</div>;
  }

  // 🔧 FIXED: Enhanced error display
  if (apiError) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#d32f2f',
        backgroundColor: '#ffebee',
        borderRadius: '8px',
        border: '1px solid #ffcdd2'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          CPK Data Error for Server {serverId}
        </div>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          {apiError}
        </div>
        <button 
          onClick={refreshCPKCalculation}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoadingCPKData || (isCalculatingCPK && dataPoints.length === 0)) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#666'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          {isLoadingCPKData ? `Loading CPK Parameters for Server ${serverId}...` : `Calculating CPK Values for Server ${serverId}...`}
        </div>
        <div style={{ fontSize: '14px', color: '#999' }}>
          Please wait while we process your data
        </div>
      </div>
    );
  }

  if (dataPoints.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#666'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          No CPK Parameters Available for Server {serverId}
        </div>
        <div style={{ fontSize: '14px', color: '#999' }}>
          No CPK data found for project <strong>{projCode}</strong> in the selected date range
        </div>
        <button 
          onClick={refreshCPKCalculation}
          style={{
            marginTop: '20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Retry CPK Calculation
        </button>
      </div>
    );
  }

  // =========================
  // ✅ Enhanced Main Bar Chart Options (unchanged but with server info)
  // =========================
  const optionsMain = {
    chart: {
      type: 'column',
      height: 700,
      zoomType: 'x',
    },
    title: {
      text: isCalculatingCPK ? 
        `🧮 Calculating CPK Values for Server ${serverId}...` : 
        `📊 CPK Analysis - Server ${serverId} - ${dataPoints.length} Parameters`,
      align: 'left',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: isCalculatingCPK ? '#1976d2' : '#333'
      }
    },
    subtitle: {
      text: isCalculatingCPK 
        ? 'Please wait while CPK values are being calculated...' 
        : '📊 Click a bar to view scatter data • Scroll to zoom horizontally',
      align: 'left',
      style: {
        fontSize: '14px',
        color: isCalculatingCPK ? '#1976d2' : '#666'
      }
    },
    xAxis: {
      categories: category,
      title: { text: 'Parameters' },
      labels: {
        rotation: -45,
        style: {
          fontSize: '9px'
        },
        step: 1,
        overflow: 'allow',
        autoRotation: [-45, -90]
      },
      scrollbar: {
        enabled: true,
        height: 20,
        showFull: false,
        buttonArrowColor: '#666',
        buttonBackgroundColor: '#ddd',
        buttonBorderColor: '#ccc',
        rifleColor: '#666',
        trackBackgroundColor: '#f0f0f0',
        trackBorderColor: '#ccc'
      },
      min: 0,
      max: Math.min(40, category.length - 1),
      type: 'category'
    },
    yAxis: {
      min: 0,
      title: { 
        text: 'CPK Value', 
        style: {
          fontSize: '14px'
        }
      },
      labels: { 
        style: {
          fontSize: '12px'
        }
      },
      plotLines: [
        {
          color: '#FF6B6B',
          dashStyle: 'dash',
          value: 1.33,
          width: 2,
          label: {
            text: 'Min CPK (1.33)',
            style: {
              color: '#FF6B6B',
              fontSize: '11px'
            }
          }
        },
        {
          color: '#4ECDC4',
          dashStyle: 'dash',
          value: 1.67,
          width: 2,
          label: {
            text: 'Target CPK (1.67)',
            style: {
              color: '#4ECDC4',
              fontSize: '11px'
            }
          }
        },
        {
          color: '#45B7D1',
          dashStyle: 'dash',
          value: 2.0,
          width: 2,
          label: {
            text: 'Excellent CPK (2.0)',
            style: {
              color: '#45B7D1',
              fontSize: '11px'
            }
          }
        }
      ]
    },
    tooltip: {
      formatter: function () {
        const cpkStatus = this.point.y >= 2.0 ? 'Excellent' : 
                         this.point.y >= 1.67 ? 'Good' : 
                         this.point.y >= 1.33 ? 'Acceptable' : 'Poor';
        const statusColor = this.point.y >= 2.0 ? '#45B7D1' : 
                           this.point.y >= 1.67 ? '#4ECDC4' : 
                           this.point.y >= 1.33 ? '#FFA726' : '#FF6B6B';
        
        return `<b>${this.point.name}</b><br/>
                CPK Value: <b>${this.point.y.toFixed(3)}</b><br/>
                Status: <span style="color: ${statusColor}"><b>${cpkStatus}</b></span><br/>
                Count: <b>${this.point.count}</b><br/>
                Lower Limit: ${this.point.lowerLimit}<br/>
                Upper Limit: ${this.point.upperLimit}
                ${this.point.mean ? `<br/>Mean: ${this.point.mean.toFixed(4)}` : ''}
                ${this.point.standardDeviation ? `<br/>Std Dev: ${this.point.standardDeviation.toFixed(4)}` : ''}`;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ccc',
      borderRadius: 8,
      shadow: true
    },
    plotOptions: {
      column: {
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
            fontSize: '9px',
            fontWeight: 'bold'
          }
        },
        colorByPoint: false,
        color: function() {
          return this.y >= 2.0 ? '#45B7D1' : 
                 this.y >= 1.67 ? '#4ECDC4' : 
                 this.y >= 1.33 ? '#FFA726' : '#FF6B6B';
        }
      },
    },
    legend: {
      enabled: false
    },
    credits: { enabled: false },
    series: [
      {
        name: 'CPK Values',
        data: dataPoints.map(point => ({
          ...point,
          color: point.y >= 2.0 ? '#45B7D1' : 
                 point.y >= 1.67 ? '#4ECDC4' : 
                 point.y >= 1.33 ? '#FFA726' : '#FF6B6B'
        })),
      },
    ],
  };

  // =========================
  // ✅ Enhanced Scatter Options (unchanged)
  // =========================
  const scatterOptions = {
    chart: {
      type: "scatter",
      zoomType: "xy",
      height: 500,
      backgroundColor: '#fafafa',
      boost: { enabled: true },
    },
    title: {
      text: `📈 Scatter Plot: ${name} (Server ${serverId})`,
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
      min: lowerLimit * 0.95,
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
          radius: 3,
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
        name,
        data: pointvals.map((val, i) => {
          const numericVal = typeof val === "string" ? parseFloat(val) : val;
          const outOfSpec = numericVal < lowerLimit || numericVal > upperLimit;

          return {
            x: i + 1,
            y: numericVal,
            color: outOfSpec ? "rgba(244, 67, 54, 0.8)" : "rgba(76, 175, 80, 0.7)",
          };
        }),
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

  // =========================
  // ✅ Enhanced Final Render
  // =========================
  return (
    <div style={{ padding: "20px" }}>
      {/* CPK Summary Card */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '12px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
              🧮 CPK Analysis Dashboard
            </h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
              Project: <strong>{projCode}</strong> • 
              Period: <strong>{startDate}</strong> to <strong>{endDate}</strong>
            </p>
          </div>
          <button 
            onClick={refreshCPKCalculation}
            disabled={isCalculatingCPK}
            style={{
              background: isCalculatingCPK ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: isCalculatingCPK ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {isCalculatingCPK ? '🔄 Calculating...' : '🔄 Recalculate CPK'}
          </button>
        </div>
        
        {/* CPK Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '15px'
        }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
              {dataPoints.filter(p => p.y >= 1.67).length}
            </div>
            <div style={{ fontSize: '12px', color: '#2e7d32' }}>Good CPK (≥1.67)</div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fff3e0', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef6c00' }}>
              {dataPoints.filter(p => p.y >= 1.33 && p.y < 1.67).length}
            </div>
            <div style={{ fontSize: '12px', color: '#ef6c00' }}>Acceptable CPK (1.33-1.67)</div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#ffebee', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c62828' }}>
              {dataPoints.filter(p => p.y < 1.33).length}
            </div>
            <div style={{ fontSize: '12px', color: '#c62828' }}>Poor CPK (&lt; 1.33)</div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>
              {dataPoints.length}
            </div>
            <div style={{ fontSize: '12px', color: '#1565c0' }}>Total Parameters</div>
          </div>
        </div>
      </div>

      {/* Main CPK Chart */}
      <div style={{ 
        marginBottom: '20px',
        opacity: isCalculatingCPK ? 0.7 : 1,
        transition: 'opacity 0.3s ease',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <HighchartsReact highcharts={Highcharts} options={optionsMain} />
      </div>

      {/* Enhanced Scatter Plot Modal/Section */}
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
          ) : pointvals.length > 0 ? (
            <>
              {statistics && (
                <div style={{ 
                  marginBottom: '15px',
                  padding: '12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1565c0',
                  border: '1px solid #bbdefb',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <strong style={{ color: '#0d47a1' }}>📊 Statistics:</strong> 
                  <span style={{ marginLeft: '8px', color: '#1976d2' }}>
                    {statistics.count} samples • 
                    Range: {statistics.min.toFixed(4)} to {statistics.max.toFixed(4)} • 
                    Mean: {statistics.mean.toFixed(4)} • 
                    Std Dev: {statistics.stdDev.toFixed(4)} • 
                    Out of Spec: <span style={{ 
                      color: statistics.outOfSpec > 0 ? '#d32f2f' : '#388e3c',
                      fontWeight: 'bold' 
                    }}>
                      {statistics.outOfSpec} points
                    </span>
                  </span>
                </div>
              )}
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