// ApexCharts implementation with different colors for statistics

let distributionChart = null;
let trendsChart = null;

// Make charts globally accessible for reset/update functions
if (typeof window !== 'undefined') {
    window.distributionChart = distributionChart;
    window.trendsChart = trendsChart;
}

// Color palette - different colors for different statistics
const colors = {
    primary: '#00AFE0',
    secondary: '#FF6B6B',
    tertiary: '#4ECDC4',
    quaternary: '#FFE66D',
    quinary: '#95E1D3',
    senary: '#F38181'
};

function initUserCharts() {
    if (typeof ApexCharts === 'undefined') {
        setTimeout(initUserCharts, 100);
        return;
    }

    // Force container widths before initialization
    document.querySelectorAll('.chart-container').forEach(container => {
        container.style.width = '100%';
    });
    document.querySelectorAll('#distributionChart, #trendsChart').forEach(el => {
        el.style.width = '100%';
    });

    initializeDistributionChart();
    initializeTrendsChart();
    
    // Force window resize after init
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

function initializeDistributionChart() {
    const canvas = document.getElementById('distributionChart');
    if (!canvas) return;

    async function loadChartData() {
        try {
            // Check if there's an active session - if so, only show current session data
            const isActiveSession = typeof window !== 'undefined' && window.currentSessionId && typeof isSessionActive !== 'undefined' && isSessionActive;
            
            if (isActiveSession && typeof measurements !== 'undefined' && measurements.length > 0) {
                // During active session, only show current session measurements
                const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
                const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
                const counts = new Array(bins.length - 1).fill(0);

                window.measurements.forEach(measurement => {
                    const size = parseFloat(measurement.avgSize || 0);
                    for (let i = 0; i < bins.length - 1; i++) {
                        if (size >= bins[i] && size < bins[i + 1]) {
                            counts[i]++;
                            break;
                        }
                    }
                });

                if (distributionChart) {
                    distributionChart.updateOptions({
                        xaxis: {
                            categories: binLabels
                        }
                    });
                    distributionChart.updateSeries([{
                        name: 'Number of Measurements',
                        data: counts
                    }]);
                }
            } else {
                // No active session - show all historical data from database
                const currentUser = getCurrentUser();
                if (!currentUser) return;
                
                const recordsResponse = await apiRequest(API_CONFIG.ENDPOINTS.RECORDS);
                const allRecords = recordsResponse.records || [];
                const userRecords = allRecords.filter(r => r.user_id === currentUser.id || r.operator === currentUser.username);
                
                const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
                const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
                const counts = new Array(bins.length - 1).fill(0);

                userRecords.forEach(record => {
                    const size = parseFloat(record.avg_size || 0);
                    for (let i = 0; i < bins.length - 1; i++) {
                        if (size >= bins[i] && size < bins[i + 1]) {
                            counts[i]++;
                            break;
                        }
                    }
                });

                if (distributionChart) {
                    distributionChart.updateOptions({
                        xaxis: {
                            categories: binLabels
                        }
                    });
                    distributionChart.updateSeries([{
                        name: 'Number of Measurements',
                        data: counts
                    }]);
                }
            }
        } catch (error) {
            console.error('Failed to load distribution chart data:', error);
        }
    }

    if (distributionChart) {
        distributionChart.destroy();
    }

    // Initialize with default data
    const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
    const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
    
    const options = {
        series: [{
            name: 'Number of Measurements',
            data: new Array(binLabels.length).fill(0)
        }],
        chart: {
            type: 'bar',
            height: 350,
            width: '100%',
            toolbar: {
                show: true
            },
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            locales: [{
                name: 'en',
                options: {
                    toolbar: {
                        download: 'Download SVG',
                        selection: 'Selection',
                        selectionZoom: 'Selection Zoom',
                        zoomIn: 'Zoom In',
                        zoomOut: 'Zoom Out',
                        pan: 'Panning',
                        reset: 'Reset Zoom'
                    }
                }
            }],
            defaultLocale: 'en',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        colors: ['#4ECDC4'],
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '80%',
                distributed: false
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: binLabels,
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
            },
            axisBorder: {
                show: false
            }
        },
        yaxis: {
            title: {
                text: 'Number of Measurements',
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
                    return Math.floor(value);
                }
            }
        },
        grid: {
            borderColor: 'rgba(0, 0, 0, 0.08)',
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
            }
        },
        tooltip: {
            theme: 'dark',
            style: {
                fontSize: '12px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            },
            y: {
                formatter: function(value) {
                    return 'Measurements: ' + value;
                }
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'left',
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
        }
    };

    distributionChart = new ApexCharts(canvas, options);
    distributionChart.render();
    
    // Make chart globally accessible
    if (typeof window !== 'undefined') {
        window.distributionChart = distributionChart;
    }
    
    // Force resize after render to ensure correct width
    setTimeout(() => {
        if (distributionChart) {
            window.dispatchEvent(new Event('resize'));
        }
    }, 100);

    // Only load data if not in active session (active session uses updateChartsWithCurrentSession)
    const isActiveSession = typeof window !== 'undefined' && window.currentSessionId && typeof isSessionActive !== 'undefined' && isSessionActive;
    if (!isActiveSession) {
        loadChartData();
        setInterval(() => {
            // Only update if not in active session
            if (!(typeof window !== 'undefined' && window.currentSessionId && typeof isSessionActive !== 'undefined' && isSessionActive)) {
                loadChartData();
            }
        }, 5000); // Update every 5 seconds when not in active session
    }
}

function initializeTrendsChart() {
    const canvas = document.getElementById('trendsChart');
    if (!canvas) return;

    if (trendsChart) {
        trendsChart.destroy();
    }

    // Initialize with default labels (numbers only)
    const defaultLabels = Array.from({ length: 10 }, (_, i) => String(i + 1));
    
    const options = {
        series: [
            {
                name: 'Average Size',
                data: new Array(10).fill(0)
            },
            {
                name: 'Min Size',
                data: new Array(10).fill(0)
            },
            {
                name: 'Max Size',
                data: new Array(10).fill(0)
            }
        ],
        chart: {
            type: 'area',
            height: 350,
            width: '100%',
            toolbar: {
                show: true
            },
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        },
        colors: ['#2FA76E', '#FF6B6B', '#FFE66D'],
        stroke: {
            curve: 'smooth',
            width: [3.5, 2.5, 2.5]
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                type: 'vertical',
                opacityFrom: 0.5,
                opacityTo: 0.05,
                stops: [0, 100]
            }
        },
        dataLabels: {
            enabled: false
        },
        markers: {
            size: 4,
            strokeWidth: 2,
            strokeColors: '#ffffff',
            hover: {
                size: 7,
                sizeOffset: 2
            }
        },
        xaxis: {
            categories: defaultLabels,
            title: {
                text: 'Measurement Number',
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
        grid: {
            borderColor: 'rgba(0, 0, 0, 0.08)',
            strokeDashArray: 2,
            padding: {
                left: 20,
                right: 20,
                bottom: 20
            },
            xaxis: {
                lines: {
                    show: true
                }
            }
        },
        tooltip: {
            theme: 'dark',
            shared: true,
            intersect: false,
            style: {
                fontSize: '12px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            },
            y: {
                formatter: function(value) {
                    return value.toFixed(2);
                }
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'left',
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
        }
    };

    trendsChart = new ApexCharts(canvas, options);
    trendsChart.render();
    
    // Make chart globally accessible
    if (typeof window !== 'undefined') {
        window.trendsChart = trendsChart;
    }
    
    // Force resize after render to ensure correct width
    setTimeout(() => {
        if (trendsChart) {
            window.dispatchEvent(new Event('resize'));
        }
    }, 100);

    async function loadChartData() {
        try {
            // Check if there's an active session - if so, only show current session data
            const isActiveSession = typeof window !== 'undefined' && 
                                   window.currentSessionId && 
                                   typeof window.isSessionActive !== 'undefined' && 
                                   window.isSessionActive;
            
            let recent = [];
            
            if (isActiveSession && typeof window !== 'undefined' && typeof window.measurements !== 'undefined' && window.measurements && window.measurements.length > 0) {
                // During active session, use current session measurements
                recent = window.measurements.slice(-20).map(m => ({
                    avgSize: parseFloat(m.avgSize || 0),
                    minSize: parseFloat(m.minSize || m.avgSize || 0),
                    maxSize: parseFloat(m.maxSize || m.avgSize || 0),
                    timestamp: m.timestamp
                }));
            } else {
                // No active session - fetch from database
                const currentUser = getCurrentUser();
                if (!currentUser) return;
                
                const recordsResponse = await apiRequest(API_CONFIG.ENDPOINTS.RECORDS);
                const allRecords = recordsResponse.records || [];
                const userRecords = allRecords.filter(r => r.user_id === currentUser.id || r.operator === currentUser.username);
                
                // Extract min/max from metadata
                recent = userRecords.slice(-20).map(r => {
                    let minSize = parseFloat(r.avg_size || 0);
                    let maxSize = parseFloat(r.avg_size || 0);
                    
                    // Try to get min/max from metadata
                    if (r.metadata) {
                        try {
                            const metadata = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
                            if (metadata.min_size) minSize = parseFloat(metadata.min_size);
                            if (metadata.max_size) maxSize = parseFloat(metadata.max_size);
                        } catch (e) {
                            // If metadata parsing fails, use avg_size
                        }
                    }
                    
                    return {
                        avgSize: parseFloat(r.avg_size || 0),
                        minSize: minSize,
                        maxSize: maxSize,
                        timestamp: r.timestamp
                    };
                });
            }
            
            let labels = recent.map((m, i) => String(i + 1));
            let avgSizes = recent.map(m => m.avgSize);
            let minSizes = recent.map(m => m.minSize);
            let maxSizes = recent.map(m => m.maxSize);

        if (trendsChart) {
            // If we have less than 20 measurements, pad to show at least 10 points for better visualization
            const minPoints = Math.max(10, recent.length || 1);
            while (labels.length < minPoints) {
                labels.push(String(labels.length + 1));
            }
            while (avgSizes.length < minPoints) {
                avgSizes.push(0);
            }
            while (minSizes.length < minPoints) {
                minSizes.push(0);
            }
            while (maxSizes.length < minPoints) {
                maxSizes.push(0);
            }
            
            // Limit to 20 points max for readability
            const maxPoints = 20;
            trendsChart.updateOptions({
                xaxis: {
                    categories: labels.slice(0, maxPoints)
                }
            });
            trendsChart.updateSeries([
                { name: 'Average Size', data: avgSizes.slice(0, maxPoints) },
                { name: 'Min Size', data: minSizes.slice(0, maxPoints) },
                { name: 'Max Size', data: maxSizes.slice(0, maxPoints) }
            ]);
        }
        } catch (error) {
            console.error('Failed to load trends chart data:', error);
        }
    }

    // Load initial data - check if session is active
    // During active session, charts will be updated by updateChartsWithCurrentSession()
    // When no active session, show all historical data
    loadChartData();
    
    // Set up interval to update charts (only when not in active session)
    const chartUpdateInterval = setInterval(() => {
        // Check if session is active - if so, don't update (let updateChartsWithCurrentSession handle it)
        const isActiveSession = typeof window !== 'undefined' && 
                               window.currentSessionId && 
                               typeof window.isSessionActive !== 'undefined' && 
                               window.isSessionActive;
        
        if (!isActiveSession) {
            loadChartData();
        }
    }, 5000); // Update every 5 seconds when not in active session
    
    // Store interval ID for cleanup if needed
    if (typeof window !== 'undefined') {
        window.trendsChartInterval = chartUpdateInterval;
    }
    
    // Listen for chart update events
    if (typeof window !== 'undefined') {
        window.addEventListener('chartsUpdate', () => {
            // Only update from event if not in active session
            const isActiveSession = typeof window !== 'undefined' && 
                                   window.currentSessionId && 
                                   typeof window.isSessionActive !== 'undefined' && 
                                   window.isSessionActive;
            
            if (!isActiveSession) {
                loadChartData();
            }
        });
    }
}

// Force charts to resize after initialization
let isResizing = false;

function resizeAllCharts() {
    if (isResizing) return;
    isResizing = true;
    
    if (distributionChart) {
        distributionChart.updateOptions({
            chart: { width: '100%' }
        }, false, false);
    }
    if (trendsChart) {
        trendsChart.updateOptions({
            chart: { width: '100%' }
        }, false, false);
    }
    
    setTimeout(() => {
        isResizing = false;
    }, 100);
}

// Start initialization - wait for everything to load
window.addEventListener('load', function() {
    // Wait for CSS to be fully applied
    setTimeout(initUserCharts, 300);
    // Resize charts multiple times to ensure correct sizing
    setTimeout(resizeAllCharts, 600);
    setTimeout(resizeAllCharts, 1000);
    setTimeout(resizeAllCharts, 2000);
});

// Handle window resize with debouncing
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeAllCharts, 150);
});
