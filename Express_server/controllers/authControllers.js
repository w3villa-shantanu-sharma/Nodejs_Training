const db = require('../DB/dbconfig');
const bcrypt = require('bcrypt');
const sendEmailVerification = require('../utils/sendEmailVerification');
const jwt = require('jsonwebtoken');


const Messages = require('../constants/messages');
const StatusCodes = require('../constants/statusCode');
const { secret, expiresIn } = require('../config/jwt');

exports.registerUser = async (req, res) => {

    const { name, email, password } = req.body;

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid email format' });
    }


    const [existed] = await db.query('Select * From users Where email  = ?', [email]);

    if (existed.length) return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.EMAIL_ALREADY_REGISTERED });

    const [existingTemp] = await db.query("SELECT * FROM email_verifications WHERE email = ?", [email]);
    if (existingTemp.length) {
      return res.status(400).json({ message: "Verification already sent. Check your inbox." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ email }, secret, { expiresIn });


    // Insert new user
    const [result] = await db.query(
        "INSERT INTO email_verifications (name, email, password, token) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, token]
      );

    console.log(result);
    

    const newUser = { id: result.insertId, email  , token};
    await sendEmailVerification(email , token);

    res.status(201).json({ message: Messages.SUCCESS.USER_REGISTERED });

};

exports.verifyEmail = async (req, res) => {
    const { token } = req.params;
    const jwt = require('jsonwebtoken');
    const { secret } = require('../config/jwt');

    try {
        // Verify token
        const decoded = jwt.verify(token, secret);
        const email  = decoded.email;

        // Check if token exists in DB
        const [rows] = await db.query('SELECT * FROM email_verifications WHERE token = ?', [token]);
        if (rows.length === 0) return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });


        const user = rows[0];

        // Move to users table
        await db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
          user.name,
          user.email,
          user.password
        ]);

        // Update user as verified
        // await db.query('UPDATE users SET isVerified = true WHERE id = ?', [userId]);

        // Delete verification token
        // await db.query('DELETE FROM email_verifications WHERE user_id = ?', [userId]);
        await db.query("DELETE FROM email_verifications WHERE email = ?", [email]);


        res.json({ message: Messages.SUCCESS.EMAIL_VERIFIED });
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
    }
};