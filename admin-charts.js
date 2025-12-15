// ApexCharts implementation for admin dashboard

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

function initAdminCharts() {
    if (typeof ApexCharts === 'undefined') {
        setTimeout(initAdminCharts, 100);
        return;
    }

    // Force container widths before initialization
    document.querySelectorAll('.chart-container').forEach(container => {
        container.style.width = '100%';
    });

    initializeRecordsChart();
    initializeSizeDistributionChart();
    initializeAvgSizeTrendChart();
    initializeUserActivityChart();
    
    // Force resize after all charts render to ensure correct width
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 300);
}

function initializeRecordsChart() {
    const chartElement = document.getElementById('recordsChart');
    if (!chartElement) return;

    function loadChartData() {
        const records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
        const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
        
        const last7Days = [];
        const recordCounts = [];
        const sessionCounts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const recordCount = records.filter(r => {
                const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
                return recordDate === dateStr;
            }).length;
            
            const sessionCount = sessions.filter(s => {
                const sessionDate = new Date(s.startTime || s.id).toISOString().split('T')[0];
                return sessionDate === dateStr;
            }).length;
            
            last7Days.push(dateLabel);
            recordCounts.push(recordCount);
            sessionCounts.push(sessionCount);
        }

        if (recordsChart) {
            recordsChart.updateSeries([
                { name: 'Records', data: recordCounts },
                { name: 'Sessions', data: sessionCounts }
            ]);
            recordsChart.updateOptions({
                xaxis: { categories: last7Days }
            });
        }
    }

    if (recordsChart) {
        recordsChart.destroy();
    }

    const options = {
        series: [
            { name: 'Records', data: [] },
            { name: 'Sessions', data: [] }
        ],
        chart: {
            type: 'area',
            height: 350,
            width: '100%',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        colors: [colors.primary, colors.tertiary],
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: [3, 2]
        },
        fill: {
            type: 'gradient',
            gradient: {
                opacityFrom: 0.7,
                opacityTo: 0.15,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: [],
            title: {
                text: 'Date',
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280'
                }
            },
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 500,
                    colors: '#6B7280'
                },
                hideOverlappingLabels: true
            }
        },
        yaxis: {
            title: {
                text: 'Count',
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280'
                }
            },
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 500,
                    colors: '#6B7280'
                }
            }
        },
        tooltip: {
            theme: 'dark',
            x: {
                show: true
            },
            y: {
                formatter: function(value) {
                    return value;
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '12px',
            fontWeight: 600,
            labels: {
                colors: '#374151'
            },
            markers: {
                width: 12,
                height: 12,
                radius: 12
            }
        },
        grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 0,
            padding: {
                left: 20,
                right: 20,
                bottom: 20
            },
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        }
    };

    recordsChart = new ApexCharts(chartElement, options);
    recordsChart.render();

    loadChartData();
    setInterval(loadChartData, 2000);
}

function initializeSizeDistributionChart() {
    const chartElement = document.getElementById('sizeDistributionChart');
    if (!chartElement) return;

    function loadChartData() {
        const records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
        const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
        
        const allSizes = [];
        records.forEach(record => {
            allSizes.push(parseFloat(record.avgSize));
        });
        sessions.forEach(session => {
            if (session.measurements && session.measurements.length > 0) {
                session.measurements.forEach(m => {
                    const size = parseFloat(m.avgSize || 0);
                    if (size > 0) allSizes.push(size);
                });
            }
        });
        
        const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
        const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
        const counts = new Array(bins.length - 1).fill(0);

        allSizes.forEach(size => {
            for (let i = 0; i < bins.length - 1; i++) {
                if (size >= bins[i] && size < bins[i + 1]) {
                    counts[i]++;
                    break;
                }
            }
        });

        if (sizeDistributionChart) {
            sizeDistributionChart.updateSeries([{ name: 'Number of Pellets', data: counts }]);
            sizeDistributionChart.updateOptions({
                xaxis: { categories: binLabels }
            });
        }
    }

    if (sizeDistributionChart) {
        sizeDistributionChart.destroy();
    }

    const options = {
        series: [{
            name: 'Number of Pellets',
            data: []
        }],
        chart: {
            type: 'bar',
            height: 350,
            width: '100%',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '80%',
                distributed: false,
                dataLabels: {
                    position: 'top'
                }
            }
        },
        colors: [colors.secondary],
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: [],
            title: {
                text: 'Diameter Size Range (mm)',
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280'
                }
            },
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 500,
                    colors: '#6B7280'
                },
                hideOverlappingLabels: true
            }
        },
        yaxis: {
            title: {
                text: 'Number of Pellets',
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280'
                }
            },
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 500,
                    colors: '#6B7280'
                }
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function(value) {
                    return value + ' pellets';
                }
            }
        },
        grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 0,
            padding: {
                left: 20,
                right: 20,
                bottom: 20
            },
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        }
    };

    sizeDistributionChart = new ApexCharts(chartElement, options);
    sizeDistributionChart.render();

    loadChartData();
    setInterval(loadChartData, 2000);
}

function initializeAvgSizeTrendChart() {
    const chartElement = document.getElementById('avgSizeTrendChart');
    if (!chartElement) return;

    function loadChartData() {
        const records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
        const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
        const last30Days = [];
        const avgSizes = [];
        const minSizes = [];
        const maxSizes = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const dayRecords = records.filter(r => {
                const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
                return recordDate === dateStr;
            });
            
            const daySessions = sessions.filter(s => {
                const sessionDate = new Date(s.startTime || s.id).toISOString().split('T')[0];
                return sessionDate === dateStr && s.measurements && s.measurements.length > 0;
            });
            
            const allSizes = [];
            dayRecords.forEach(r => allSizes.push(parseFloat(r.avgSize)));
            daySessions.forEach(s => {
                s.measurements.forEach(m => {
                    const size = parseFloat(m.avgSize || 0);
                    if (size > 0) allSizes.push(size);
                });
            });
            
            const dayAvg = allSizes.length > 0
                ? parseFloat((allSizes.reduce((sum, s) => sum + s, 0) / allSizes.length).toFixed(2))
                : 0;
            const dayMin = allSizes.length > 0 ? parseFloat(Math.min(...allSizes).toFixed(2)) : 0;
            const dayMax = allSizes.length > 0 ? parseFloat(Math.max(...allSizes).toFixed(2)) : 0;
            
            last30Days.push(dateLabel);
            avgSizes.push(dayAvg);
            minSizes.push(dayMin);
            maxSizes.push(dayMax);
        }

        if (avgSizeTrendChart) {
            avgSizeTrendChart.updateSeries([
                { name: 'Average Size (mm)', data: avgSizes },
                { name: 'Min Size (mm)', data: minSizes },
                { name: 'Max Size (mm)', data: maxSizes }
            ], false);
            avgSizeTrendChart.updateOptions({
                xaxis: { categories: last30Days }
            }, false, false);
        }
    }

    if (avgSizeTrendChart) {
        avgSizeTrendChart.destroy();
    }

    const options = {
        series: [
            { name: 'Average Size (mm)', data: [] },
            { name: 'Min Size (mm)', data: [] },
            { name: 'Max Size (mm)', data: [] }
        ],
        chart: {
            type: 'area',
            height: 350,
            width: '100%',
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
            zoom: {
                enabled: true,
                type: 'x',
                autoScaleYaxis: true
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        colors: [colors.tertiary, colors.secondary, colors.quaternary],
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: [3.5, 2.5, 2.5]
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.5,
                opacityFrom: 0.6,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        markers: {
            size: 4,
            strokeWidth: 2,
            strokeColors: '#fff',
            hover: {
                size: 6
            }
        },
        xaxis: {
            categories: [],
            title: {
                text: 'Date',
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280'
                }
            },
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 500,
                    colors: '#6B7280'
                },
                hideOverlappingLabels: true
            }
        },
        yaxis: {
            title: {
                text: 'Diameter Size (mm)',
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280'
                }
            },
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 500,
                    colors: '#6B7280'
                },
                formatter: function(value) {
                    return value.toFixed(1);
                }
            }
        },
        tooltip: {
            theme: 'dark',
            shared: true,
            intersect: false,
            y: {
                formatter: function(value) {
                    return value.toFixed(2) + ' mm';
                }
            }
        },
        legend: {
            show: false
        },
        grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 0,
            padding: {
                left: 20,
                right: 20,
                bottom: 20
            },
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        }
    };

    avgSizeTrendChart = new ApexCharts(chartElement, options);
    avgSizeTrendChart.render();

    loadChartData();
}

function initializeUserActivityChart() {
    const chartElement = document.getElementById('userActivityChart');
    if (!chartElement) return;

    const solidColors = [
        '#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
        '#ef4444', '#ec4899', '#14b8a6', '#a855f7', '#3b82f6'
    ];

    function loadChartData() {
        const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
        const userCounts = {};
        
        sessions.forEach(session => {
            const operator = session.operator || 'Unknown';
            if (!userCounts[operator]) {
                userCounts[operator] = 0;
            }
            userCounts[operator]++;
        });
        
        const sortedUsers = Object.entries(userCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const labels = sortedUsers.map(u => u[0]);
        const data = sortedUsers.map(u => u[1]);
        const colors = data.map((_, index) => solidColors[index % solidColors.length]);

        if (userActivityChart) {
            userActivityChart.updateSeries([{ name: 'Sessions', data: data }]);
            userActivityChart.updateOptions({
                xaxis: { categories: labels },
                colors: colors
            });
        }
    }

    if (userActivityChart) {
        userActivityChart.destroy();
    }

    const options = {
        series: [{
            name: 'Sessions',
            data: []
        }],
        chart: {
            type: 'bar',
            height: 350,
            width: '100%',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 8,
                barHeight: '70%',
                distributed: true,
                dataLabels: {
                    position: 'top'
                }
            }
        },
        colors: solidColors,
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: [],
            title: {
                text: 'Number of Sessions',
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280'
                }
            },
            labels: {
                style: {
                    fontSize: '12px',
                    fontWeight: 500,
                    colors: '#6B7280'
                },
                hideOverlappingLabels: true
            }
        },
        yaxis: {
            title: {
                text: 'Operator',
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280'
                }
            },
            labels: {
                style: {
                    fontSize: '13px',
                    fontWeight: 600,
                    colors: '#374151'
                },
                maxWidth: 200
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function(value) {
                    return value + ' session' + (value !== 1 ? 's' : '');
                }
            }
        },
        legend: {
            show: false
        },
        grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 0,
            padding: {
                left: 20,
                right: 20,
                bottom: 20
            },
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: false
                }
            }
        }
    };

    userActivityChart = new ApexCharts(chartElement, options);
    userActivityChart.render();

    loadChartData();
    setInterval(loadChartData, 2000);
}

// Global function to update charts
window.updateAdminCharts = function() {
    try {
        // Update records chart data
        if (recordsChart) {
            const records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
            const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
            const last7Days = [];
            const recordCounts = [];
            const sessionCounts = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                const recordCount = records.filter(r => {
                    const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
                    return recordDate === dateStr;
                }).length;
                
                const sessionCount = sessions.filter(s => {
                    const sessionDate = new Date(s.startTime || s.id).toISOString().split('T')[0];
                    return sessionDate === dateStr;
                }).length;
                
                last7Days.push(dateLabel);
                recordCounts.push(recordCount);
                sessionCounts.push(sessionCount);
            }
            
            recordsChart.updateSeries([
                { name: 'Records', data: recordCounts },
                { name: 'Sessions', data: sessionCounts }
            ]);
            recordsChart.updateOptions({
                xaxis: { categories: last7Days }
            });
        }
        
        // Update size distribution chart data
        if (sizeDistributionChart) {
            const records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
            const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
            const allSizes = [];
            records.forEach(record => {
                allSizes.push(parseFloat(record.avgSize));
            });
            sessions.forEach(session => {
                if (session.measurements && session.measurements.length > 0) {
                    session.measurements.forEach(m => {
                        const size = parseFloat(m.avgSize || 0);
                        if (size > 0) allSizes.push(size);
                    });
                }
            });
            
            const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
            const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
            const counts = new Array(bins.length - 1).fill(0);
            
            allSizes.forEach(size => {
                for (let i = 0; i < bins.length - 1; i++) {
                    if (size >= bins[i] && size < bins[i + 1]) {
                        counts[i]++;
                        break;
                    }
                }
            });
            
            sizeDistributionChart.updateSeries([{ name: 'Number of Pellets', data: counts }]);
            sizeDistributionChart.updateOptions({
                xaxis: { categories: binLabels }
            });
        }
        
        // Update avg size trend chart data
        if (avgSizeTrendChart) {
            const records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
            const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
            const last30Days = [];
            const avgSizes = [];
            const minSizes = [];
            const maxSizes = [];
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                const dayRecords = records.filter(r => {
                    const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
                    return recordDate === dateStr;
                });
                
                const daySessions = sessions.filter(s => {
                    const sessionDate = new Date(s.startTime || s.id).toISOString().split('T')[0];
                    return sessionDate === dateStr && s.measurements && s.measurements.length > 0;
                });
                
                const allSizes = [];
                dayRecords.forEach(r => allSizes.push(parseFloat(r.avgSize)));
                daySessions.forEach(s => {
                    s.measurements.forEach(m => {
                        const size = parseFloat(m.avgSize || 0);
                        if (size > 0) allSizes.push(size);
                    });
                });
                
                const dayAvg = allSizes.length > 0
                    ? parseFloat((allSizes.reduce((sum, s) => sum + s, 0) / allSizes.length).toFixed(2))
                    : 0;
                const dayMin = allSizes.length > 0 ? parseFloat(Math.min(...allSizes).toFixed(2)) : 0;
                const dayMax = allSizes.length > 0 ? parseFloat(Math.max(...allSizes).toFixed(2)) : 0;
                
                last30Days.push(dateLabel);
                avgSizes.push(dayAvg);
                minSizes.push(dayMin);
                maxSizes.push(dayMax);
            }
            
            avgSizeTrendChart.updateSeries([
                { name: 'Average Size (mm)', data: avgSizes },
                { name: 'Min Size (mm)', data: minSizes },
                { name: 'Max Size (mm)', data: maxSizes }
            ]);
            avgSizeTrendChart.updateOptions({
                xaxis: { categories: last30Days }
            });
        }
        
        // Update user activity chart data
        if (userActivityChart) {
            const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
            const userCounts = {};
            
            sessions.forEach(session => {
                const operator = session.operator || 'Unknown';
                if (!userCounts[operator]) {
                    userCounts[operator] = 0;
                }
                userCounts[operator]++;
            });
            
            const sortedUsers = Object.entries(userCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            
            const labels = sortedUsers.map(u => u[0]);
            const data = sortedUsers.map(u => u[1]);
            
            const solidColors = [
                '#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
                '#ef4444', '#ec4899', '#14b8a6', '#a855f7', '#3b82f6'
            ];
            
            const colors = data.map((_, index) => solidColors[index % solidColors.length]);
            
            userActivityChart.updateSeries([{ name: 'Sessions', data: data }]);
            userActivityChart.updateOptions({
                xaxis: { categories: labels },
                colors: colors
            });
        }
    } catch (e) {
        console.error('Error updating charts:', e);
    }
};

// Force charts to resize after initialization
function resizeAllAdminCharts() {
    const charts = [recordsChart, sizeDistributionChart, avgSizeTrendChart, userActivityChart];
    charts.forEach(chart => {
        if (chart) {
            chart.updateOptions({
                chart: { width: '100%' }
            }, false, false);
        }
    });
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initAdminCharts();
        setTimeout(resizeAllAdminCharts, 500);
    });
} else {
    initAdminCharts();
    setTimeout(resizeAllAdminCharts, 500);
}

// Handle window resize
window.addEventListener('resize', function() {
    resizeAllAdminCharts();
});
