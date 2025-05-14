const twilio = require('twilio');
const { accountSid, authToken, from } = require('../config/twilio');
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
    throw error; // Rethrow so your main route can handle it if needed
  }
};
