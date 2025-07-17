// require('dotenv').config();
const twilio = require('twilio');

// Load credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

module.exports = async function sendOtp(phone, otp) {
  try {
    const message = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from,
      to: phone
    });

    console.log("Twilio message sent:", message.sid);
    return message;
  } catch (error) {
    console.error("Twilio error:", error.message);
    throw error;
  }
};
