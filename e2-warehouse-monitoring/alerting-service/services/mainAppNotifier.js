// alerting-service/services/mainAppNotifier.js
const axios = require('axios');

const notifyMainApp = async (eventType, alert) => {
    try {
        const populatedAlert = await alert.populate([
            { path: 'sensor', select: 'sensorId type' },
            { path: 'zone', select: 'name' }
        ]);

        await axios.post(`${process.env.MAIN_APP_API_URL}/api/alerts/notify`, populatedAlert, {
            headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY }
        });
        console.log(`Successfully notified main-app of ${eventType}.`);
    } catch (error) {
        console.error('Error notifying main-app:', error.response ? error.response.data.message : error.message);
    }
};

module.exports = { notifyMainApp };