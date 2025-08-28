const config = require('../config');

const randBetween = (min, max) => min + Math.random() * (max - min);

const clampAndRound = (num, decimals = 2) => Number(num.toFixed(decimals));

// sensor: the full sensor object from config.SENSORS (may contain overrides)
const generateReading = (sensor) => {
    // Use single global range but allow per-sensor overrides
    const minTemperature = (sensor.minTemperature !== undefined && sensor.minTemperature !== null)
        ? Number(sensor.minTemperature)
        : config.RANGE.minTemperature;
    const maxTemperature = (sensor.maxTemperature !== undefined && sensor.maxTemperature !== null)
        ? Number(sensor.maxTemperature)
        : config.RANGE.maxTemperature;

    const minHumidity = (sensor.minHumidity !== undefined && sensor.minHumidity !== null)
        ? Number(sensor.minHumidity)
        : config.RANGE.minHumidity;
    const maxHumidity = (sensor.maxHumidity !== undefined && sensor.maxHumidity !== null)
        ? Number(sensor.maxHumidity)
        : config.RANGE.maxHumidity;

    // Safety: if min > max swap them
    const [tMin, tMax] = minTemperature <= maxTemperature ? [minTemperature, maxTemperature] : [maxTemperature, minTemperature];
    const [hMin, hMax] = minHumidity <= maxHumidity ? [minHumidity, maxHumidity] : [maxHumidity, minHumidity];

    const temperature = clampAndRound(randBetween(tMin, tMax), 2);
    const humidity = clampAndRound(randBetween(hMin, hMax), 2);

    return { temperature, humidity };
};

module.exports = { generateReading };