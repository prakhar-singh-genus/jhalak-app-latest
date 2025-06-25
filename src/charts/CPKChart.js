import React, { useState, useMemo, useCallback, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { apiService, createCPKData } from "../services/apiService";

import boost from "highcharts/modules/boost";
if (typeof boost === "function") {
  boost(Highcharts);
}

const MAX_POINTS = 10000;

const CPKChart = ({ data, cpkList, serverId, startDate, endDate, projCode, cpkParameters }) => {
  // =========================
  // ✅ State Declarations (MUST BE FIRST)
  // =========================
  const [plotscatter, setScatterGraphStatus] = useState(false);
  const [pointvals, setPoints] = useState([]);
  const [lowerLimit, setLowerLimit] = useState(-25);
  const [upperLimit, setUpperLimit] = useState(25);
  const [name, setCPKName] = useState("");
  const [isLoadingScatter, setIsLoadingScatter] = useState(false);
  const [isCalculatingCPK, setIsCalculatingCPK] = useState(false);
  const [cpkCalculationData, setCpkCalculationData] = useState([]);

  // =========================
  // ✅ NEW: Calculate CPK Values Effect
  // =========================
  
  useEffect(() => {
    const calculateCPKValues = async () => {
      if (!serverId || !projCode || !startDate || !endDate) {
        console.warn('Missing required parameters for CPK calculation');
        return;
      }

      console.log('🧮 Starting CPK calculation...');

      setIsCalculatingCPK(true);

      try {
        const cpkRequestData = {
          serverID: Number(serverId),
          projCode: String(projCode),
          startDate: startDate,
          endDate: endDate
        };

        console.log('📊 CPK Calculation Request:', cpkRequestData);
        
        const cpkResults = await apiService.calculateCPK(cpkRequestData);
        debugger;
        if (cpkResults && Array.isArray(cpkResults)) {
          console.log('✅ CPK Calculation Results:', cpkResults);
          setCpkCalculationData(cpkResults);
        } else {
          console.warn('⚠️ No CPK calculation results received');
          setCpkCalculationData([]);
        }
      } catch (error) {
        console.error('❌ Error calculating CPK:', error);
        setCpkCalculationData([]);
      } finally {
        setIsCalculatingCPK(false);
      }
    };

    // Only calculate if we have the required data
    if (serverId && projCode && startDate && endDate) {
      calculateCPKValues();
    }
  }, [serverId, projCode, startDate, endDate]);

  // =========================
  // ✅ Enhanced Derivations (useMemo) 
  // =========================
  const dataPoints = useMemo(() => {
    if (!Array.isArray(data) || !Array.isArray(cpkList)) return [];
    
    // Merge original data with calculated CPK values if available
    const mergedData = data.map((item, index) => {
      const calculatedCPK = cpkCalculationData.find(calc => 
        calc.parameterName === item.parameterName || 
        calc.ParameterName === item.parameterName
      );
      
      return {
        ...item,
        cpkValue: calculatedCPK?.cpkValue || calculatedCPK?.CPKValue || item.cpkValue,
        // Add additional calculated fields if available
        mean: calculatedCPK?.mean,
        standardDeviation: calculatedCPK?.standardDeviation,
        processCapability: calculatedCPK?.processCapability
      };
    });
    
    const tempdataPoints = mergedData.map((item, index) =>
      cpkList[index]?.state
        ? {
            name: item.parameterName,
            y: item.cpkValue,
            count: item.metercount,
            lowerLimit: item.lowerLimit,
            upperLimit: item.upperLimit,
            mean: item.mean,
            standardDeviation: item.standardDeviation,
          }
        : null
    );

    const filteredPoints = tempdataPoints.filter(Boolean);
    
    if (filteredPoints.length === 0) {
      console.warn('No CPK parameters are enabled for display');
    }
    
    return filteredPoints;
  }, [data, cpkList, cpkCalculationData]);

  const category = useMemo(() => dataPoints.map((item) => item.name), [dataPoints]);

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
  // ✅ NEW: Refresh CPK Calculation Function
  // =========================
  const refreshCPKCalculation = useCallback(async () => {
    if (!serverId || !projCode || !startDate || !endDate) return;

    setIsCalculatingCPK(true);
    try {
      const cpkRequestData = {
        serverID: Number(serverId),
        projCode: String(projCode),
        startDate: startDate,
        endDate: endDate
      };
      debugger;

      const cpkResults = await apiService.calculateCPK(cpkRequestData);
      
      if (cpkResults && Array.isArray(cpkResults)) {
        setCpkCalculationData(cpkResults);
        console.log('🔄 CPK values refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Error refreshing CPK:', error);
    } finally {
      setIsCalculatingCPK(false);
    }
  }, [serverId, projCode, startDate, endDate]);

  // =========================
  // ✅ Enhanced Event Handlers
  // =========================
  const handleBarClick = useCallback(
    async function () {
      const paramName = this.name;
      console.log('🎯 CPK Bar clicked:', paramName);
      console.log('🔍 Using projCode:', projCode);

      // Show loading state
      setIsLoadingScatter(true);
      setScatterGraphStatus(true);
      setCPKName(paramName);

      // Enhanced request data structure
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

      console.log('📊 CPK Scatter Request Data:', requestData);

      try {
        const apiPayload = createCPKData(requestData, paramName, 1);
        console.log('📤 CPK API Payload:', apiPayload);

        const scatterResponse = await apiService.getScatteredData(apiPayload);
        console.log('📥 Scatter Response:', scatterResponse);

        if (scatterResponse) {
          let lstVal = [];
          let lowerLimitValue = -25;
          let upperLimitValue = 25;

          // Handle different response structures
          if (scatterResponse.config && scatterResponse.lstVal !== undefined) {
            lstVal = scatterResponse.lstVal;
            lowerLimitValue = scatterResponse.config?.lowerLimit ?? -25;
            upperLimitValue = scatterResponse.config?.upperLimit ?? 25;
          } else if (scatterResponse[0]?.config && scatterResponse[0]?.lstVal) {
            const { config, lstVal: responseData } = scatterResponse[0];
            lstVal = responseData || [];
            lowerLimitValue = config?.lowerLimit ?? -25;
            upperLimitValue = config?.upperLimit ?? 25;
          } else if (scatterResponse[0]?.lowerLimit !== undefined) {
            lowerLimitValue = scatterResponse[0].lowerLimit ?? -25;
            upperLimitValue = scatterResponse[0].upperLimit ?? 25;
            lstVal = scatterResponse.map(item => item.value || item.y || item);
          } else if (Array.isArray(scatterResponse)) {
            lstVal = scatterResponse;
          }

          if (!Array.isArray(lstVal)) {
            lstVal = [lstVal];
          }

          if (lstVal.length > MAX_POINTS) {
            console.warn(`Point count too large (${lstVal.length}), limiting to ${MAX_POINTS}`);
            lstVal = lstVal.slice(0, MAX_POINTS);
          }

          setLowerLimit(lowerLimitValue);
          setUpperLimit(upperLimitValue);
          setPoints(lstVal);
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
    },
    [serverId, projCode, startDate, endDate]
  );

  const closeScatterPlot = useCallback(() => {
    setScatterGraphStatus(false);
    setPoints([]);
    setCPKName("");
  }, []);

  // =========================
  // ✅ Validation Logic (AFTER ALL HOOKS)
  // =========================
  console.log('🎯 CPKChart received props:');
  console.log('  - projCode:', projCode);
  console.log('  - serverId:', serverId);
  console.log('  - startDate:', startDate);
  console.log('  - endDate:', endDate);
  console.log('  - cpkCalculationData:', cpkCalculationData.length, 'items');

  if (!serverId) {
    console.error('CPKChart: serverId is required but not provided');
    return <div>Error: Server ID is required</div>;
  }

  if (!projCode) {
    console.error('CPKChart: projCode is required but not provided');
    return <div>Error: Project Code is required</div>;
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div>No CPK data available</div>;
  }

  if (!cpkList || !Array.isArray(cpkList) || cpkList.length === 0) {
    return <div>No CPK list configuration available</div>;
  }

  if (dataPoints.length === 0) {
    return <div>No CPK parameters are enabled for display</div>;
  }

  // =========================
  // ✅ Enhanced Main Bar Options with Loading State
  // =========================
  const optionsMain = {
    chart: {
      type: 'bar',
      height: 400,
    },
    title: {
      text: isCalculatingCPK ? '🧮 Calculating CPK Values...' : 'CPK Chart',
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
        : '📊 Click a bar to view scatter data',
      align: 'left',
      style: {
        fontSize: '14px',
        color: isCalculatingCPK ? '#1976d2' : '#666'
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
        value: 1.67,
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

  // =========================
  // ✅ Enhanced Scatter Options (same as before)
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
  // ✅ Enhanced Final Render with CPK Controls
  // =========================
  return (
    <div style={{ padding: "20px" }}>
      {/* CPK Calculation Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: 0, color: '#333' }}>🧮 CPK Analysis</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            {cpkCalculationData.length > 0 
              ? `${cpkCalculationData.length} parameters calculated` 
              : 'No CPK calculations performed yet'
            }
          </p>
        </div>
        <button 
          onClick={refreshCPKCalculation}
          disabled={isCalculatingCPK}
          style={{
            background: isCalculatingCPK ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: isCalculatingCPK ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isCalculatingCPK ? '🔄 Calculating...' : '🔄 Recalculate CPK'}
        </button>
      </div>

      {/* Main CPK Chart */}
      <div style={{ 
        marginBottom: '20px',
        opacity: isCalculatingCPK ? 0.7 : 1,
        transition: 'opacity 0.3s ease'
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