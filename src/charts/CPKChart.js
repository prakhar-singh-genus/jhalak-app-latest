import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const CPKChart = ({ data, cpkList }) => { // ✅ Receive data as props
  const [plotscatter, setScatterGraphStatus] = useState(false);
  const [pointvals, setPoints] = useState(null);
  const [lowerLimit, setLowerLimit] = useState(-25);
  const [upperLimit, setUpperLimit] = useState(25);
  const [name, setCPKName] = useState('');

  // ✅ Add safety checks for data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div>No CPK data available</div>;
  }

  if (!cpkList || !Array.isArray(cpkList) || cpkList.length === 0) {
    return <div>No CPK list configuration available</div>;
  }

  // ✅ Create data points with proper filtering
  const tempdataPoints = data.map((item, index) =>
    cpkList[index]?.state ? {
      name: item.parameterName,
      y: item.cpkValue,
      count: item.metercount,
      lowerLimit: item.lowerLimit,
      upperLimit: item.upperLimit,
    } : null
  );

  const dataPoints = tempdataPoints.filter(Boolean);
  
  // ✅ Handle case where no data points are enabled
  if (dataPoints.length === 0) {
    return <div>No CPK parameters are enabled for display</div>;
  }

  const category = dataPoints.map(item => item.name);

  const handleBarClick = function() {
    // ✅ Set limits and name from clicked bar
    setLowerLimit(this.lowerLimit ?? -25);
    setUpperLimit(this.upperLimit ?? 25);
    setCPKName(this.name);
    setPoints(null); // Clear previous scatter data
    setScatterGraphStatus(true);
    
    console.log('CPK Bar clicked:', this.name);
    // Note: Scatter chart functionality can be added later if needed
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
      text: 'Source: ptm database',
      align: 'left',
    },
    xAxis: {
      categories: category,
      title: {
        text: null,
      },
      gridLineWidth: 1,
      lineWidth: 0,
    },
    yAxis: {
      min: 0,
      title: {
        text: 'CPK Value',
        align: 'high',
      },
      labels: {
        overflow: 'justify',
      },
      gridLineWidth: 0,
    },
    tooltip: {
      formatter: function() {
        return `<b>${this.point.name}</b><br/>CPK Value: ${this.point.y}<br/>Count: ${this.point.count}`;
      }
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
          format: '{point.y:.2f}'
        },
        groupPadding: 0.1,
      },
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'top',
      x: -40,
      y: 80,
      floating: true,
      borderWidth: 1,
      backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
      shadow: true,
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        name: 'CPK Values',
        data: dataPoints,
        colorByPoint: true,
      },
    ],
  };

  return (
    <>
      <div>
        <HighchartsReact highcharts={Highcharts} options={optionsMain} />
      </div>
      {plotscatter && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h4>Scatter Chart for: {name}</h4>
          <p>Lower Limit: {lowerLimit}</p>
          <p>Upper Limit: {upperLimit}</p>
          <p><em>Scatter chart functionality can be implemented here</em></p>
        </div>
      )}
    </>
  );
};

export default CPKChart;

// import React, { useState } from 'react';
// import Highcharts from 'highcharts'
// import HighchartsReact from 'highcharts-react-official'
// import ScatterChart from './ScatterChart';
// import axios from 'axios'
// import { baseUrl } from 'src/config.js'


// const CPKChart=(props)=>{

// 		const[plotscatter,setScatterGraphStatus]=useState(false);
// 		const[pointvals,setPoints]=useState(null);
// 		const[lowerLimit,setLowerLimit]=useState(-25);
// 		const[upperLimit,setUpperLimit]=useState(25);
// 		var cpkvalues=props.CPKData;
// 		const serverID=props.serverID;
// 		var startDate=props.startDate;
// 		var endDate=props.endDate;
// 		const [name,setCPKName]=useState('');
// 		const selectedProject=props.selectedProject;
// 		const CPKList=props.CPKList;

// 		debugger
// 		if (cpkvalues !=='' && Array.isArray(CPKList) && CPKList.length)
// 		{
// 		// const category=cpkvalues.map(item => (item.parameterName));
// 		const tempdataPoints = cpkvalues.map((item,index) =>CPKList[index].state && ({
// 			name: item.parameterName,
// 			y: item.cpkValue,
// 			count:item.metercount,
// 			lowerLimit:item.lowerLimit,
// 			upperLimit:item.upperLimit,
// 		}));
// 		const dataPoints=tempdataPoints.filter(item=> item!==false);
// 		const category=dataPoints.map(item=> (item.name));

// 		var	optionsMain={
// 			chart: {
// 				type: 'bar'
// 			},
// 			title: {
// 				text: 'Project CPK Values',
// 				align: 'left'
// 			},
// 			subtitle: {
// 				text:'Source: <a'+ 'target="_blank">ptm database</a>',
// 				align: 'left'
// 			},
// 			xAxis: {
// 				categories:category,
// 				title: {
// 					text: null
// 				},
// 				gridLineWidth: 1,
// 				lineWidth: 0
// 			},
// 			yAxis: {
// 				min: 0,
// 				title: {
// 					align: 'high'
// 				},
// 				labels: {
// 					overflow: 'justify'
// 				},
// 				gridLineWidth: 0
// 			},
// 			tooltip: {
// 				// valueSuffix: '[count:'+ dataPoints[0].count +']'
// 			},
// 			plotOptions: {
// 				bar: {
// 					point: {
// 						events: {
// 							click:PlotScatterChart
// 						}
// 						},
// 					borderRadius: '0%',
// 					dataLabels: {
// 						enabled: true
// 					},
// 					groupPadding: 0.1

// 				}
// 			},
// 			legend: {
// 				layout: 'vertical',
// 				align: 'right',
// 				verticalAlign: 'top',
// 				x: -40,
// 				y: 80,
// 				floating: true,
// 				borderWidth: 1,
// 				backgroundColor:
// 					Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
// 				shadow: true
// 			},
// 			credits: {
// 				enabled: false
// 			},
// 			series: [{
// 				data:dataPoints
// 			},
// 		]
// 		}

// 		function PlotScatterChart() {
// 			try
// 			{
// 				debugger
// 				let url = baseUrl;
// 				setLowerLimit(this.lowerLimit)
// 				setUpperLimit(this.upperLimit)
// 				setCPKName(this.name)
// 				var obj={
// 					serverID:parseInt(serverID),
// 					projCode:selectedProject,
// 					startDate:startDate,
// 					endDate:endDate,
// 					Option:2,
// 					paramName:this.category,
// 				  }
// 				axios.post(url+'/Fpy/GetScatterred',obj).then(response=>
// 				  {
// 					  if(response.data!==null)
// 					  {
// 						if(response.data.config!==null && response.data.lstVal!==null)
// 						{
// 							setLowerLimit(response.data.config.lowerLimit);
// 							setUpperLimit(response.data.config.upperLimit);
// 							setPoints(response.data.lstVal);
// 						}
// 					}
// 				});
// 			}
// 			catch(error)
// 			{
// 			  console.log("error occurred"); 
// 			}
// 			setScatterGraphStatus(true);
// 		}
// 	}

// 		return (
// 			<>
// 			<div>
// 				<HighchartsReact highcharts={Highcharts} options={optionsMain} />
// 			</div>
// 				{pointvals!==null && <ScatterChart points={pointvals} lowerLimit={lowerLimit} upperLimit={upperLimit} name={name} />}
// 			</>
// 		)
// 	}

// export default CPKChart;