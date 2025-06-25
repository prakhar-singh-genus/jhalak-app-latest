import React, { Component } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// ✅ ALTERNATIVE FIX: Import modules differently
import HighchartsPareto from 'highcharts/modules/pareto';
import HighchartsExporting from 'highcharts/modules/exporting';

// Initialize modules
if (typeof HighchartsPareto === 'function') {
  HighchartsPareto(Highcharts);
}
if (typeof HighchartsExporting === 'function') {
  HighchartsExporting(Highcharts);
}

class ParetoChart extends Component {
  
  render() {
    // ✅ REMOVED: pareto(Highcharts) - already initialized above
    
    const errors = this.props.ParetoData;
    const StageName = this.props.stageName;
    
    // ✅ Add validation for props
    if (!errors || !Array.isArray(errors) || errors.length === 0) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          fontStyle: 'italic',
          border: '1px solid #ddd',
          borderRadius: '5px',
          backgroundColor: '#f9f9f9'
        }}>
          No error data available for Pareto analysis
        </div>
      );
    }
    
    // ✅ Process data with error handling
    const category = errors.map(item => {
      // Handle different possible field names for error description
      return item.error || item.errorDescription || item.defectType || item.name || 'Unknown Error';
    });
    
    const data = errors.map(item => {
      // Handle different possible field names for error count
      const count = item.errCount || item.errorCount || item.count || item.value || 0;
      return Number(count);
    });
    
    console.log('Pareto Chart - Categories:', category);
    console.log('Pareto Chart - Data:', data);
    
    const optionsMain = {
      chart: {
        renderTo: 'container',
        type: 'column',
        height: 400
      },
      title: {
        text: `Pareto Analysis - ${StageName}`,
        align: 'left'
      },
      subtitle: {
        text: 'Error frequency and cumulative percentage',
        align: 'left'
      },
      tooltip: {
        shared: true
      },
      xAxis: {
        categories: category,
        crosshair: true,
        labels: {
          rotation: -45,
          style: {
            fontSize: '10px'
          }
        }
      },
      yAxis: [{
        title: {
          text: 'Error Count',
          style: {
            color: '#666'
          }
        },
        labels: {
          style: {
            color: '#666'
          }
        }
      }, {
        title: {
          text: 'Cumulative Percentage (%)',
          style: {
            color: '#FF6B6B'
          }
        },
        minPadding: 0,
        maxPadding: 0,
        max: 100,
        min: 0,
        opposite: true,
        labels: {
          format: '{value}%',
          style: {
            color: '#FF6B6B'
          }
        }
      }],
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom'
      },
      plotOptions: {
        column: {
          color: '#4A90E2',
          borderWidth: 1,
          borderColor: '#2E5BBA'
        },
        line: {
          color: '#FF6B6B',
          lineWidth: 3,
          marker: {
            fillColor: '#FF6B6B',
            lineWidth: 2,
            lineColor: '#FFFFFF'
          }
        }
      },
      series: [{
        type: 'pareto',
        name: 'Cumulative %',
        yAxis: 1,
        zIndex: 10,
        baseSeries: 1,
        tooltip: {
          valueDecimals: 1,
          valueSuffix: '%'
        },
        color: '#FF6B6B'
      }, {
        name: 'Error Count',
        type: 'column',
        zIndex: 2,
        data: data,
        color: '#4A90E2',
        tooltip: {
          pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>'
        }
      }],
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            menuItems: [
              'printChart',
              'separator',
              'downloadPNG',
              'downloadJPEG',
              'downloadPDF',
              'downloadSVG'
            ]
          }
        }
      }
    };

    return (
      <div style={{ width: '100%' }}>
        <HighchartsReact 
          highcharts={Highcharts} 
          options={optionsMain}
          containerProps={{ style: { height: '400px', width: '100%' } }}
        />
        
        {/* ✅ Add data summary */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
		    <h6 style={{ margin: '0 0 10px 0', color: '#495057', fontWeight: 600 }}>Data Summary:</h6>
		    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
		    <div style={{ fontWeight: 500 }}>
			      <span style={{ fontWeight: 600 }}>Total Errors:</span> {data.reduce((sum, val) => sum + val, 0)}
		    </div>
		      <div style={{ fontWeight: 500 }}>
			    <span style={{ fontWeight: 600 }}>Error Types:</span> {category.length}
		    </div>
		    <div style={{ fontWeight: 500 }}>
			      <span style={{ fontWeight: 600 }}>Top Error:</span> {category[0]} ({data[0]} occurrences)
		    </div>
		    </div>
        </div>
      </div>
    );
  }
}

export default ParetoChart;