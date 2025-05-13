const db = require('../DB/dbconfig');
const bcrypt = require('bcrypt');
const sendEmailVerification = require('../utils/sendEmailVerification');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');



const Messages = require('../constants/messages');
const StatusCodes = require('../constants/statusCode');
const { secret, expiresIn } = require('../config/jwt');

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const userUUID = uuidv4();


  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_EMAIL_FORMAT });
  }

  const [existed] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existed.length) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.EMAIL_ALREADY_REGISTERED });
  }
  
  const [existingTemp] = await db.query("SELECT * FROM email_verifications WHERE JSON_EXTRACT(data , '$.email') = ?", [email]);
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = jwt.sign({ email }, secret, { expiresIn });

  const userData = {
    uuid : userUUID,
    name , 
    email ,
    password : hashedPassword
  };

  if (existingTemp.length) {
    const previous = existingTemp[0];
    const now = new Date();
    const lastUpdated = new Date(previous.updated_at);
    const diffMinutes = (now - lastUpdated) / 1000 / 60;

    if (diffMinutes < 15) {
      return res.status(400).json({ message: Messages.ERROR.REVERIFIED_EMAIL });
    }

    await db.query(
      "UPDATE email_verifications SET data = ?, token = ?, updated_at = NOW() WHERE user_uuid = ?",
      [JSON.stringify(userData), token, previous.user_uuid]
    );
    
    await sendEmailVerification(email, token);
    return res.status(200).json({ message: Messages.SUCCESS.RESEND_VERIFY_LINK });
  }

  // First time register
  // const hashedPassword = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO email_verifications (user_uuid, data, token) VALUES (?, ?, ?)",
    [userUUID, JSON.stringify(userData), token]
  );
    

  await sendEmailVerification(email, token);
  res.status(201).json({ message: Messages.SUCCESS.USER_REGISTERED });
};


exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  // console.log(token);
  
  const jwt = require('jsonwebtoken');
  const { secret } = require('../config/jwt');

  try {
    // Verify token
    const decoded = jwt.verify(token, secret);
    console.log("decoded  : ",  decoded);
    console.log("decode email :",decoded.email);
    
    
    const email = decoded.email;
    // const token = decoded.token;

    // Check if token exists in DB
    const [rows] = await db.query(
      `SELECT * FROM email_verifications 
       WHERE JSON_EXTRACT(data, '$.email') = ? 
         AND token = ? 
         AND updated_at >= NOW() - INTERVAL 15 MINUTE`,
      [email, token]
    );

    console.log(rows.length);
    
    
    
    if (rows.length === 0) return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });


    // const user = rows[0];
    // console.log(user); // const user = rows[0];
    // console.log(user);
    
    const userData  = (rows[0].data);
    console.log(userData);
    
    console.log(userData.email !== email);
    

    if (userData.email !== email) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
    }

    console.log("Checking for:", email, token);


    // Move to users table
    await db.query(
      "INSERT INTO users (uuid, name, email, password) VALUES (?, ?, ?, ?)",
      [userData.uuid, userData.name, userData.email, userData.password]
    );

    // Update user as verified
    // await db.query('UPDATE users SET isVerified = true WHERE id = ?', [userId]);

    // Delete verification token
    // await db.query('DELETE FROM email_verifications WHERE user_id = ?', [userId]);
    // await db.query("DELETE FROM email_verifications WHERE email = ?", [email]);
    await db.query("DELETE FROM email_verifications WHERE user_uuid = ?", [userData.uuid]);



    res.json({ message: Messages.SUCCESS.EMAIL_VERIFIED });
  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;


  // const [rows] = await db.query("SELECT * FROM email_verifications WHERE email = ?", [email]);

  const [rows] = await db.query(
    `SELECT * FROM email_verifications WHERE JSON_EXTRACT(data, '$.email') = ?`,
    [email]
  );

  if (!rows.length) {
      return res.status(400).json({ message:Messages.ERROR.PENDING_VERFICATION});
  }

  const user = rows[0];
  const now = new Date();
  const updatedAt = new Date(user.updated_at);
  const diffMinutes = (now - updatedAt) / 1000 / 60;

  if (diffMinutes < 15) {
      return res.status(400).json({ message:Messages.ERROR.REVERIFIED_EMAIL });
  }

  const token = jwt.sign({ email }, secret, { expiresIn });

  
  await db.query(
    `UPDATE email_verifications 
     SET token = ?, updated_at = NOW() 
     WHERE JSON_EXTRACT(data, '$.email') = ?`,
    [token, email]
  );

  await sendEmailVerification(email, token);
  res.status(200).json({ message: Messages.SUCCESS.RESEND_VERIFY_LINK});
};
