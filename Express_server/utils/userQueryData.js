
const db = require('../DB/dbconfig');

// USERS
exports.getUserByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows;
};

exports.insertUser = async (userData) => {
  const { uuid, name, email, password } = userData;
  await db.query(
    "INSERT INTO users (uuid, name, email, password, next_action) VALUES (?, ?, ?, ?, ?)",
    [uuid, name, email, password, 'MOBILE_OTP']
  );
};

exports.updateUserPhoneOnly = async (uuid, phone) => {
  await db.query("UPDATE users SET phone = ? WHERE uuid = ?", [phone, uuid]);
};

exports.updateUserPhoneAndStep = async (uuid, phone) => {
  await db.query("UPDATE users SET phone = ?, is_active = true, next_action = 'PROFILE_UPDATED' WHERE uuid = ?", [phone, uuid]);
};

// EMAIL_VERIFICATIONS
exports.getEmailVerificationByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM email_verifications WHERE email = ?", [email]);
  return rows;
};

exports.insertEmailVerification = async ({ uuid, email, data, token }) => {
  await db.query(
    "INSERT INTO email_verifications (uuid, email, data, token) VALUES (?, ?, ?, ?)",
    [uuid, email, JSON.stringify(data), token]
  );
};

exports.updateEmailVerification = async (email, data, token) => {
  await db.query(
    "UPDATE email_verifications SET data = ?, token = ?, updated_at = NOW() WHERE email = ?",
    [JSON.stringify(data), token, email]
  );
};

exports.markEmailAsVerified = async (email) => {
  await db.query(
    "UPDATE email_verifications SET is_verified = true, verified_at = NOW() WHERE email = ?",
    [email]
  );
};

// MOBILE_OTPS
exports.insertOtp = async (uuid, phone, email, otp) => {
  await db.query(
    "INSERT INTO mobile_otps (uuid, phone, email, otp) VALUES (?, ?, ?, ?)",
    [uuid, phone, email, otp]
  );
};

exports.getLatestOtp = async (uuid) => {
  const [rows] = await db.query(
    "SELECT * FROM mobile_otps WHERE uuid = ? ORDER BY created_at DESC LIMIT 1",
    [uuid]
  );
  return rows;
};

exports.markOtpVerified = async (uuid) => {
  await db.query(
    "UPDATE mobile_otps SET is_verified = true, verified_at = NOW() WHERE uuid = ?",
    [uuid]
  );
};


exports.getUserByUUID = async (uuid) => {
    const [[user]] = await db.query("SELECT * FROM users WHERE uuid = ?", [uuid]);
    return user;
  };
  
  exports.isUsernameTaken = async (username) => {
    const [[result]] = await db.query("SELECT username FROM users WHERE username = ?", [username]);
    return !!result;
  };
  
  exports.findSimilarUsernames = async (username) => {
    const [rows] = await db.query("SELECT username FROM users WHERE username LIKE ?", [`%${username}%`]);
    return rows.map(row => row.username.toLowerCase());
  };
  
  exports.updateUsername = async (uuid, username) => {
    await db.query("UPDATE users SET username = ?, next_action = NULL WHERE uuid = ?", [username, uuid]);
  };