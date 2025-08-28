// simulator/config/index.js
// We need to specify the path to the root .env file
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Helper to parse numbers from env with fallback
const parseEnvNum = (key, fallback) => {
    const v = process.env[key];
    if (v === undefined || v === null || v === '') return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
};

// Single-type defaults (matches prior behavior roughly)
const DEFAULT_RANGE = {
    minTemperature: 2.5,
    maxTemperature: 4.5,
    minHumidity: 85,
    maxHumidity: 95,
};

const RANGE = {
    minTemperature: parseEnvNum('SIM_MIN_TEMPERATURE', DEFAULT_RANGE.minTemperature),
    maxTemperature: parseEnvNum('SIM_MAX_TEMPERATURE', DEFAULT_RANGE.maxTemperature),
    minHumidity: parseEnvNum('SIM_MIN_HUMIDITY', DEFAULT_RANGE.minHumidity),
    maxHumidity: parseEnvNum('SIM_MAX_HUMIDITY', DEFAULT_RANGE.maxHumidity),
};

module.exports = {
    API_ENDPOINT: process.env.SIM_API_ENDPOINT || 'http://localhost:5001/api/ingest',
    JWT_TOKEN: process.env.SIMULATOR_JWT_TOKEN,
    SIMULATION_INTERVAL_MS: parseEnvNum('SIMULATION_INTERVAL_MS', 60000), // ms
    // Mock data for our sensors is also configuration. Each sensor entry may optionally include per-sensor overrides:
    // { sensorId: 'S-101', warehouseId: 'WH-A', minTemperature: 2.8, maxTemperature: 4.2 }
    SENSORS: [
        { sensorId: 'S-101', warehouseId: 'WH-A' },
        { sensorId: 'S-102', warehouseId: 'WH-A' },
        { sensorId: 'S-201', warehouseId: 'WH-B' },
    ],
    RANGE,
};