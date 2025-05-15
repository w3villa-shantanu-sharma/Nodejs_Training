const db = require('../DB/dbconfig');
require('dotenv').config()
const nodemailer = require('nodemailer');
// const { secret, expiresIn } = require('../config/jwt');
// const jwt = require('jsonwebtoken');

const sendEmailVerification = async (email ,token) => {
    //token generate
    console.log("Sending verification email to:", email);

    // const token = jwt.sign({ email : user.email}, secret, { expiresIn });


    //store in db
    // await db.query('INSERT  INTO email_verifications (email ,token) VALUES (? , ? )', [email, token]);


    //transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || "shantanusharma9144@gmail.com",
            pass: process.env.EMAIL_PASS || "pwjn tpac atkn cvrc",
        }
    });

    console.log(process.env.EMAIL_USER);
    

    const verificationUrl = `http://localhost:4000/api/users/verify-email/${token}`;


    await transporter.sendMail({
        from: process.env.EMAIL_USER || "shantanusharma9144@gmail.com",
        to: email,
        subject: 'Verify your Email',
        html: `<h3>Click below to verify:</h3><a href="${verificationUrl}">Verify Email</a>`
    });
    console.log(verificationUrl);
};


module.exports = sendEmailVerification;




