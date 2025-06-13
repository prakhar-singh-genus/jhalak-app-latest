import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { apiService, createCPKData } from '../services/apiService';

const CPKChart = ({ data, cpkList, serverId, startDate, endDate, project }) => {
  const [plotscatter, setScatterGraphStatus] = useState(false);
  const [pointvals, setPoints] = useState(null);
  const [lowerLimit, setLowerLimit] = useState(-25);
  const [upperLimit, setUpperLimit] = useState(25);
  const [name, setCPKName] = useState('');

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

    const requestData = {
      serverId,
      project,
      startDate,
      endDate,
      lineNo: null,
      paramName,
      viewMode: 'projectwise', // Assuming you want project view for scatter
    };

    const apiPayload = createCPKData(requestData, paramName);

    try {
      const scatterResponse = await apiService.getScatteredData(apiPayload);

      if (scatterResponse?.length) {
        const { config, lstVal } = scatterResponse;
        setLowerLimit(config?.lowerLimit ?? -25);
        setUpperLimit(config?.upperLimit ?? 25);
        setPoints(lstVal);
        setCPKName(paramName);
        setScatterGraphStatus(true);
      } else {
        setPoints(null);
        setScatterGraphStatus(true);
        setCPKName(paramName);
      }
    } catch (error) {
      console.error('Error loading scatter data:', error);
      setPoints(null);
      setScatterGraphStatus(true);
      setCPKName(paramName);
    }
  };

  const optionsMain = {
    chart: {
      type: 'bar',
    },
    title: {
      text: 'CPK Chart',
      align: 'left',
    },
    subtitle: {
      text: 'Click a bar to view scatter data',
      align: 'left',
    },
    xAxis: {
      categories: category,
      title: { text: null },
      gridLineWidth: 1,
      lineWidth: 0,
    },
    yAxis: {
      min: 0,
      title: { text: 'CPK Value', align: 'high' },
      labels: { overflow: 'justify' },
      gridLineWidth: 0,
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.point.name}</b><br/>CPK Value: ${this.point.y}<br/>Count: ${this.point.count}`;
      },
    },
    plotOptions: {
      bar: {
        point: {
          events: {
            click: handleBarClick,
          },
        },
        borderRadius: '0%',
        dataLabels: {
          enabled: true,
          format: '{point.y:.2f}',
        },
        groupPadding: 0.1,
      },
    },
    credits: { enabled: false },
    series: [
      {
        name: 'CPK Values',
        data: dataPoints,
        colorByPoint: true,
      },
    ],
  };

  const scatterOptions = {
    chart: {
      type: 'scatter',
      zoomType: 'xy',
    },
    title: {
      text: `Scatter Plot for ${name}`,
    },
    xAxis: {
      title: { text: 'Sample Index' },
    },
    yAxis: {
      title: { text: 'Measured Value' },
      min: lowerLimit,
      max: upperLimit,
    },
    series: [
      {
        name: name,
        color: 'rgba(223, 83, 83, .5)',
        data: pointvals?.map((val, i) => [i + 1, val]) || [],
      },
    ],
  };

  return (
    <>
      <div>
        <HighchartsReact highcharts={Highcharts} options={optionsMain} />
      </div>
      {plotscatter && pointvals && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <HighchartsReact highcharts={Highcharts} options={scatterOptions} />
        </div>
      )}
      {plotscatter && !pointvals && (
        <div style={{ marginTop: '20px' }}>
          <p>No scatter data available for <strong>{name}</strong></p>
        </div>
      )}
    </>
  );
};

export default CPKChart;
