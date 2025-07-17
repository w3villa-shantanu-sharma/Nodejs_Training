
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

  exports.linkGoogleId = async (uuid, googleId) => {
  await db.query('UPDATE users SET google_id = ? WHERE uuid = ?', [googleId, uuid]);
};


exports.findByEmail = async (email) => {
  const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return user;
};

exports.updateGoogleId = async (uuid, googleId) => {
  await db.query("UPDATE users SET google_id = ? WHERE uuid = ?", [googleId, uuid]);
};

// exports.createGoogleUser = async ({ uuid, name, email, googleId }) => {
//   return await db.query(`
//     INSERT INTO users (uuid, name, email, google_id, login_method, is_active, next_action)
//     VALUES (?, ?, ?, ?, 'GOOGLE', true, 'PROFILE_UPDATED')
//   `, [uuid, name, email, googleId,]);
// };

// exports.getUserByUUID = async (uuid) => {
//   const [user] = await db.query("SELECT * FROM users WHERE uuid = ?", [uuid]);
//   return user;
// };

exports.updateFacebookId = async (uuid, facebookId) => {
  await db.query("UPDATE users SET facebook_id = ? WHERE uuid = ?", [facebookId, uuid]);
};

exports.createFacebookUser = async ({ uuid, name, email, facebookId }) => {
  return await db.query(`
    INSERT INTO users (uuid, name, email, facebook_id, login_method, is_active, next_action)
    VALUES (?, ?, ?, ?, 'FACEBOOK', true, 'PROFILE_UPDATED')
  `, [uuid, name, email, facebookId]);
};

exports.updateUserProfilePicture = async (uuid, imageUrl) => {
  return db.query(
    'UPDATE users SET profile_picture = ? WHERE uuid = ?',
    [imageUrl, uuid]
  );
};

exports.updateUserAddress = async (uuid, data) => {
  const {
    address_line,
    city,
    state,
    country,
    lat,
    lng
  } = data;

  return db.query(
    `UPDATE users SET 
      address_line = ?, city = ?, state = ?, country = ?, lat = ?, lng = ?
     WHERE uuid = ?`,
    [address_line, city, state, country, lat, lng, uuid]
  );
};


exports.updateUserPlan = async (uuid, plan, expiresAt) => {
  const query = 'UPDATE users SET plan = ?, plan_expires_at = ? WHERE uuid = ?';
  const values = [plan, expiresAt, uuid];
  return db.query(query, values);
};

exports.getExpiredPlans = async (currentTime) => {
  const query = 'SELECT uuid FROM users WHERE plan != "FREE" AND plan_expires_at <= ?';
  const values = [currentTime];
  const [rows] = await db.query(query, values);
  return rows;
};

exports.expireUserPlan = async (uuid) => {
  const query = 'UPDATE users SET plan = "FREE", plan_expires_at = NULL WHERE uuid = ?';
  const values = [uuid];
  return db.query(query, values);
};



exports.findByUserUuid = async (uuid) => {
  const [rows] = await db.query('SELECT * FROM podcast_pages WHERE user_uuid = ?', [uuid]);
  return rows;
};

exports.createPage = async (data) => {
  const { uuid, username, spotify_link, apple_link, embed_code } = data;
  return db.query(
    'INSERT INTO podcast_pages (user_uuid, username, spotify_link, apple_link, embed_code) VALUES (?, ?, ?, ?, ?)',
    [uuid, username, spotify_link, apple_link, embed_code]
  );
};

exports.findByUsername = async (username) => {
  const [rows] = await db.query('SELECT * FROM podcast_pages WHERE username = ?', [username]);
  return rows[0];
};

exports.incrementClick = async (username) => {
  return db.query('UPDATE podcast_pages SET click_count = click_count + 1 WHERE username = ?', [username]);
};

// exports.updateLoginMethod = (uuid, method) =>
//   db.query('UPDATE users SET login_method=? WHERE uuid=?', [method, uuid]);


// utils/userQueryData.js

exports.getPublicPodcastProfiles = async (limit = 20) => {
  const [rows] = await db.query(
    `
    SELECT
      uuid,
      name,
      username,
      profile_picture
    FROM users
    WHERE is_active = 1
      AND username IS NOT NULL
    ORDER BY created_at DESC
    LIMIT ?
    `,
    [limit]
  );

  return rows;
};

exports.invalidateEmailToken = async (email, token) => {
  await db.query(
    "UPDATE email_verifications SET is_token_used = true WHERE email = ? AND token = ?",
    [email, token]
  );
};

exports.updateUserNextAction = async (uuid, nextAction) => {
  await db.query(
    "UPDATE users SET next_action = ? WHERE uuid = ?",
    [nextAction, uuid]
  );
};

exports.updateLoginMethod = async (uuid, method) => {
  await db.query('UPDATE users SET login_method = ? WHERE uuid = ?', [method, uuid]);
};

// Fix the createGoogleUser function
exports.createGoogleUser = async ({ uuid, name, email, google_id, password }) => {
  return await db.query(`
    INSERT INTO users (uuid, name, email, google_id, password, login_method, is_active, next_action)
    VALUES (?, ?, ?, ?, ?, 'GOOGLE', true, 'PROFILE_UPDATED')
  `, [uuid, name, email, google_id, password]);
};

// Add function to update password (for Google users who want to change default password)
exports.updateUserPassword = async (uuid, hashedPassword) => {
  await db.query("UPDATE users SET password = ? WHERE uuid = ?", [hashedPassword, uuid]);
};

