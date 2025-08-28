// alerting-service/index.js
require('dotenv').config();
const cron = require('node-cron');
const connectDB = require('./config/db');
const { checkAlerts } = require('./services/alertChecker');

console.log('--- Alerting Service ---');

// Connect to Database
connectDB();

// Schedule the alert check to run based on the interval in .env
cron.schedule(process.env.ALERT_CHECK_INTERVAL, checkAlerts);

console.log(`Alerting service started. Will check for alerts every 60 seconds.`);
console.log('------------------------');