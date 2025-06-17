import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { apiService, createProjectData } from '../services/apiService';

// ✅ FIXED: Props now match API parameter names
const FPYChart = ({ 
  data, 
  serverID,        // ✅ Fixed: Was serverId, now matches API
  startDate, 
  endDate, 
  projCode,        // ✅ Fixed: Was project, now matches API
  Option = 1,      // ✅ Fixed: Was viewMode, now matches API  
  lineNo = null 
}) => {
  const [stageName, setStageName] = useState(null);
  const [paretoData, setParetoData] = useState(null);

  // Debug: Log the incoming props
  useEffect(() => {
    console.log('FPY Chart - Received props:', { 
      data, serverID, startDate, endDate, projCode, Option, lineNo 
    });
  }, [data, serverID, startDate, endDate, projCode, Option, lineNo]);

  // Validate required props
  if (!serverID) {
    console.error('FPY Chart - Missing serverID prop');
    return <div>Missing server configuration for FPY Chart</div>;
  }

  if (!projCode) {
    console.error('FPY Chart - Missing projCode prop');
    return <div>Missing project configuration for FPY Chart</div>;
  }

  if (!startDate || !endDate) {
    console.error('FPY Chart - Missing date range props');
    return <div>Missing date range for FPY Chart</div>;
  }

  // Check if data exists and is valid
  if (!data) {
    console.log('FPY Chart - No data provided');
    return <div>No data provided for FPY Chart</div>;
  }

  if (!Array.isArray(data)) {
    console.log('FPY Chart - Data is not an array:', typeof data, data);
    return <div>Invalid data format for FPY Chart</div>;
  }

  if (data.length === 0) {
    console.log('FPY Chart - Empty data array');
    return <div>No data available for FPY Chart</div>;
  }

  // Validate data structure and create data points
  const dataPoints = data.map((item, index) => {
    console.log(`FPY Chart - Processing item ${index}:`, item);
    
    // Check if required fields exist
    if (!item.hasOwnProperty('passCount') || !item.hasOwnProperty('failCount')) {
      console.warn(`FPY Chart - Missing passCount or failCount in item ${index}:`, item);
      return null;
    }

    const passCount = Number(item.passCount) || 0;
    const failCount = Number(item.failCount) || 0;
    const totalCount = passCount + failCount;
    
    if (totalCount === 0) {
      console.warn(`FPY Chart - Zero total count for item ${index}:`, item);
      return {
        name: item.stageName || `Stage ${index + 1}`,
        id: item.stageID || index,
        y: 0,
        drilldown: item.stageName || `Stage ${index + 1}`,
        header: `[Pass:${passCount} Fail:${failCount}]`
      };
    }

    const fpyPercentage = (passCount / totalCount) * 100;
    
    return {
      name: item.stageName || `Stage ${index + 1}`,
      id: item.stageID || index,
      y: fpyPercentage,
      drilldown: item.stageName || `Stage ${index + 1}`,
      header: `[Pass:${passCount} Fail:${failCount}]`
    };
  }).filter(Boolean); // Remove null entries

  console.log('FPY Chart - Processed data points:', dataPoints);

  if (dataPoints.length === 0) {
    console.log('FPY Chart - No valid data points after processing');
    return <div>No valid data points for FPY Chart</div>;
  }

  // ✅ FIXED: Pareto data fetch with correct parameter names
  const fetchParetoData = async (stageID, stageName) => {
    console.log('FPY Chart - Fetching Pareto data for stage:', stageID, stageName);
    
    try {
      // ✅ FIXED: Use correct parameter names that match API
      const requestData = {
        serverID: serverID,      // ✅ Fixed: Was serverId
        projCode: projCode,      // ✅ Fixed: Was project
        stage: stageID,          // ✅ Correct
        startDate: startDate,    // ✅ Correct
        endDate: endDate,        // ✅ Correct
        Option: 2                // ✅ Fixed: Was viewMode, hardcoded to 2 for Pareto
      };

      console.log('FPY Chart - Pareto request data:', requestData);

      // Check if createProjectData is needed or if we can use requestData directly
      let payload;
      if (typeof createProjectData === 'function') {
        payload = createProjectData(requestData);
        // Ensure the stage and Option are set correctly after createProjectData
        payload.stage = stageID;
        payload.Option = 2;
      } else {
        payload = requestData;
      }

      console.log('FPY Chart - Final Pareto payload:', payload);

      const paretoResponse = await apiService.getParetoData(payload);
      console.log('FPY Chart - Pareto response:', paretoResponse);
      
      if (paretoResponse && paretoResponse.length > 0) {
        setParetoData(paretoResponse);
        setStageName(stageName);
      } else {
        setParetoData(null);
        setStageName(stageName);
        console.log('FPY Chart - No Pareto data found for stage:', stageName);
      }
    } catch (error) {
      console.error('FPY Chart - Error fetching Pareto data:', error);
      setParetoData(null);
      setStageName(stageName);
    }
  };

  const optionsMain = {
    chart: { 
      type: 'column',
      height: 400
    },
    title: { 
      align: 'left', 
      text: 'FPY Chart' 
    },
    subtitle: { 
      align: 'left', 
      text: 'Click the columns to view Pareto graph.' 
    },
    xAxis: { 
      type: 'category',
      labels: {
        rotation: -45
      }
    },
    yAxis: { 
      title: { text: 'First Pass Yield %' },
      min: 0,
      max: 100
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
        cursor: 'pointer'
      },
      series: {
        borderWidth: 0,
        dataLabels: { 
          enabled: true, 
          format: '{point.y:.1f}%' 
        }
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">{point.name} {point.header}</span>: <b>{point.y:.2f}%</b><br/>'
    },
    series: [{
      name: 'FPY',
      colorByPoint: true,
      data: dataPoints
    }]
  };

  return (
    <div style={{ width: '100%' }}>
      <HighchartsReact 
        highcharts={Highcharts} 
        options={optionsMain} 
        containerProps={{ style: { height: '400px', width: '100%' } }}
      />
      {paretoData && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h4>Pareto Data for: {stageName}</h4>
          <pre style={{ maxHeight: '300px', overflow: 'auto' }}>
            {JSON.stringify(paretoData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FPYChart;
// import React, { useState } from 'react';
// import Highcharts from 'highcharts';
// import HighchartsReact from 'highcharts-react-official';
// import { apiService, createProjectData } from '../services/apiService';

// const FPYChart = ({ data, serverId, startDate, endDate, project, viewMode = 'projectwise', lineNo = null }) => {
//   const [stageName, setStageName] = useState(null);
//   const [paretoData, setParetoData] = useState(null);

//   if (!data || !Array.isArray(data) || data.length === 0) {
//     return <div>No data available for FPY Chart</div>;
//   }

//   const dataPoints = data.map(item => ({
//     name: item.stageName,
//     id: item.stageID,
//     y: (item.passCount / (item.passCount + item.failCount)) * 100,
//     drilldown: item.stageName,
//     header: `[Pass:${item.passCount} Fail:${item.failCount}]`
//   }));

//   const fetchParetoData = async (stageID, stageName) => {
//     const requestData = {
//       serverId,
//       area: stageName, // can also pass actual `area` if needed
//       pcbaType: stageName, // not needed for pareto usually
//       lineNo,
//       project,
//       startDate,
//       endDate,
//       viewMode,
//     };

//     const payload = createProjectData(requestData);
//     payload.stage = stageID; // override with actual stage ID
//     payload.Option = 2;

//     try {
//       const paretoResponse = await apiService.getParetoData(payload);
//       if (paretoResponse && paretoResponse.length > 0) {
//         setParetoData(paretoResponse);
//         setStageName(stageName);
//       } else {
//         setParetoData(null);
//         setStageName(stageName);
//       }
//     } catch (error) {
//       console.error('Error fetching Pareto data:', error);
//       setParetoData(null);
//       setStageName(stageName);
//     }
//   };

//   const optionsMain = {
//     chart: { type: 'column' },
//     title: { align: 'left', text: 'FPY Chart' },
//     subtitle: { align: 'left', text: 'Click the columns to view pareto graph.' },
//     xAxis: { type: 'category' },
//     yAxis: { title: { text: 'Total pass meters %' } },
//     legend: { enabled: false },
//     plotOptions: {
//       column: {
//         point: {
//           events: {
//             click: function () {
//               fetchParetoData(this.options.id, this.name);
//             }
//           }
//         }
//       },
//       series: {
//         borderWidth: 0,
//         dataLabels: { enabled: true, format: '{point.y:.1f}%' }
//       }
//     },
//     tooltip: {
//       headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
//       pointFormat: '<span style="color:{point.color}">{point.name} {point.header}</span>: <b>{point.y:.2f}%</b><br/>'
//     },
//     series: [{
//       name: 'FPYs',
//       colorByPoint: true,
//       data: dataPoints
//     }]
//   };

//   return (
//     <>
//       <HighchartsReact highcharts={Highcharts} options={optionsMain} />
//       {paretoData && (
//         <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
//           <h4>Pareto Data for: {stageName}</h4>
//           <pre>{JSON.stringify(paretoData, null, 2)}</pre>
//         </div>
//       )}
//     </>
//   );
// };

// export default FPYChart;
