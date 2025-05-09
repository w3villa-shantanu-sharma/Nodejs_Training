const db = require('../DB/dbconfig');
require('dotenv')
const nodemailer = require('nodemailer');
const { secret, expiresIn } = require('../config/jwt');
const jwt = require('jsonwebtoken');

const sendEmailVerification = async (user) => {
    //token generate
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn });


    //store in db
    await db.query('INSERT  INTO email_verifications (user_Id ,token) VALUES (? , ? )', [user.id, token]);


    //transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    console.log(process.env.EMAIL_USER);
    

    const verificationUrl = `http://localhost:4000/api/users/verify-email/${token}`;


    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Verify your Email',
        html: `<h3>Click below to verify:</h3><a href="${verificationUrl}">Verify Email</a>`
    });
    console.log(verificationUrl);
};


module.exports = sendEmailVerification;




