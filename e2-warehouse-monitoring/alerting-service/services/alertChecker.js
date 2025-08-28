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

// Helper function to send all types of notifications
const sendAllNotifications = (users, sensor, reading, alert, zone) => {
    const isTemp = sensor.type === 'temperature';
    const value = isTemp ? reading.temperature : reading.humidity;
    const unit = isTemp ? sensor.temperatureUnit : '%';
    const min = isTemp ? sensor.minTemperature : sensor.minHumidity;
    const max = isTemp ? sensor.maxTemperature : sensor.maxHumidity;

    const alertMessage = `Alert for sensor "${sensor.sensorId}" in zone "${zone.name}": ${sensor.type} of ${value}${unit} is outside the safe range of ${min}${unit} to ${max}${unit}. Please check the dashboard.`;

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

        for (const sensor of sensors) {
            const reading = readingsMap.get(sensor.sensorId);
            if (!reading) {
                console.log(`No readings yet for sensor ${sensor.sensorId}`);
                continue;
            }
            if (!sensor.zone) {
                console.log(`Sensor ${sensor.sensorId} has no zone assigned; skipping alert check.`);
                continue;
            }

            const isTemp = sensor.type === 'temperature';
            const rawValue = isTemp ? reading.temperature : reading.humidity;
            const value = typeof rawValue === 'string' ? Number(rawValue) : rawValue;
            if (value == null || Number.isNaN(value)) {
                console.log(`Invalid reading value for sensor ${sensor.sensorId}:`, rawValue);
                continue;
            }

            // Support both legacy top-level fields and the nested thresholds object
            const min = isTemp
                ? (sensor.minTemperature ?? sensor.thresholds?.temperature?.min)
                : (sensor.minHumidity ?? sensor.thresholds?.humidity?.min);
            const max = isTemp
                ? (sensor.maxTemperature ?? sensor.thresholds?.temperature?.max)
                : (sensor.maxHumidity ?? sensor.thresholds?.humidity?.max);

            if (min == null && max == null) {
                console.log(`Skipping sensor ${sensor.sensorId} — no thresholds configured.`);
                continue;
            }

            const isBreached = (min != null && value < min) || (max != null && value > max);

            const existingAlert = await Alert.findOne({ sensor: sensor._id, status: { $ne: 'resolved' } });

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
                        triggeredAt: new Date(),
                        history: [{ status: 'triggered', timestamp: new Date(), notes: `Initial breach detected. Value: ${value}` }],
                        consecutiveBreaches: 1,
                    });
                    escalationChanged = true; // New alert, so notify
                } else {
                    alert.consecutiveBreaches += 1;

                    if (alert.consecutiveBreaches >= 6 && alert.escalationLevel !== 'Admin') {
                        alert.escalationLevel = 'Admin';
                        alert.history.push({ status: 'escalated', timestamp: new Date(), notes: 'Escalated to Admin' });
                        escalationChanged = true;
                    } else if (alert.consecutiveBreaches >= 3 && alert.escalationLevel === 'Operator') {
                        alert.escalationLevel = 'Manager';
                        alert.history.push({ status: 'escalated', timestamp: new Date(), notes: 'Escalated to Manager' });
                        escalationChanged = true;
                    }
                }

                await alert.save();
                await notifyMainApp('alert-update', alert);

                if (escalationChanged) {
                    const usersToNotify = await findUsersToNotify(sensor.zone._id, alert.escalationLevel);
                    if (usersToNotify.length > 0) {
                        sendAllNotifications(usersToNotify, sensor, reading, alert, sensor.zone);
                    }
                }
            } else if (existingAlert) {
                existingAlert.status = 'resolved';
                existingAlert.resolvedAt = new Date();
                existingAlert.consecutiveBreaches = 0;
                existingAlert.history.push({ status: 'resolved', timestamp: new Date(), notes: 'Sensor reading returned to normal.' });
                await existingAlert.save();
                await notifyMainApp('alert-update', existingAlert);
            }
        }
    } catch (error) {
        console.error('Error checking alerts:', error);
    }
};

module.exports = { checkAlerts };