const Alert = require('../models/Alert');
const Reading = require('../models/Reading');
const Sensor = require('../models/Sensor');
const User = require('../models/User');
const Zone = require('../models/Zone'); // <-- Register the Zone schema
const { sendEmail } = require('./notificationService');
const { notifyMainApp } = require('./mainAppNotifier');

// Helper function to find the correct users to notify based on zone and escalation level
const findUsersToNotify = async (zoneId, escalationLevel) => {
    if (escalationLevel === 'Admin') {
        return await User.find({ role: 'Admin' }).select('name email phoneNumber');
    }
    return await User.find({
        zones: zoneId,
        role: escalationLevel,
    }).select('name email phoneNumber');
};


// Helper function to send notifications for a specific metric
const sendAllNotifications = (users, sensor, reading, alert, zone, metric) => {
    let value, unit, min, max, metricLabel;
    if (metric === 'temperature') {
        value = reading.temperature;
        unit = sensor.temperatureUnit || sensor.thresholds?.temperature?.unit || 'C';
        min = sensor.minTemperature ?? sensor.thresholds?.temperature?.min;
        max = sensor.maxTemperature ?? sensor.thresholds?.temperature?.max;
        metricLabel = 'Temperature';
    } else {
        value = reading.humidity;
        unit = '%';
        min = sensor.minHumidity ?? sensor.thresholds?.humidity?.min;
        max = sensor.maxHumidity ?? sensor.thresholds?.humidity?.max;
        metricLabel = 'Humidity';
    }
    // Fallbacks for missing data
    const formatVal = v => (v == null || Number.isNaN(v) ? 'N/A' : Number(v).toFixed(2));
    value = formatVal(value);
    min = formatVal(min);
    max = formatVal(max);
    unit = unit || '';

    const alertMessage = `Alert for sensor "${sensor.sensorId}" in zone "${zone.name}": ${metricLabel} of ${value}${unit} is outside the safe range of ${min}${unit} to ${max}${unit}. Please check the dashboard.`;

    users.forEach(user => {
        if (user.email) {
            sendEmail({
                to: user.email,
                subject: `[${alert.severity.toUpperCase()}] Alert: ${sensor.sensorId}`,
                message: alertMessage
            });
        }
        if (user.phoneNumber) {
            console.log(`\n*************\nSMS to be sent to ${user.phoneNumber}\n*********\n`);
        }
    });
};

const checkAlerts = async () => {
    console.log('Checking for alerts with new threshold logic...');
    try {
        const sensors = await Sensor.find().populate('zone');
        if (sensors.length === 0) return;

        const sensorIds = sensors.map(s => s.sensorId);

        const latestReadings = await Reading.aggregate([
            { $match: { sensorId: { $in: sensorIds } } },
            { $sort: { timestamp: -1 } },
            { $group: { _id: '$sensorId', latestDoc: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$latestDoc' } }
        ]);

        const readingsMap = new Map(latestReadings.map(r => [r.sensorId, r]));

        const now = new Date();
        const FIVE_MINUTES_MS = 5 * 60 * 1000;

        for (const sensor of sensors) {
            const reading = readingsMap.get(sensor.sensorId);
            if (!reading) {
                // No reading at all: resolve any open alerts for this sensor
                for (const metric of ['temperature', 'humidity']) {
                    const existingAlert = await Alert.findOne({ sensor: sensor._id, status: { $ne: 'resolved' }, metric });
                    if (existingAlert) {
                        existingAlert.status = 'resolved';
                        existingAlert.resolvedAt = now;
                        existingAlert.consecutiveBreaches = 0;
                        existingAlert.history.push({ status: 'resolved', timestamp: now, notes: 'No data received for over 5 minutes. Auto-resolved.' });
                        await existingAlert.save();
                        await notifyMainApp('alert-update', existingAlert);
                    }
                }
                console.log(`No readings yet for sensor ${sensor.sensorId}`);
                continue;
            }
            if (!sensor.zone) {
                console.log(`Sensor ${sensor.sensorId} has no zone assigned; skipping alert check.`);
                continue;
            }

            // Check if the latest reading is older than 5 minutes
            const readingTime = new Date(reading.timestamp);
            if (now - readingTime > FIVE_MINUTES_MS) {
                for (const metric of ['temperature', 'humidity']) {
                    const existingAlert = await Alert.findOne({ sensor: sensor._id, status: { $ne: 'resolved' }, metric });
                    if (existingAlert) {
                        existingAlert.status = 'resolved';
                        existingAlert.resolvedAt = now;
                        existingAlert.consecutiveBreaches = 0;
                        existingAlert.history.push({ status: 'resolved', timestamp: now, notes: 'No data received for over 5 minutes. Auto-resolved.' });
                        await existingAlert.save();
                        await notifyMainApp('alert-update', existingAlert);
                    }
                }
                console.log(`No recent data for sensor ${sensor.sensorId} (last: ${reading.timestamp}). Auto-resolved alerts.`);
                continue;
            }

            // Check both temperature and humidity for every sensor
            for (const metric of ['temperature', 'humidity']) {
                let value = metric === 'temperature' ? reading.temperature : reading.humidity;
                value = typeof value === 'string' ? Number(value) : value;
                if (value == null || Number.isNaN(value)) {
                    console.log(`Invalid ${metric} value for sensor ${sensor.sensorId}:`, value);
                    continue;
                }

                let min = metric === 'temperature'
                    ? (sensor.minTemperature ?? sensor.thresholds?.temperature?.min)
                    : (sensor.minHumidity ?? sensor.thresholds?.humidity?.min);
                let max = metric === 'temperature'
                    ? (sensor.maxTemperature ?? sensor.thresholds?.temperature?.max)
                    : (sensor.maxHumidity ?? sensor.thresholds?.humidity?.max);

                if (min == null && max == null) {
                    console.log(`Skipping sensor ${sensor.sensorId} — no ${metric} thresholds configured.`);
                    continue;
                }

                const isBreached = (min != null && value < min) || (max != null && value > max);

                // Use a unique alert per sensor+metric (optional: add metric to alert if needed)
                const existingAlert = await Alert.findOne({ sensor: sensor._id, status: { $ne: 'resolved' }, metric });

                if (isBreached) {
                    let alert = existingAlert;
                    let escalationChanged = false;

                    if (!alert) {
                        alert = new Alert({
                            sensor: sensor._id,
                            zone: sensor.zone._id,
                            status: 'triggered',
                            severity: 'medium',
                            escalationLevel: 'Operator',
                            triggeredAt: now,
                            history: [{ status: 'triggered', timestamp: now, notes: `Initial breach detected. Value: ${value}` }],
                            consecutiveBreaches: 1,
                            metric,
                        });
                        escalationChanged = true; // New alert, so notify
                    } else {
                        alert.consecutiveBreaches += 1;

                        if (alert.consecutiveBreaches >= 6 && alert.escalationLevel !== 'Admin') {
                            alert.escalationLevel = 'Admin';
                            alert.history.push({ status: 'escalated', timestamp: now, notes: 'Escalated to Admin' });
                            escalationChanged = true;
                        } else if (alert.consecutiveBreaches >= 3 && alert.escalationLevel === 'Operator') {
                            alert.escalationLevel = 'Manager';
                            alert.history.push({ status: 'escalated', timestamp: now, notes: 'Escalated to Manager' });
                            escalationChanged = true;
                        }
                    }

                    await alert.save();
                    await notifyMainApp('alert-update', alert);

                    if (escalationChanged) {
                        const usersToNotify = await findUsersToNotify(sensor.zone._id, alert.escalationLevel);
                        if (usersToNotify.length > 0) {
                            sendAllNotifications(usersToNotify, sensor, reading, alert, sensor.zone, metric);
                        }
                    }
                } else if (existingAlert) {
                    existingAlert.status = 'resolved';
                    existingAlert.resolvedAt = now;
                    existingAlert.consecutiveBreaches = 0;
                    existingAlert.history.push({ status: 'resolved', timestamp: now, notes: 'Sensor reading returned to normal.' });
                    await existingAlert.save();
                    await notifyMainApp('alert-update', existingAlert);
                }
            }
        }
    } catch (error) {
        console.error('Error checking alerts:', error);
    }
};

module.exports = { checkAlerts };