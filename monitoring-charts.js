// ApexCharts implementation with different colors for statistics

let performanceChart = null;
let sensorChart = null;
let chartUpdateInterval = null;

// Color palette - different colors for different statistics
const colors = {
    primary: '#00AFE0',
    secondary: '#FF6B6B',
    tertiary: '#4ECDC4',
    quaternary: '#FFE66D',
    quinary: '#95E1D3',
    senary: '#F38181'
};

function initMonitoringCharts() {
    if (typeof ApexCharts === 'undefined') {
        setTimeout(initMonitoringCharts, 100);
        return;
    }

    initializePerformanceChart();
    initializeSensorChart();
}

function initializePerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) {
        return;
    }

    // Destroy existing chart if it exists
    if (performanceChart) {
        performanceChart.destroy();
        performanceChart = null;
    }

    // Initialize with empty data first
    const labels = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i);
        labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }

    const options = {
        series: [
            {
                name: 'CPU',
                data: new Array(12).fill(0)
            },
            {
                name: 'Memory',
                data: new Array(12).fill(0)
            },
            {
                name: 'Disk',
                data: new Array(12).fill(0)
            },
            {
                name: 'Network',
                data: new Array(12).fill(0)
            }
        ],
        chart: {
            type: 'area',
            height: 350,
            width: '100%',
            toolbar: {
                show: true
            },
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 750
            }
        },
        colors: ['#2FA76E', '#FF6B6B', '#FFE66D', '#4ECDC4'],
        stroke: {
            curve: 'smooth',
            width: [3.5, 2.5, 2.5, 2.5]
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
            size: [4, 3, 3, 3],
            strokeWidth: [2.5, 2, 2, 2],
            strokeColors: '#ffffff',
            hover: {
                size: [7, 6, 6, 6],
                sizeOffset: 2
            }
        },
        xaxis: {
            categories: labels,
            title: {
                text: 'Time',
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
        yaxis: {
            min: 0,
            max: 100,
            title: {
                text: 'Usage (%)',
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
            strokeDashArray: 2,
            padding: {
                left: 20,
                right: 20,
                bottom: 20
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
                    return value + '%';
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

    performanceChart = new ApexCharts(canvas, options);
    performanceChart.render();

    function loadChartData() {
        // Check per-operator status first, then fall back to global
        const currentUser = getCurrentUser();
        let systemStatus;
        if (currentUser && currentUser.username) {
            const operatorStatus = localStorage.getItem(`systemStatus_${currentUser.username}`);
            systemStatus = operatorStatus !== null ? operatorStatus !== 'false' : localStorage.getItem('systemStatus') !== 'false';
        } else {
            systemStatus = localStorage.getItem('systemStatus') !== 'false';
        }
        
        if (!systemStatus) {
            // System is off, show empty chart
            if (performanceChart) {
                performanceChart.updateOptions({
                    xaxis: {
                        categories: []
                    }
                });
                performanceChart.updateSeries([
                    { name: 'CPU', data: [] },
                    { name: 'Memory', data: [] },
                    { name: 'Disk', data: [] },
                    { name: 'Network', data: [] }
                ]);
            }
            return;
        }

        const labels = [];
        const cpuData = [];
        const memoryData = [];
        const diskData = [];
        const networkData = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setHours(date.getHours() - i);
            labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
            cpuData.push(Math.floor(Math.random() * 30) + 30);
            memoryData.push(Math.floor(Math.random() * 30) + 50);
            diskData.push(Math.floor(Math.random() * 20) + 30);
            networkData.push(Math.floor(Math.random() * 20) + 20);
        }

        if (performanceChart) {
            performanceChart.updateOptions({
                xaxis: {
                    categories: labels
                }
            });
            performanceChart.updateSeries([
                { name: 'CPU', data: cpuData },
                { name: 'Memory', data: memoryData },
                { name: 'Disk', data: diskData },
                { name: 'Network', data: networkData }
            ]);
        }
    }

    // Load initial data
    loadChartData();
    
    // Clear any existing interval
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
    }
    
    // Update chart every 10 seconds
    chartUpdateInterval = setInterval(() => {
        loadChartData();
    }, 10000);
}

// Function to update performance chart based on system status
window.updatePerformanceChart = function(isOnline) {
    if (!performanceChart) return;
    
    if (isOnline) {
        // Restore chart data
        const labels = [];
        const cpuData = [];
        const memoryData = [];
        const diskData = [];
        const networkData = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setHours(date.getHours() - i);
            labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
            cpuData.push(Math.floor(Math.random() * 30) + 30);
            memoryData.push(Math.floor(Math.random() * 30) + 50);
            diskData.push(Math.floor(Math.random() * 20) + 30);
            networkData.push(Math.floor(Math.random() * 20) + 20);
        }

        performanceChart.updateOptions({
            xaxis: {
                categories: labels
            }
        });
        performanceChart.updateSeries([
            { name: 'CPU', data: cpuData },
            { name: 'Memory', data: memoryData },
            { name: 'Disk', data: diskData },
            { name: 'Network', data: networkData }
        ]);
    } else {
        // Blank out chart
        performanceChart.updateOptions({
            xaxis: {
                categories: []
            }
        });
        performanceChart.updateSeries([
            { name: 'CPU', data: [] },
            { name: 'Memory', data: [] },
            { name: 'Disk', data: [] },
            { name: 'Network', data: [] }
        ]);
    }
}

function initializeSensorChart() {
    const canvas = document.getElementById('sensorChart');
    if (!canvas) {
        return;
    }
    
    // Destroy existing chart if it exists
    if (sensorChart) {
        sensorChart.destroy();
        sensorChart = null;
    }

    // Store colors array for distributed colors
    const colorPalette = [
        '#2FA76E',
        '#FF6B6B',
        '#FFE66D',
        '#4ECDC4',
        '#95E1D3',
        '#F38181'
    ];
    
    // Initialize with empty state - will be populated from database
    let initialLabels = ['Loading...'];
    let initialData = [0];
    let initialColors = ['#E5E7EB']; // Gray color for loading state

    const options = {
        series: [{
            name: 'Sensor Activity',
            data: initialData
        }],
        chart: {
            type: 'bar',
            height: 350,
            width: '100%',
            toolbar: {
                show: true
            },
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
        colors: initialColors,
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '80%',
                distributed: true
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: initialLabels,
            title: {
                text: 'Sensor',
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
            },
            axisBorder: {
                show: false
            }
        },
        yaxis: {
            min: 0,
            max: 100,
            title: {
                text: 'Activity (%)',
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
                formatter: function(value, opts) {
                    const label = opts.w.globals.labels[opts.dataPointIndex];
                    if (label === 'No Sensors') {
                        return 'No sensors added yet';
                    }
                    return 'Activity: ' + value + '%';
                }
            }
        },
        legend: {
            show: false
        }
    };

    sensorChart = new ApexCharts(canvas, options);
    sensorChart.render();

    // Function to load sensor data
    async function loadSensorData() {
        console.log('loadSensorData called');
        try {
            const response = await apiRequest(API_CONFIG.ENDPOINTS.SENSORS, {
                method: 'GET'
            });
            console.log('Sensors API response:', response);
            const userSensors = response.sensors || [];
            console.log('User sensors:', userSensors);
            
            // Get per-operator sensorsStatus
            const currentUser = getCurrentUser();
            let sensorsStatus;
            if (currentUser && currentUser.username) {
                const operatorStatus = localStorage.getItem(`sensorsStatus_${currentUser.username}`);
                sensorsStatus = operatorStatus !== null ? operatorStatus !== 'false' : localStorage.getItem('sensorsStatus') !== 'false';
            } else {
                sensorsStatus = localStorage.getItem('sensorsStatus') !== 'false';
            }
            
            const colorPalette = [
                '#2FA76E',
                '#FF6B6B',
                '#FFE66D',
                '#4ECDC4',
                '#95E1D3',
                '#F38181'
            ];
            
            let labels = [];
            let data = [];
            let backgroundColors = [];
            
            if (userSensors.length > 0) {
                userSensors.forEach((sensor, index) => {
                    labels.push(sensor.name || `Sensor ${index + 1}`);
                    // Determine activity based on global toggle and individual sensor status
                    let activity = 0;
                    if (!sensorsStatus) {
                        // Global toggle is off, no activity
                        activity = 0;
                    } else {
                        // Global toggle is on, check individual sensor status
                        const sensorStatus = sensor.status || 'online';
                        activity = sensorStatus === 'online' 
                            ? Math.floor(Math.random() * 10) + 90  // 90-100% when online
                            : 0;
                    }
                    data.push(activity);
                    backgroundColors.push(colorPalette[index % colorPalette.length]);
                });
            } else {
                // Show empty state - no sensors added
                labels = ['No Sensors'];
                data = [0];
                backgroundColors = ['#E5E7EB']; // Gray color for empty state
            }

            if (sensorChart) {
                sensorChart.updateOptions({
                    xaxis: {
                        categories: labels
                    },
                    colors: backgroundColors
                });
                sensorChart.updateSeries([{
                    name: 'Sensor Activity',
                    data: data
                }]);
            }
        } catch (error) {
            console.error('Failed to load sensor data:', error);
        }
    }

    // Load initial data
    loadSensorData();
    
    // Update sensor chart every 10 seconds
    setInterval(() => {
        loadSensorData();
    }, 10000);
    
    // Listen for sensor updates from other pages
    window.addEventListener('sensorsUpdated', function() {
        loadSensorData();
    });
    
    // Listen for status changes from sensor page
    window.addEventListener('sensorStatusChanged', function() {
        loadSensorData();
    });
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'userSensors' || e.key === 'systemEvents') {
            loadSensorData();
        }
    });
}

// Function to update sensor chart based on sensor status
window.updateSensorChart = async function(isOnline) {
    if (!sensorChart) return;
    
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SENSORS, {
            method: 'GET'
        });
        const userSensors = response.sensors || [];
        
        const colorPalette = [
            '#2FA76E',
            '#FF6B6B',
            '#FFE66D',
            '#4ECDC4',
            '#95E1D3',
            '#F38181'
        ];
        
        if (userSensors.length > 0) {
            const labels = userSensors.map((sensor, index) => sensor.name || `Sensor ${index + 1}`);
            const data = isOnline 
                ? userSensors.map((sensor) => {
                const sensorStatus = sensor.status || 'online';
                return sensorStatus === 'online' ? Math.floor(Math.random() * 10) + 90 : 0;
              })
            : new Array(userSensors.length).fill(0);
        const backgroundColors = userSensors.map((sensor, index) => colorPalette[index % colorPalette.length]);
        
        sensorChart.updateOptions({
            xaxis: {
                categories: labels
            },
            colors: backgroundColors
        });
        sensorChart.updateSeries([{
            name: 'Sensor Activity',
            data: data
        }]);
        } else {
            sensorChart.updateOptions({
                xaxis: {
                    categories: ['No Sensors']
                },
                colors: ['#E5E7EB']
            });
            sensorChart.updateSeries([{
                name: 'Sensor Activity',
                data: [0]
            }]);
        }
    } catch (error) {
        console.error('Failed to update sensor chart:', error);
    }
}

// Start initialization - ensure ApexCharts is loaded first and page is ready
function waitForApexCharts() {
    // Check if we're on the monitoring page
    const perfChart = document.getElementById('performanceChart');
    const sensChart = document.getElementById('sensorChart');
    
    if (!perfChart && !sensChart) {
        // Not on monitoring page, don't initialize
        return;
    }
    
    // Hide profileLocation select if it's interfering
    const profileLocation = document.getElementById('profileLocation');
    if (profileLocation) {
        const modal = document.getElementById('profileModal');
        const modalDisplay = modal ? window.getComputedStyle(modal).display : 'none';
        if (modalDisplay !== 'block') {
            profileLocation.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important; pointer-events: none !important; height: 0 !important; width: 0 !important; overflow: hidden !important;';
        }
    }
    
    // Check if ApexCharts is loaded
    if (typeof ApexCharts === 'undefined') {
        setTimeout(waitForApexCharts, 100);
        return;
    }
    
    // Check if canvas elements are ready (at least one should exist)
    if (perfChart || sensChart) {
        try {
            initMonitoringCharts();
        } catch (error) {
            // Retry after a short delay
            setTimeout(waitForApexCharts, 500);
        }
    } else {
        // Canvas elements not ready yet, retry
        setTimeout(waitForApexCharts, 100);
    }
}

// Initialize when DOM is ready
function initializeChartsOnLoad() {
    // Use window.onload to ensure all scripts including ApexCharts are loaded
    if (window.addEventListener) {
        window.addEventListener('load', function() {
            setTimeout(waitForApexCharts, 100);
        });
    } else if (window.attachEvent) {
        window.attachEvent('onload', function() {
            setTimeout(waitForApexCharts, 100);
        });
    }
    
    // Also try on DOMContentLoaded as a fallback
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(waitForApexCharts, 200);
        });
    } else {
        // DOM already loaded, try immediately
        setTimeout(waitForApexCharts, 200);
    }
}

// Start initialization
initializeChartsOnLoad();
