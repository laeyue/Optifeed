// Admin Charts - Database Version using ApexCharts

let recordsChart = null;
let sizeDistributionChart = null;
let avgSizeTrendChart = null;
let userActivityChart = null;

// Color palette
const colors = {
    primary: '#00AFE0',
    secondary: '#FF6B6B',
    tertiary: '#4ECDC4',
    quaternary: '#FFE66D',
    quinary: '#95E1D3',
    senary: '#F38181'
};

const solidColors = [
    '#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#a855f7', '#3b82f6'
];

// Initialize all charts
async function initAdminCharts() {
    if (typeof ApexCharts === 'undefined') {
        console.log('ApexCharts not loaded yet, retrying...');
        setTimeout(initAdminCharts, 100);
        return;
    }

    if (typeof API_CONFIG === 'undefined' || typeof apiRequest === 'undefined') {
        console.log('API configuration not loaded yet, retrying...');
        setTimeout(initAdminCharts, 100);
        return;
    }

    try {
        // Load chart data from API
        const chartData = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_CHARTS + '?days=7');
        
        if (!chartData || !chartData.success) {
            console.error('Failed to load chart data:', chartData);
            showChartError('Failed to load chart data. Please refresh the page.');
            return;
        }

        if (!chartData.charts) {
            console.error('Invalid chart data structure:', chartData);
            showChartError('Invalid chart data received.');
            return;
        }

        await initializeRecordsChart(chartData.charts);
        await initializeSizeDistributionChart(chartData.charts);
        await initializeAvgSizeTrendChart();
        await initializeUserActivityChart(chartData.charts);

        console.log('Admin charts initialized successfully');
    } catch (error) {
        console.error('Failed to initialize admin charts:', error);
        showChartError('Failed to initialize charts. Please check your connection.');
    }
}

// Records over time chart
async function initializeRecordsChart(chartData) {
    const ctx = document.getElementById('recordsChart');
    if (!ctx) return;

    // Destroy existing chart
    if (recordsChart) {
        try {
            recordsChart.destroy();
        } catch (e) {}
    }

    // Prepare data for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }

    const recordCounts = last7Days.map(date => {
        // Normalize date format for comparison (handle both YYYY-MM-DD and Date objects)
        const dayRecords = chartData.recordsOverTime.find(r => {
            const recordDate = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
            return recordDate === date;
        });
        return dayRecords ? parseInt(dayRecords.count) : 0;
    });

    const sessionCounts = last7Days.map(date => {
        // Normalize date format for comparison
        const daySessions = chartData.sessionsOverTime.find(s => {
            const sessionDate = s.date instanceof Date ? s.date.toISOString().split('T')[0] : String(s.date).split('T')[0];
            return sessionDate === date;
        });
        return daySessions ? parseInt(daySessions.count) : 0;
    });

    const dateLabels = last7Days.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const options = {
        series: [
            { name: 'Records', data: recordCounts },
            { name: 'Sessions', data: sessionCounts }
        ],
        chart: {
            type: 'area',
            height: 350,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            },
            animations: { enabled: true, speed: 800, easing: 'easeinout' }
        },
        colors: [colors.primary, colors.tertiary],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1
            }
        },
        xaxis: {
            categories: dateLabels,
            labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 } },
            title: { text: 'Date', style: { color: '#64748b', fontSize: '13px', fontWeight: 600 } }
        },
        yaxis: {
            labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 } },
            title: { text: 'Count', style: { color: '#64748b', fontSize: '13px', fontWeight: 600 } }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '13px',
            fontWeight: 600,
            itemMargin: {
                horizontal: 15,
                vertical: 8
            },
            markers: {
                width: 12,
                height: 12,
                radius: 6
            }
        },
        toolbar: {
            show: true,
            tools: {
                download: true,
                selection: true,
                zoom: true,
                zoomin: true,
                zoomout: true,
                pan: true,
                reset: true
            }
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            },
            padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        },
        tooltip: {
            theme: 'light',
            style: {
                fontSize: '12px'
            },
            y: {
                formatter: function(val) {
                    return val;
                }
            }
        }
    };

    recordsChart = new ApexCharts(ctx, options);
    recordsChart.render();
}

// Size distribution chart
async function initializeSizeDistributionChart(chartData) {
    const ctx = document.getElementById('sizeDistributionChart');
    if (!ctx) return;

    // Destroy existing chart
    if (sizeDistributionChart) {
        try {
            sizeDistributionChart.destroy();
        } catch (e) {}
    }

    const allSizes = chartData.sizeDistribution || [];
    
    if (!allSizes || allSizes.length === 0) {
        ctx.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">No size data available</p>';
        return;
    }
    
    // Ensure all sizes are numbers
    const numericSizes = allSizes.map(size => {
        const num = parseFloat(size);
        return isNaN(num) ? 0 : num;
    }).filter(size => size > 0);
    
    if (numericSizes.length === 0) {
        ctx.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">No valid size data available</p>';
        return;
    }

    // Create bins
    const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
    const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
    const counts = new Array(bins.length - 1).fill(0);

    numericSizes.forEach(size => {
        const sizeValue = parseFloat(size);
        if (isNaN(sizeValue) || sizeValue <= 0) return;
        
        let placed = false;
        for (let i = 0; i < bins.length - 1; i++) {
            if (sizeValue >= bins[i] && sizeValue < bins[i + 1]) {
                counts[i]++;
                placed = true;
                break;
            }
        }
        // Handle edge case for values >= last bin
        if (!placed && sizeValue >= bins[bins.length - 1]) {
            counts[counts.length - 1]++;
        }
    });

    const options = {
        series: [{ name: 'Count', data: counts }],
        chart: {
            type: 'bar',
            height: 350,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        colors: [colors.tertiary],
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '60%',
                distributed: false
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: binLabels,
            labels: {
                rotate: -45,
                style: { colors: '#64748b' }
            },
            title: { text: 'Size Range (mm)', style: { color: '#64748b' } }
        },
        yaxis: {
            labels: { style: { colors: '#64748b' } },
            title: { text: 'Count', style: { color: '#64748b' } }
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            },
            padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        },
        tooltip: {
            theme: 'light',
            style: {
                fontSize: '12px'
            },
            y: {
                formatter: function(val) {
                    return val;
                }
            }
        }
    };

    sizeDistributionChart = new ApexCharts(ctx, options);
    sizeDistributionChart.render();
}

// Average size trend chart (last 30 days)
async function initializeAvgSizeTrendChart() {
    const ctx = document.getElementById('avgSizeTrendChart');
    if (!ctx) {
        console.log('avgSizeTrendChart container not found');
        return;
    }

    // Destroy existing chart
    if (avgSizeTrendChart) {
        try {
            avgSizeTrendChart.destroy();
        } catch (e) {}
    }

    try {
        const chartData = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_CHARTS + '?days=30');
        
        if (!chartData.success) return;

        const trendData = chartData.charts.avgSizeTrend || [];
        
        // Prepare data for last 30 days
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last30Days.push(date.toISOString().split('T')[0]);
        }

        const avgSizes = last30Days.map(date => {
            // Normalize date format for comparison
            const dayData = trendData.find(d => {
                const dataDate = d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date).split('T')[0];
                return dataDate === date;
            });
            return dayData && dayData.avg_size ? parseFloat(dayData.avg_size).toFixed(2) : null;
        });

        const minSizes = last30Days.map(date => {
            // Normalize date format for comparison
            const dayData = trendData.find(d => {
                const dataDate = d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date).split('T')[0];
                return dataDate === date;
            });
            return dayData && dayData.min_size ? parseFloat(dayData.min_size).toFixed(2) : null;
        });

        const maxSizes = last30Days.map(date => {
            // Normalize date format for comparison
            const dayData = trendData.find(d => {
                const dataDate = d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date).split('T')[0];
                return dataDate === date;
            });
            return dayData && dayData.max_size ? parseFloat(dayData.max_size).toFixed(2) : null;
        });

        const dateLabels = last30Days.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const options = {
            series: [
                { name: 'Avg Size', data: avgSizes },
                { name: 'Min Size', data: minSizes },
                { name: 'Max Size', data: maxSizes }
            ],
        chart: {
            type: 'area',
            height: 350,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            },
            animations: { enabled: true, speed: 800, easing: 'easeinout' }
        },
            colors: [colors.primary, colors.secondary, colors.quaternary],
            stroke: { curve: 'smooth', width: 2 },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
        xaxis: {
            categories: dateLabels,
            labels: {
                rotate: -45,
                style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 }
            },
            title: { text: 'Date', style: { color: '#64748b', fontSize: '13px', fontWeight: 600 } }
        },
            yaxis: {
                labels: { style: { colors: '#64748b' } },
                title: { text: 'Size (mm)', style: { color: '#64748b' } }
            },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '13px',
            fontWeight: 600,
            itemMargin: {
                horizontal: 15,
                vertical: 8
            },
            markers: {
                width: 12,
                height: 12,
                radius: 6
            }
        },
        toolbar: {
            show: true,
            tools: {
                download: true,
                selection: true,
                zoom: true,
                zoomin: true,
                zoomout: true,
                pan: true,
                reset: true
            }
        },
            grid: {
                borderColor: '#e2e8f0',
                strokeDashArray: 4
            }
        };

        avgSizeTrendChart = new ApexCharts(ctx, options);
        avgSizeTrendChart.render();

    } catch (error) {
        console.error('Failed to load avg size trend:', error);
    }
}

// User activity chart
async function initializeUserActivityChart(chartData) {
    const ctx = document.getElementById('userActivityChart');
    if (!ctx) return;

    // Destroy existing chart
    if (userActivityChart) {
        try {
            userActivityChart.destroy();
        } catch (e) {}
    }

    const userActivity = chartData.userActivity || [];

    if (!userActivity || userActivity.length === 0) {
        ctx.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">No user activity data</p>';
        return;
    }

    const labels = userActivity.map(u => {
        const name = u.name || u.operator || 'Unknown';
        return name.length > 15 ? name.substring(0, 15) + '...' : name;
    });
    const data = userActivity.map(u => {
        const count = parseInt(u.session_count);
        return isNaN(count) ? 0 : count;
    });
    const chartColors = data.map((_, i) => solidColors[i % solidColors.length]);

    const options = {
        series: [{ name: 'Sessions', data: data }],
        chart: {
            type: 'bar',
            height: 350,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        colors: chartColors,
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '60%',
                distributed: true
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: labels,
            labels: {
                rotate: -45,
                style: { colors: '#64748b' }
            }
        },
        yaxis: {
            labels: { style: { colors: '#64748b' } },
            title: { text: 'Sessions', style: { color: '#64748b' } }
        },
        legend: {
            show: false
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            },
            padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        },
        tooltip: {
            theme: 'light',
            style: {
                fontSize: '12px'
            },
            y: {
                formatter: function(val) {
                    return val;
                }
            }
        }
    };

    userActivityChart = new ApexCharts(ctx, options);
    userActivityChart.render();
}

// Update all charts with new data
window.updateAdminCharts = async function() {
    if (typeof API_CONFIG === 'undefined' || typeof apiRequest === 'undefined') {
        console.error('API configuration not available');
        return;
    }

    try {
        const chartData = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_CHARTS + '?days=7');
        
        if (!chartData || !chartData.success || !chartData.charts) {
            console.error('Failed to update charts: Invalid data', chartData);
            return;
        }

        if (recordsChart) {
            await initializeRecordsChart(chartData.charts);
        }
        if (sizeDistributionChart) {
            await initializeSizeDistributionChart(chartData.charts);
        }
        if (avgSizeTrendChart) {
            await initializeAvgSizeTrendChart();
        }
        if (userActivityChart) {
            await initializeUserActivityChart(chartData.charts);
        }

        console.log('Charts updated successfully');
    } catch (error) {
        console.error('Failed to update charts:', error);
    }
};

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initAdminCharts();
    });
} else {
    initAdminCharts();
}

// Helper function to show chart errors
function showChartError(message) {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        if (!container.querySelector('.chart-error')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'chart-error';
            errorDiv.style.cssText = 'text-align: center; padding: 2rem; color: #ef4444; background: #fef2f2; border-radius: 8px; margin: 1rem 0;';
            errorDiv.innerHTML = `<p style="margin: 0; font-weight: 500;">${message}</p>`;
            container.appendChild(errorDiv);
        }
    });
}

// Make functions globally available
window.initAdminCharts = initAdminCharts;
window.updateAdminCharts = window.updateAdminCharts;
