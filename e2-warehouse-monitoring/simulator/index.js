const config = require('./config');
const { generateReading } = require('./utils/dataGenerator');
const { sendData } = require('./services/apiService');
const axios = require('axios');

const getTargetSensors = async () => {
    const targetZone = process.env.SIM_TARGET_ZONE;
    const targetSensor = process.env.SIM_TARGET_SENSOR;

    // If no targeting requested, use configured list
    if (!targetZone && !targetSensor) return config.SENSORS;

    try {
        // Derive main app base URL from API_ENDPOINT (strip path)
        const base = config.API_ENDPOINT.replace(/\/api\/.*/i, '') || process.env.SIM_MAIN_APP_URL || 'http://localhost:5001';
        const res = await axios.get(`${base}/api/sensors`, {
            headers: { Authorization: `Bearer ${config.JWT_TOKEN}` },
            timeout: 5000,
        });

        const all = res.data.data || [];

        // Filter by sensor id or zone if requested
        let filtered = all;
        if (targetSensor) filtered = filtered.filter(s => s.sensorId === targetSensor);
        if (targetZone) filtered = filtered.filter(s => (s.zone && (s.zone._id === targetZone || s.zone.name === targetZone)));

        if (!filtered || filtered.length === 0) {
            console.log('No sensors found from main app for the targeting criteria, falling back to configured SENSORS.');
            return config.SENSORS;
        }

        // Map to simulator sensor objects BUT DO NOT PASS THROUGH any min/max overrides from main app.
        // This forces the simulator to use the global RANGE (or per-sensor overrides defined in simulator/config).
        const sensors = filtered.map(s => ({
            sensorId: s.sensorId,
            warehouseId: s.warehouseId || (s.zone ? s.zone.name : 'unknown'),
            // intentionally omit minTemperature/maxTemperature/minHumidity/maxHumidity
        }));

        return sensors;
    } catch (error) {
        console.error('Failed to fetch sensors from main app, falling back to configured SENSORS:', error.message || error);
        return config.SENSORS;
    }
};

let activeSensors = config.SENSORS;

const runSimulation = () => {
    if (!activeSensors || activeSensors.length === 0) return;
    console.log('Running simulation cycle...');
    activeSensors.forEach(sensor => {
        const reading = generateReading(sensor);
        const payload = {
            ...reading,
            sensorId: sensor.sensorId,
            warehouseId: sensor.warehouseId,
        };
        sendData(config.API_ENDPOINT, payload, config.JWT_TOKEN);
    });
};

// Bootstrap: if targeting is requested, fetch sensors first then start interval
const bootstrap = async () => {
    activeSensors = await getTargetSensors();
    console.log('Simulating sensors:', activeSensors.map(s => s.sensorId).join(', '));
    setInterval(runSimulation, config.SIMULATION_INTERVAL_MS);
};

bootstrap();

console.log('--- IoT Sensor Simulator ---');
console.log(`Target API: ${config.API_ENDPOINT}`);
console.log(`Sending data every ${config.SIMULATION_INTERVAL_MS / 1000} seconds...`);
console.log('Press CTRL+C to stop.');
console.log('----------------------------');

// Run the simulation on a set interval
setInterval(runSimulation, config.SIMULATION_INTERVAL_MS);