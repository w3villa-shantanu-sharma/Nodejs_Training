import nodemailer from 'nodemailer';

/**
 * Send an email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise} - Resolves when email is sent
 */
export default async function sendEmail({ to, subject, html }) {
  // Validate email address before sending
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.error('Invalid email address provided:', to);
    throw new Error('Valid email address is required');
  }
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to, // Ensure 'to' is properly defined
      subject: subject,
      html: html
    });
    
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}