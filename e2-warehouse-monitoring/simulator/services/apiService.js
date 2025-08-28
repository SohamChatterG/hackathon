// simulator/services/apiService.js
const axios = require('axios');

const sendData = async (endpoint, payload, token) => {
    if (!token) {
        console.error('Error: JWT Token is not configured. Please check your .env file and simulator/config/index.js');
        return;
    }

    try {
        await axios.post(endpoint, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log(`Successfully sent data for ${payload.sensorId}:`, payload);
    } catch (error) {
        console.error(`Error sending data for ${payload.sensorId}:`, error.response ? error.response.data.message : error.message);
    }
};

module.exports = { sendData };