import db from '../DB/dbconfig.js';
import nodemailer from 'nodemailer';

const sendEmailVerification = async (email, token) => {
  console.log("Sending verification email to:", email);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || "shantanusharma9144@gmail.com",
      pass: process.env.EMAIL_PASS || "pwjn tpac atkn cvrc",
    }
  });

  // Point to frontend URL, not backend API
  const verificationUrl = `http://localhost:5173/verify-email/${token}?email=${encodeURIComponent(email)}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER || "shantanusharma9144@gmail.com",
    to: email,
    subject: 'Verify your Email - Podcast Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Podcast Hub!</h2>
        <p>Thank you for registering with us. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 15 minutes for security reasons.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
      </div>
    `
  });
};

export default sendEmailVerification;




