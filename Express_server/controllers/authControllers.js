// const db = require('../DB/dbconfig');
// const bcrypt = require('bcrypt');
// const sendEmailVerification = require('../utils/sendEmailVerification');
// const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid');
// const sendOtp = require('../utils/sendOTP')



// const Messages = require('../constants/messages');
// const StatusCodes = require('../constants/statusCode');
// const { secret, expiresIn } = require('../config/jwt');

// exports.registerUser = async (req, res) => {
//   const { name, email, password } = req.body;
//   if (!name || !email || !password) {
//     return res.status(400).json({ message: "Name, Email and Password are required" });
//   }

//   const userUUID = uuidv4();
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_EMAIL_FORMAT });
//   }

//   const [userExists] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
//   if (userExists.length) {
//     return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.EMAIL_ALREADY_REGISTERED });
//   }

//   const [tempExists] = await db.query("SELECT * FROM email_verifications WHERE email = ?", [email]);
//   const hashedPassword = await bcrypt.hash(password, 10);
//   const token = jwt.sign({ email }, secret, { expiresIn });

//   const userData = {
//     uuid: userUUID,
//     name,
//     email,
//     password: hashedPassword
//   };

//   if (tempExists.length) {
//     const temp = tempExists[0];
//     const lastUpdated = new Date(temp.updated_at);
//     const now = new Date();
//     const diffMinutes = (now - lastUpdated) / 1000 / 60;

//     if (diffMinutes < 15) {
//       return res.status(400).json({ message: Messages.ERROR.REVERIFIED_EMAIL });
//     }

//     await db.query("UPDATE email_verifications SET data = ?, token = ?, updated_at = NOW() WHERE email = ?", [
//       JSON.stringify(userData),
//       token,
//       email
//     ]);

//     await sendEmailVerification(email, token);
//     return res.status(200).json({ message: Messages.SUCCESS.RESEND_VERIFY_LINK });
//   }

//   await db.query("INSERT INTO email_verifications (uuid, email, data, token) VALUES (?, ?, ?, ?)", [
//     userUUID,
//     email,
//     JSON.stringify(userData),
//     token
//   ]);

//   await sendEmailVerification(email, token);
//   return res.status(201).json({ message: Messages.SUCCESS.USER_REGISTERED });
// };



// exports.verifyEmail = async (req, res) => {
//   const { token } = req.params;

//   try {
//     const decoded = jwt.verify(token, secret);
//     const email = decoded.email;

//     const [rows] = await db.query(
//       `SELECT * FROM email_verifications 
//        WHERE email = ? 
//          AND token = ? 
//          AND updated_at >= NOW() - INTERVAL 15 MINUTE`,
//       [email, token]
//     );

//     if (rows.length === 0) {
//       return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
//     }

//     const userData = rows[0].data;

//     const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
//     if (existingUser.length) {
//       return res.status(400).json({ message: "Email already verified." });
//     }

//     await db.query(
//       `INSERT INTO users (uuid, name, email, password, next_action) 
//        VALUES (?, ?, ?, ?, ?)`,
//       [userData.uuid, userData.name, userData.email, userData.password, 'MOBILE_OTP']
//     );

//     await db.query("UPDATE email_verifications SET is_verified = true, verified_at = NOW() WHERE email = ?", [email]);

//     return res.status(200).json({ message: Messages.SUCCESS.EMAIL_VERIFIED });
//   } catch (err) {
//     return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
//   }
// };


// exports.resendVerificationEmail = async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: "Email is required" });

//   // Check in temp email_verifications
//   const [rows] = await db.query("SELECT * FROM email_verifications WHERE email = ?", [email]);

//   if (!rows.length) {
//     return res.status(400).json({ message: Messages.ERROR.NOT_PENDING_VERFICATION });
//   }

//   const user = rows[0];

//   if (user.is_verified) {
//     return res.status(400).json({ message: "Email already verified" });
//   }

//   const now = new Date();
//   const updatedAt = new Date(user.updated_at);
//   const diffMinutes = (now - updatedAt) / 1000 / 60;

//   if (diffMinutes < 15) {
//     return res.status(400).json({ message: Messages.ERROR.REVERIFIED_EMAIL });
//   }

//   const token = jwt.sign({ email }, secret, { expiresIn });

//   await db.query(
//     `UPDATE email_verifications 
//      SET token = ?, updated_at = NOW() 
//      WHERE email = ?`,
//     [token, email]
//   );

//   await sendEmailVerification(email, token);
//   return res.status(200).json({ message: Messages.SUCCESS.RESEND_VERIFY_LINK });
// };


// // exports.resumeFlow = async (req, res) => {
// //   const { email } = req.body;

// //   if (!email) {
// //     return res.status(400).json({ message: "Email is required" });
// //   }

// //   // Check if user is still in email_verifications
// //   const [tempUsers] = await db.query(
// //     "SELECT * FROM email_verifications WHERE JSON_EXTRACT(data, '$.email') = ?",
// //     [email]
// //   );

// //   if (tempUsers.length > 0) {
// //     return res.status(200).json({
// //       status: 'PENDING',
// //       next_action: 'EMAIL_VERIFICATION',
// //       message: 'Email verification pending',
// //     });
// //   }

// //   // Check if user already in main users table
// //   const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

// //   if (users.length > 0) {
// //     return res.status(200).json({
// //       status: 'IN_PROGRESS',
// //       next_action: users[0].next_action,
// //       message: `Continue from step: ${users[0].next_action}`,
// //     });
// //   }

// //   return res.status(404).json({ message: "User not found in registration flow" });
// // };


// exports.sendMobileOtp = async (req, res) => {
//   const { email, phone } = req.body;
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   const [[user]] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
//   if (!user) return res.status(400).json({ message: "User not found" });

//   if (user.next_action !== 'MOBILE_OTP') {
//     return res.status(400).json({ message: `Next step is: ${user.next_action}` });
//   }

//   await db.query("UPDATE users SET phone = ? WHERE uuid = ?", [phone, user.uuid]);

//   await db.query("INSERT INTO mobile_otps (uuid, phone, email, otp) VALUES (?, ?, ?, ?)", [
//     user.uuid, phone, email, otp
//   ]);

//   const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
//   await sendOtp(formattedPhone, otp);

//   return res.status(200).json({ message: "OTP sent to phone" });
// };


// exports.verifyMobileOtp = async (req, res) => {
//   const { email, otp } = req.body;
//   if (!email || !otp) return res.status(400).json({ message: Messages.ERROR.EMAIL_AND_OTP_ARE_REQUIRED });

//   const [[user]] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
//   if (!user) return res.status(400).json({ message: Messages.ERROR.USER_NOT_FOUND });

//   if (user.next_action !== 'MOBILE_OTP') {
//     return res.status(400).json({ message: `Next step is: ${user.next_action}` });
//   }

//   const [rows] = await db.query("SELECT * FROM mobile_otps WHERE uuid = ? ORDER BY created_at DESC LIMIT 1", [user.uuid]);
//   if (!rows.length || rows[0].otp !== otp) {
//     return res.status(400).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_OTP });
//   }

//   const otpCreated = new Date(rows[0].created_at);
//   const diffMin = (new Date() - otpCreated) / 1000 / 60;
//   if (diffMin > 10) {
//     return res.status(400).json({ message: 'OTP expired' });
//   }

//   await db.query("UPDATE users SET is_active = true, next_action = 'PROFILE_UPDATED' WHERE uuid = ?", [user.uuid]);
//   await db.query("UPDATE mobile_otps SET is_verified = true, verified_at = NOW() WHERE uuid = ?", [user.uuid]);

//   return res.status(200).json({ message: Messages.SUCCESS.Mobile_VERIFIED_DONE });
// };


// exports.completeProfile = async (req, res) => {
//   const { username } = req.body;
//   const userUUID = req.user.uuid; // must be set by auth middleware

//   if (!username || !userUUID) {
//     return res.status(StatusCodes.BAD_REQUEST).json({ message: "Username is required" });
//   }

//   const normalizedUsername = username.trim().toLowerCase();
//   const cacheKey = `username:${normalizedUsername}`;

//   try {
//     // 1. Check in Redis if username exists
//     const cachedUsername = await redisClient.get(cacheKey);
//     if (cachedUsername === 'true') {
//       return await suggestUsernames(normalizedUsername, res);
//     }

//     // 2. Check in DB if username exists
//     const isTaken = await isUsernameTaken(normalizedUsername);
//     if (isTaken) {
//       await redisClient.set(cacheKey, 'true'); // Cache to speed up next time
//       return await suggestUsernames(normalizedUsername, res);
//     }

//     // 3. All good → update user
//     await updateUsername(userUUID, normalizedUsername);

//     // 4. Cache taken username
//     await redisClient.set(cacheKey, 'true');

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       username: normalizedUsername
//     });

//   } catch (err) {
//     console.error('Complete Profile Error:', err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// Helper to suggest similar usernames
// async function suggestUsernames(baseUsername, res) {
//   const suggestionKey = `suggestions:${baseUsername}`;
//   const cachedSuggestions = await redisClient.get(suggestionKey);

//   if (cachedSuggestions) {
//     return res.status(409).json({
//       message: "Username already taken",
//       suggestions: JSON.parse(cachedSuggestions)
//     });
//   }

//   const similar = await findSimilarUsernames(baseUsername);
//   const suggestions = generateSuggestions(baseUsername, similar);

//   await redisClient.set(suggestionKey, JSON.stringify(suggestions), {
//     EX: 3600 // cache for 1 hour
//   });

//   return res.status(409).json({
//     message: "Username already taken",
//     suggestions
//   });
// }

// Create suggestion alternatives
// function generateSuggestions(base, existing) {
//   const baseLower = base.toLowerCase();
//   const suffixes = [123, 321, 99, 1, 777, Math.floor(Math.random() * 1000)];

//   const suggestions = suffixes.map(s => `${baseLower}${s}`);
//   const filtered = suggestions.filter(name => !existing.includes(name));
//   return filtered.slice(0, 5); // return top 5
// }
