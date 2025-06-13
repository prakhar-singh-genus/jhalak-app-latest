import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { apiService, createProjectData } from '../services/apiService';

const FPYChart = ({ data, serverId, startDate, endDate, project, viewMode = 'projectwise', lineNo = null }) => {
  const [stageName, setStageName] = useState(null);
  const [paretoData, setParetoData] = useState(null);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div>No data available for FPY Chart</div>;
  }

  const dataPoints = data.map(item => ({
    name: item.stageName,
    id: item.stageID,
    y: (item.passCount / (item.passCount + item.failCount)) * 100,
    drilldown: item.stageName,
    header: `[Pass:${item.passCount} Fail:${item.failCount}]`
  }));

  const fetchParetoData = async (stageID, stageName) => {
    const requestData = {
      serverId,
      area: stageName, // can also pass actual `area` if needed
      pcbaType: stageName, // not needed for pareto usually
      lineNo,
      project,
      startDate,
      endDate,
      viewMode,
    };

    const payload = createProjectData(requestData);
    payload.stage = stageID; // override with actual stage ID
    payload.Option = 2;

    try {
      const paretoResponse = await apiService.getParetoData(payload);
      if (paretoResponse && paretoResponse.length > 0) {
        setParetoData(paretoResponse);
        setStageName(stageName);
      } else {
        setParetoData(null);
        setStageName(stageName);
      }
    } catch (error) {
      console.error('Error fetching Pareto data:', error);
      setParetoData(null);
      setStageName(stageName);
    }
  };

  const optionsMain = {
    chart: { type: 'column' },
    title: { align: 'left', text: 'FPY Chart' },
    subtitle: { align: 'left', text: 'Click the columns to view pareto graph.' },
    xAxis: { type: 'category' },
    yAxis: { title: { text: 'Total pass meters %' } },
    legend: { enabled: false },
    plotOptions: {
      column: {
        point: {
          events: {
            click: function () {
              fetchParetoData(this.options.id, this.name);
            }
          }
        }
      },
      series: {
        borderWidth: 0,
        dataLabels: { enabled: true, format: '{point.y:.1f}%' }
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">{point.name} {point.header}</span>: <b>{point.y:.2f}%</b><br/>'
    },
    series: [{
      name: 'FPYs',
      colorByPoint: true,
      data: dataPoints
    }]
  };

  return (
    <>
      <HighchartsReact highcharts={Highcharts} options={optionsMain} />
      {paretoData && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h4>Pareto Data for: {stageName}</h4>
          <pre>{JSON.stringify(paretoData, null, 2)}</pre>
        </div>
      )}
    </>
  );
};

export default FPYChart;
