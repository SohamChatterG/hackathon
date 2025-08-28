// alerting-service/services/notificationService.js
const nodemailer = require('nodemailer');
// const twilio = require('twilio');

// --- Email Service (using Nodemailer) ---

// Configure the transporter for Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // your .env variable
        pass: process.env.EMAIL_PASS, // your .env variable for the App Password
    },
});

const sendEmail = async ({ to, subject, message }) => {
    try {
        await transporter.sendMail({
            from: `"E2 Warehouse Monitoring" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: message,
            html: `<p>${message}</p>`,
        });
        console.log(`✅ Email notification sent to ${to}`);
    } catch (error) {
        console.error("❌ Error sending email notification:", error);
    }
};


// --- SMS Service (using Twilio) ---

// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSms = async ({ to, message }) => {
    try {
        // await twilioClient.messages.create({
        //     body: message,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to,
        // });
        console.log(`✅ SMS notification sent to ${to}`);
    } catch (error) {
        console.error("❌ Error sending SMS notification:", error);
    }
};


module.exports = { sendEmail, sendSms };