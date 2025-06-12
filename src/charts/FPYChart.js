import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const FPYChart = ({ data }) => { // ✅ Receive data as props
  const [stageName, setStageName] = useState(null);
  const [paretoData, setParetoData] = useState(null);

  // ✅ Add safety check for data
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

  const getParetoData = (stageID) => {
    const stage = data.find(item => item.stageID === stageID);
    if (stage && stage.paretoData) {
      setParetoData(stage.paretoData);
      setStageName(stage.stageName);
    } else {
      setParetoData(null);
      setStageName(null);
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
              getParetoData(this.options.id);
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
        <div>
          <h4>Pareto Data for {stageName}</h4>
          <pre>{JSON.stringify(paretoData, null, 2)}</pre>
        </div>
      )}
    </>
  );
};

export default FPYChart;
// import React, { useEffect, useState } from 'react';
// import Highcharts from 'highcharts'
// import HighchartsReact from 'highcharts-react-official'
// import { CCol } from '@coreui/react'
// import axios from 'axios'
// import { baseUrl } from 'src/config.js'
// import ParetoChart from './ParetoChart.js';

// // Load Highcharts modules
// require("highcharts/modules/exporting")(Highcharts);

// const FPYChart=(props)=>{
// 		const[options,setOptions]=useState(null);
// 		const[ParetoData,setParetoData]=useState(null);
// 		const[selectedProject,setSelectedProject]=useState('');
// 		const[startDate,setStartDate]=useState(new Date());
//         const[endDate,setEndDate]=useState(new Date());
// 		const[stageName,setStageName]=useState(null);
// 		var optionsSeconary=null;
		

// 		const data=props.MeterData;	
// 		let serverID=props.serverID;	
// 		const dataPoints=data.map(item=>({
// 			name:item.stageName,//+"[Pass:"+item.passCount+" Fail:"+item.failCount+"]"
// 			id:item.stageID,
// 			y:(item.passCount/(item.passCount+item.failCount))*100,
// 			drilldown:item.stageName,
// 			header:"[Pass:"+item.passCount+" Fail:"+item.failCount+"]"
// 		}));

		
// 		useEffect(()=>{
// 			setSelectedProject(props.selectedProject);
// 			setStartDate(props.startDate);
// 			setEndDate(props.endDate);		
// 		 },[])

// 		 const GetParetoData= (stage)=>{
// 			try
// 			{
// 				debugger
// 			  if(stage !== 0)
// 			  {
// 				let url = baseUrl;
// 				var obj={
// 					serverID:parseInt(serverID),
// 					projCode:selectedProject,
// 					stage:parseInt(stage),
// 					startDate:startDate,
// 					endDate:endDate,
// 					Option:parseInt(2)
// 				}
// 				debugger
// 				axios.post(url+'/Fpy/getParetoData',obj).
// 				then(response=>
// 				  {
// 					debugger
// 					  if(response.data!==null)
// 					  {
// 						setParetoData(response.data);
// 					  }
// 				});
// 			  }
// 			}
// 			catch(error)
// 			{
// 			  console.log("error occurred"); 
// 			}
// 		  }

// 		var optionsMain={
// 			chart: {
// 			type: 'column'
// 		},
// 		title: {
// 			align: 'left',
// 			text: 'First Pass Yeild.'
// 		},
// 		subtitle: {
// 			align: 'left',
// 			text: 'Click the columns to view pareto graph.'
// 		},
// 		accessibility: {
// 			announceNewData: {
// 				enabled: true
// 			}
// 		},
// 		xAxis: {
// 			type: 'category'
// 		},
// 		yAxis: {
// 			title: {
// 				text: 'Total pass meters %'
// 			}
// 		},
// 		legend: {
// 			enabled: false
// 		},
// 		plotOptions: {
// 			column: {
// 				point: {
// 				   events: {
// 					   click:PlotSecondaryChart
// 				   }
// 				}
// 		   },
// 			series: {
// 				borderWidth: 0,
// 				dataLabels: {
// 					enabled: true,
// 					format: '{point.y:.1f}%'
// 				}
// 			}
// 		},
	
// 		tooltip: {
// 			headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
// 			pointFormat: '<span style="color:{point.color}">{point.name} {point.header}</span>: <b>{point.y:.2f}%</b> of total<br/>'
// 		},
	
// 		series: [
// 			{
// 				name: 'FPYs',
// 				colorByPoint: true,
// 				data: dataPoints
// 			}
// 		]	
// 	}

// 		function PlotSecondaryChart() {
// 			setStageName(this.options.name)
// 			GetParetoData(this.options.id);
// 		}

// 		return (
// 			<>
// 				<div>
// 					<HighchartsReact highcharts={Highcharts} options={optionsMain} />
// 				</div>
// 				<div>
// 					{
// 					ParetoData !== null && 
// 					<ParetoChart stageName={stageName} ParetoData={ParetoData}></ParetoChart>
// 					 }
// 				</div>
// 			</>
// 		)
// 	}

// export default FPYChart;