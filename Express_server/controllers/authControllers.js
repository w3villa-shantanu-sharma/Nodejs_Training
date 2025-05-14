const db = require('../DB/dbconfig');
const bcrypt = require('bcrypt');
const sendEmailVerification = require('../utils/sendEmailVerification');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sendOtp = require('../utils/sendOTP')



const Messages = require('../constants/messages');
const StatusCodes = require('../constants/statusCode');
const { secret, expiresIn } = require('../config/jwt');

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) return res.status(400).json({ message: "Name and Email and Password are required" });

  const userUUID = uuidv4();


  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_EMAIL_FORMAT });
  }

  const [existed] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existed.length) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.EMAIL_ALREADY_REGISTERED });
  }
  console.log("Checking user in main DB...");


  const [existingTemp] = await db.query("SELECT * FROM email_verifications WHERE JSON_EXTRACT(data , '$.email') = ?", [email]);
  console.log("Checking user in temp verification...");


  const hashedPassword = await bcrypt.hash(password, 10);
  const token = jwt.sign({ email }, secret, { expiresIn });

  const userData = {
    uuid: userUUID,
    name,
    email,
    password: hashedPassword
  };

  //checking the token time and must be updated 
  if (existingTemp.length) {
    const previous = existingTemp[0];
    const now = new Date();
    const lastUpdated = new Date(previous.updated_at);
    const diffMinutes = (now - lastUpdated) / 1000 / 60;

    if (diffMinutes < 15) {
      return res.status(400).json({ message: Messages.ERROR.REVERIFIED_EMAIL });
    }


    //if not updated and then uodated it in db
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
  console.log("Incoming registration:", { name, email });



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
    console.log("decoded  : ", decoded);
    console.log("decode email :", decoded.email);


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

    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length) {
      return res.status(400).json({ message: 'Email already verified' });
    }




    if (rows.length === 0) return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });


    // const user = rows[0];
    // console.log(user); // const user = rows[0];
    // console.log(user);

    const userData = (rows[0].data);
    console.log(userData);

    console.log(userData.email !== email);


    if (userData.email !== email) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
    }

    console.log("Checking for:", email, token);


    // Move to users table
    // await db.query(
    //   "INSERT INTO users (uuid, name, email, password) VALUES (?, ?, ?, ?)",
    //   [userData.uuid, userData.name, userData.email, userData.password]
    // );

    await db.query(
      `INSERT INTO users (uuid, name, email, password, is_verified, next_action)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userData.uuid, userData.name, userData.email, userData.password, true, 'MOBILE_OTP']
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
    return res.status(400).json({ message: Messages.ERROR.NOT_PENDING_VERFICATION });
  }

  const user = rows[0];
  const now = new Date();
  const updatedAt = new Date(user.updated_at);
  const diffMinutes = (now - updatedAt) / 1000 / 60;

  if (diffMinutes < 15) {
    return res.status(400).json({ message: Messages.ERROR.REVERIFIED_EMAIL });
  }

  const token = jwt.sign({ email }, secret, { expiresIn });


  await db.query(
    `UPDATE email_verifications 
     SET token = ?, updated_at = NOW() 
     WHERE JSON_EXTRACT(data, '$.email') = ?`,
    [token, email]
  );

  await sendEmailVerification(email, token);
  res.status(200).json({ message: Messages.SUCCESS.RESEND_VERIFY_LINK });
};

exports.resumeFlow = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Check if user is still in email_verifications
  const [tempUsers] = await db.query(
    "SELECT * FROM email_verifications WHERE JSON_EXTRACT(data, '$.email') = ?",
    [email]
  );

  if (tempUsers.length > 0) {
    return res.status(200).json({
      status: 'PENDING',
      next_action: 'EMAIL_VERIFICATION',
      message: 'Email verification pending',
    });
  }

  // Check if user already in main users table
  const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (users.length > 0) {
    return res.status(200).json({
      status: 'IN_PROGRESS',
      next_action: users[0].next_action,
      message: `Continue from step: ${users[0].next_action}`,
    });
  }

  return res.status(404).json({ message: "User not found in registration flow" });
};


exports.sendMobileOtp = async (req, res) => {
  const { email, phone } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(otp);


  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  console.log(rows);

  if (!rows.length) return res.status(400).json({ message: "User not found" });

  const user = rows[0];
  console.log(user);

  if (user.next_action !== 'MOBILE_OTP') {
    return res.status(400).json({ message: `Next action is: ${user.next_action}` });
  }

  await db.query("UPDATE users SET phone = ? WHERE uuid = ?", [phone, user.uuid]);


  await db.query("INSERT INTO mobile_otps (uuid, phone, otp) VALUES (?, ?, ?)", [
    user.uuid, phone, otp
  ]);

  try {
    const rawPhone = phone.trim();
    const formattedPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`;

    await sendOtp(formattedPhone, otp);

    console.log(`OTP sent to ${phone}: ${otp}`);
    res.status(200).json({ message: "OTP sent to phone" });
  } catch (err) {
    console.error("Failed to send OTP:", err.message);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }

};


exports.verifyMobileOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });


  const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  console.log(users);
  
  if (!users.length) return res.status(400).json({ message: "User not found" });

  const user = users[0];
  console.log(user);
  
  if (user.next_action !== 'MOBILE_OTP') {
    return res.status(400).json({ message: `Next action is: ${user.next_action}` });
  }

  const [rows] = await db.query("SELECT * FROM mobile_otps WHERE uuid = ? ORDER BY created_at DESC LIMIT 1", [user.uuid]);
  console.log(rows);
  
  if (!rows.length || rows[0].otp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const otpCreated = new Date(rows[0].created_at);
  console.log(otpCreated);
  
  const diffMin = (new Date() - otpCreated) / 1000 / 60;
  if (diffMin > 10) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  await db.query("UPDATE users SET is_verified = true, next_action = 'COMPLETED' WHERE uuid = ?", [user.uuid]);
  await db.query("DELETE FROM mobile_otps WHERE uuid = ?", [user.uuid]);

  res.status(200).json({ message: "Mobile verified. Registration complete." });
};

