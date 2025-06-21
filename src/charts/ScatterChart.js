import React, { Component } from 'react';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import highchartsMore from 'highcharts/highcharts-more'; 
highchartsMore(Highcharts);
// Load Highcharts modules
require("highcharts/modules/exporting")(Highcharts);

const ScatterChart=(props)=>
{
	debugger
		  var averages = [],
		  i;
	  for (i = 0; i < props.points.length; i += 1) {
		  averages.push([
			  Math.pow(Math.random(), 2) * 100,
			  props.points[i]
		  ]);
	  }
	  
	var optionsMain=
		{
			chart: {
				zoomType: 'xy',
				height: '50%'
			},

			boost: {
				useGPUTranslations: true,
				usePreAllocated: true
			},
		
			accessibility: {
				screenReaderSection: {
					beforeChartFormat: '<{headingTagName}>{chartTitle}</{headingTagName}><div>{chartLongdesc}</div><div>{xAxisDescription}</div><div>{yAxisDescription}</div>'
				}
			},
		
			xAxis: {
				min: 0,
				max: 100,
				gridLineWidth: 1
			},
		
			yAxis: [
				{
				// Renders faster when we don't have to compute min and max
				min: props.lowerLimit,
				max: props.upperLimit,
				minPadding: 0,
				maxPadding: 0,
				title: {
					text: null
				},
				color:'red',
			},
		]
			,title: {
				text: 'Scatter chart points of ' + props.name
			},
		
			legend: {
				enabled: false
			},
		
			series: [{
				type: 'scatter',
				color: true?'rgba(1,255,255,0.8)':'rgba(1,1,255,0.8)',
				data: averages,
				marker: {
					radius: 6.0
				},
				tooltip: {
					followPointer: false,
					pointFormat: '[{point.x:.1f}, {point.y:.1f}]'
				}
			}]
		}
	
		return (
			<div>
				 <HighchartsReact highcharts={Highcharts} options={optionsMain} />
			</div>
		);
		}


export default ScatterChart;