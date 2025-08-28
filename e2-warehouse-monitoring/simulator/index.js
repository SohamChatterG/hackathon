// simulator/index.js
const config = require('./config');
const { generateReading } = require('./utils/dataGenerator');
const { sendData } = require('./services/apiService');

const runSimulation = () => {
    console.log('Running simulation cycle...');
    config.SENSORS.forEach(sensor => {
        const reading = generateReading(sensor);
        const payload = {
            ...reading,
            sensorId: sensor.sensorId,
            warehouseId: sensor.warehouseId,
        };
        sendData(config.API_ENDPOINT, payload, config.JWT_TOKEN);
    });
};

console.log('--- IoT Sensor Simulator ---');
console.log(`Target API: ${config.API_ENDPOINT}`);
console.log(`Sending data every ${config.SIMULATION_INTERVAL_MS / 1000} seconds...`);
console.log('Press CTRL+C to stop.');
console.log('----------------------------');

// Run the simulation on a set interval
setInterval(runSimulation, config.SIMULATION_INTERVAL_MS);