import db from '../DB/dbconfig.js';
import { v4 as uuidv4 } from 'uuid';

// USERS
export const getUserByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows;
};

export const insertUser = async (userData) => {
  const { uuid, name, email, password } = userData;
  await db.query(
    "INSERT INTO users (uuid, name, email, password, next_action) VALUES (?, ?, ?, ?, ?)",
    [uuid, name, email, password, 'MOBILE_OTP']
  );
};

export const updateUserPhoneOnly = async (uuid, phone) => {
  await db.query("UPDATE users SET phone = ? WHERE uuid = ?", [phone, uuid]);
};

export const updateUserPhoneAndStep = async (uuid, phone) => {
  try {
    const result = await db.query(
      "UPDATE users SET phone = ?, is_active = true, next_action = 'PROFILE_UPDATED' WHERE uuid = ?", 
      [phone, uuid]
    );
    console.log(`Updated user ${uuid} - phone: ${phone}, next_action: PROFILE_UPDATED`);
    return result;
  } catch (err) {
    console.error('Error updating user phone and step:', err);
    throw err;
  }
};

// EMAIL_VERIFICATIONS
export const getEmailVerificationByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM email_verifications WHERE email = ?", [email]);
  return rows;
};

export const insertEmailVerification = async ({ uuid, email, data, token }) => {
  await db.query(
    "INSERT INTO email_verifications (uuid, email, data, token) VALUES (?, ?, ?, ?)",
    [uuid, email, JSON.stringify(data), token]
  );
};

export const updateEmailVerification = async (email, data, token) => {
  await db.query(
    "UPDATE email_verifications SET data = ?, token = ?, updated_at = NOW() WHERE email = ?",
    [JSON.stringify(data), token, email]
  );
};

export const markEmailAsVerified = async (email) => {
  await db.query(
    "UPDATE email_verifications SET is_verified = true, verified_at = NOW() WHERE email = ?",
    [email]
  );
};

// MOBILE_OTPS
export const insertOtp = async (uuid, phone, email, otp) => {
  await db.query(
    "INSERT INTO mobile_otps (uuid, phone, email, otp) VALUES (?, ?, ?, ?)",
    [uuid, phone, email, otp]
  );
};

export const getLatestOtp = async (uuid) => {
  const [rows] = await db.query(
    "SELECT * FROM mobile_otps WHERE uuid = ? ORDER BY created_at DESC LIMIT 1",
    [uuid]
  );
  return rows;
};

export const markOtpVerified = async (uuid) => {
  await db.query(
    "UPDATE mobile_otps SET is_verified = true, verified_at = NOW() WHERE uuid = ?",
    [uuid]
  );
};


export const getUserByUUID = async (uuid) => {
    const [[user]] = await db.query("SELECT * FROM users WHERE uuid = ?", [uuid]);
    return user;
  };
  
  export const isUsernameTaken = async (username) => {
    const [[result]] = await db.query("SELECT username FROM users WHERE username = ?", [username]);
    return !!result;
  };
  
  // export const findSimilarUsernames = async (username) => {
  //   const [rows] = await db.query("SELECT username FROM users WHERE username LIKE ?", [`%${username}%`]);
  //   return rows.map(row => row.username.toLowerCase());
  // };
  
  // export const updateUsername = async (uuid, username) => {
  //   await db.query("UPDATE users SET username = ?, next_action = NULL WHERE uuid = ?", [username, uuid]);
  // };

  export const linkGoogleId = async (uuid, googleId) => {
  await db.query('UPDATE users SET google_id = ? WHERE uuid = ?', [googleId, uuid]);
};


export const findByEmail = async (email) => {
  const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return user;
};

// export const updateGoogleId = async (uuid, googleId) => {
//   await db.query("UPDATE users SET google_id = ? WHERE uuid = ?", [googleId, uuid]);
// };

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

export const updateFacebookId = async (uuid, facebookId) => {
  await db.query("UPDATE users SET facebook_id = ? WHERE uuid = ?", [facebookId, uuid]);
};

export const createFacebookUser = async ({ uuid, name, email, facebookId }) => {
  return await db.query(`
    INSERT INTO users (uuid, name, email, facebook_id, login_method, is_active, next_action)
    VALUES (?, ?, ?, ?, 'FACEBOOK', true, 'PROFILE_UPDATED')
  `, [uuid, name, email, facebookId]);
};

export const updateUserProfilePicture = async (uuid, imageUrl) => {
  return db.query(
    'UPDATE users SET profile_picture = ? WHERE uuid = ?',
    [imageUrl, uuid]
  );
};

export const updateUserAddress = async (uuid, data) => {
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


export const updateUserPlan = async (uuid, plan, expiresAt) => {
  const query = 'UPDATE users SET plan = ?, plan_expires_at = ? WHERE uuid = ?';
  const values = [plan, expiresAt, uuid];
  return db.query(query, values);
};

export const getExpiredPlans = async (currentTime) => {
  const query = 'SELECT uuid FROM users WHERE plan != "FREE" AND plan_expires_at <= ?';
  const values = [currentTime];
  const [rows] = await db.query(query, values);
  return rows;
};

export const expireUserPlan = async (uuid) => {
  const query = 'UPDATE users SET plan = "FREE", plan_expires_at = NULL WHERE uuid = ?';
  const values = [uuid];
  return db.query(query, values);
};



export const findByUserUuid = async (uuid) => {
  const [rows] = await db.query('SELECT * FROM podcast_pages WHERE user_uuid = ?', [uuid]);
  return rows;
};

export const createPage = async (data) => {
  const { uuid, username, spotify_link, apple_link, embed_code } = data;
  return db.query(
    'INSERT INTO podcast_pages (user_uuid, username, spotify_link, apple_link, embed_code) VALUES (?, ?, ?, ?, ?)',
    [uuid, username, spotify_link, apple_link, embed_code]
  );
};

export const findByUsername = async (username) => {
  const [rows] = await db.query('SELECT * FROM podcast_pages WHERE username = ?', [username]);
  return rows[0];
};

export const incrementClick = async (username) => {
  return db.query('UPDATE podcast_pages SET click_count = click_count + 1 WHERE username = ?', [username]);
};

// exports.updateLoginMethod = (uuid, method) =>
//   db.query('UPDATE users SET login_method=? WHERE uuid=?', [method, uuid]);


// utils/userQueryData.js

export const getPublicPodcastProfiles = async (limit = 20) => {
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

export const invalidateEmailToken = async (email, token) => {
  await db.query(
    "UPDATE email_verifications SET is_token_used = true WHERE email = ? AND token = ?",
    [email, token]
  );
};

export const updateUserNextAction = async (uuid, nextAction) => {
  await db.query(
    "UPDATE users SET next_action = ? WHERE uuid = ?",
    [nextAction, uuid]
  );
};

export const updateLoginMethod = async (uuid, method) => {
  await db.query('UPDATE users SET login_method = ? WHERE uuid = ?', [method, uuid]);
};

// Fix the createGoogleUser function
export const createGoogleUser = async ({ uuid, name, email, google_id, password }) => {
  return await db.query(`
    INSERT INTO users (uuid, name, email, google_id, password, login_method, is_active, next_action)
    VALUES (?, ?, ?, ?, ?, 'GOOGLE', true, 'PROFILE_UPDATED')
  `, [uuid, name, email, google_id, password]);
};

// Add function to update password (for Google users who want to change default password)
// export const updateUserPassword = async (uuid, hashedPassword) => {
//   await db.query("UPDATE users SET password = ? WHERE uuid = ?", [hashedPassword, uuid]);
// };

export const findByUsernameProfile = async (username) => {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
};

export const updateUserProfile = async (uuid, userData) => {
  // Filter out undefined values to only update fields that were changed
  const updates = {};
  if (userData.name !== undefined) updates.name = userData.name;
  if (userData.username !== undefined) updates.username = userData.username;
  if (userData.email !== undefined) updates.email = userData.email;
  if (userData.bio !== undefined) updates.comment = userData.bio; // Map bio to comment column
  if (userData.phone !== undefined) updates.phone = userData.phone;
  
  // If no fields to update, return early
  if (Object.keys(updates).length === 0) return { affectedRows: 0 };
  
  // Build the query dynamically based on which fields are being updated
  let query = 'UPDATE users SET ';
  const values = [];
  
  // Add each field to the query
  Object.entries(updates).forEach(([key, value], index) => {
    if (index > 0) query += ', ';
    query += `${key} = ?`;
    values.push(value);
  });
  
  // Add the updated_at timestamp and the WHERE clause
  query += ', updated_at = NOW() WHERE uuid = ?';
  values.push(uuid);
  
  return db.query(query, values);
};

export const updateProfile = async (req, res) => {
  const userUUID = req.user?.uuid;
  if (!userUUID) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { name, email, username, bio, phone } = req.body;
    const updates = {}; // Create an object to hold only the fields being updated
    
    // Only add fields to updates if they exist and have changed
    if (name) updates.name = name;
    if (email && email !== req.user.email) updates.email = email;
    if (phone) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    
    // Only check for username uniqueness if the username is being changed
    if (username && username !== req.user.username) {
      // Check if username is already taken by another user
      const existingUser = await userRepo.findByUsername(username);
      if (existingUser && existingUser.uuid !== userUUID) {
        return res.status(400).json({ 
          message: "Username already taken"
        });
      }
      updates.username = username;
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      await userRepo.updateUserProfile(userUUID, updates);
    }

    // Fetch updated user data
    const updatedUser = await userRepo.getUserByUUID(userUUID);

    // Return success with updated user data
    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        bio: updatedUser.comment, // Map the 'comment' field from DB to 'bio' in response
        phone: updatedUser.phone,
        profile_picture: updatedUser.profile_picture
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ message: 'Failed to update profile: ' + err.message });
  }
};

// Add these new functions

export const getExpiringPlans = async (hours = 24) => {
  // Find plans expiring in the next X hours
  const query = `
    SELECT uuid, name, email, plan, plan_expires_at 
    FROM users 
    WHERE plan != "FREE" 
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at > NOW() 
    AND plan_expires_at <= DATE_ADD(NOW(), INTERVAL ? HOUR)
    AND notification_sent = 0
  `;
  const values = [hours];
  const [rows] = await db.query(query, values);
  return rows;
};

export const markNotificationSent = async (uuid) => {
  await db.query('UPDATE users SET notification_sent = 1 WHERE uuid = ?', [uuid]);
};

export const createUserNotification = async (userUuid, type, message) => {
  return db.query(
    'INSERT INTO notifications (user_uuid, type, message, created_at) VALUES (?, ?, ?, NOW())',
    [userUuid, type, message]
  );
};

export const getUserNotifications = async (userUuid, limit = 20) => {
  try {
    const query = `
      SELECT id, type, message, seen, created_at
      FROM notifications
      WHERE user_uuid = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const [rows] = await db.query(query, [userUuid, limit]);
    
    // Log the number of notifications found
    console.log(`Found ${rows.length} notifications for user ${userUuid}`);
    
    return rows;
  } catch (err) {
    console.error('Error retrieving notifications:', err);
    return [];
  }
};

export const markNotificationAsSeen = async (notificationId, userUuid) => {
  return db.query(
    'UPDATE notifications SET seen = 1 WHERE id = ? AND user_uuid = ?',
    [notificationId, userUuid]
  );
};

// JWT TOKEN MANAGEMENT FUNCTIONS
export const storeToken = async (userUuid, tokenHash, tokenType, expiresAt, deviceInfo = null) => {
  await db.query(
    `INSERT INTO user_tokens (user_uuid, token_hash, token_type, expires_at, device_info) 
     VALUES (?, ?, ?, ?, ?)`,
    [userUuid, tokenHash, tokenType, expiresAt, deviceInfo]
  );
};

export const getTokenByHash = async (tokenHash) => {
  const [rows] = await db.query(
    `SELECT * FROM user_tokens WHERE token_hash = ? AND is_revoked = FALSE`,
    [tokenHash]
  );
  return rows[0];
};

export const revokeToken = async (tokenHash) => {
  await db.query(
    `UPDATE user_tokens SET is_revoked = TRUE WHERE token_hash = ?`,
    [tokenHash]
  );
};

export const revokeAllUserTokens = async (userUuid) => {
  await db.query(
    `UPDATE user_tokens SET is_revoked = TRUE WHERE user_uuid = ?`,
    [userUuid]
  );
};

export const cleanupExpiredTokens = async () => {
  await db.query(
    `DELETE FROM user_tokens WHERE expires_at < NOW() OR is_revoked = TRUE`
  );
};

// RATE LIMITING FUNCTIONS
export const initializeRateLimit = async (identifier, endpoint) => {
  try {
    // Convert identifier to string to ensure it's not an object
    const idString = typeof identifier === 'object' 
      ? (identifier.email || identifier.toString() || 'unknown')
      : String(identifier);
      
    await db.query(
      `INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) 
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE request_count = request_count + 1, updated_at = NOW()`,
      [idString, endpoint, 1]
    );
  } catch (err) {
    console.error('Error initializing rate limit:', err);
    throw err;
  }
};

export const updateRateLimit = async (identifier, endpoint) => {
  try {
    // Convert identifier to string to ensure it's not an object
    const idString = typeof identifier === 'object' 
      ? (identifier.email || identifier.toString() || 'unknown')
      : String(identifier);
      
    await db.query(
      `UPDATE rate_limits 
       SET request_count = request_count + 1, updated_at = NOW() 
       WHERE identifier = ? AND endpoint = ? AND window_start >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [idString, endpoint]
    );
  } catch (err) {
    console.error('Error updating rate limit:', err);
    throw err;
  }
};

export const checkDatabaseRateLimit = async (identifier, endpoint, maxRequests, windowSeconds) => {
  try {
    // Convert identifier to string to ensure it's not an object
    const idString = typeof identifier === 'object' 
      ? (identifier.email || identifier.toString() || 'unknown')
      : String(identifier);
      
    const [rows] = await db.query(
      `SELECT SUM(request_count) as total_requests 
       FROM rate_limits 
       WHERE identifier = ? AND endpoint = ? 
       AND window_start >= DATE_SUB(NOW(), INTERVAL ? SECOND)`,
      [idString, endpoint, windowSeconds]
    );
    
    const totalRequests = rows[0]?.total_requests || 0;
    return totalRequests < maxRequests;
  } catch (err) {
    console.error('Error checking database rate limit:', err);
    return true; // Allow request if error occurs
  }
};

// USERNAME FUNCTIONS (if not already present)
export const findSimilarUsernames = async (baseUsername) => {
  try {
    const [rows] = await db.query(
      `SELECT username FROM users WHERE username LIKE ? LIMIT 20`,
      [`${baseUsername}%`]
    );
    return rows.map(row => row.username);
  } catch (err) {
    console.error('Error finding similar usernames:', err);
    return [];
  }
};

export const updateUsername = async (uuid, username) => {
  try {
    await db.query(
      'UPDATE users SET username = ? WHERE uuid = ?',
      [username, uuid]
    );
  } catch (err) {
    console.error('Error updating username:', err);
    throw err;
  }
};

export const updateUserPassword = async (uuid, hashedPassword) => {
  try {
    await db.query(
      'UPDATE users SET password = ? WHERE uuid = ?',
      [hashedPassword, uuid]
    );
  } catch (err) {
    console.error('Error updating user password:', err);
    throw err;
  }
};

export const updateGoogleId = async (uuid, googleId) => {
  try {
    await db.query(
      'UPDATE users SET google_id = ? WHERE uuid = ?',
      [googleId, uuid]
    );
  } catch (err) {
    console.error('Error updating Google ID:', err);
    throw err;
  }
};

// PROFILE FUNCTIONS (if not already present)
// export const findByUsername = async (username) => {
//   try {
//     const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
//     return rows[0];
//   } catch (err) {
//     console.error('Error finding user by username:', err);
//     return null;
//   }
// };

// export const updateUserProfile = async (uuid, updates) => {
//   try {
//     if (Object.keys(updates).length === 0) return;
    
//     // Build the query dynamically based on which fields are being updated
//     let query = 'UPDATE users SET ';
//     const values = [];
    
//     // Add each field to the query
//     Object.entries(updates).forEach(([key, value], index) => {
//       if (index > 0) query += ', ';
//       query += `${key} = ?`;
//       values.push(value);
//     });
    
//     // Add the updated_at timestamp and the WHERE clause
//     query += ', updated_at = NOW() WHERE uuid = ?';
//     values.push(uuid);
    
//     await db.query(query, values);
//   } catch (err) {
//     console.error('Error updating user profile:', err);
//     throw err;
//   }
// };

// PODCAST PAGE FUNCTIONS (if not already present)
// export const findByUsernameProfile = async (username) => {
//   try {
//     const [rows] = await db.query(`
//       SELECT pp.*, u.name, u.profile_picture, u.username as user_username
//       FROM podcast_pages pp
//       JOIN users u ON pp.user_uuid = u.uuid
//       WHERE pp.username = ?
//     `, [username]);
//     return rows[0];
//   } catch (err) {
//     console.error('Error finding profile by username:', err);
//     return null;
//   }
// };

// YouTube Links Management
export const getUserYouTubeLinks = async (userUuid) => {
  const [rows] = await db.query(
    'SELECT * FROM youtube_links WHERE user_uuid = ? ORDER BY created_at DESC',
    [userUuid]
  );
  return rows;
};

export const createYouTubeLink = async (userUuid, data) => {
  const { youtube_url, title, thumbnail, video_id } = data;
  const [result] = await db.query(
    'INSERT INTO youtube_links (user_uuid, youtube_url, title, thumbnail, video_id) VALUES (?, ?, ?, ?, ?)',
    [userUuid, youtube_url, title, thumbnail, video_id]
  );
  return result;
};

export const deleteYouTubeLink = async (linkId, userUuid) => {
  const [result] = await db.query(
    'DELETE FROM youtube_links WHERE id = ? AND user_uuid = ?',
    [linkId, userUuid]
  );
  return result;
};

export const getUserYouTubeLinkCount = async (userUuid) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) as count FROM youtube_links WHERE user_uuid = ?',
    [userUuid]
  );
  return rows[0].count;
};

// Add this function near the end of the file
export const getUserPlan = async (userUuid) => {
  const [rows] = await db.query(
    'SELECT plan FROM users WHERE uuid = ?',
    [userUuid]
  );
  return rows[0]?.plan || 'FREE';
};

export const updateUserActive = async (uuid, isActive) => {
  return db.query(
    'UPDATE users SET is_active = ? WHERE uuid = ?',
    [isActive ? 1 : 0, uuid]
  );
};

// Add this function to userQueryData.js
export const updateUserAsAdmin = async (uuid) => {
  return db.query(
    'UPDATE users SET is_active = 1, next_action = NULL WHERE uuid = ?',
    [uuid]
  );
};

// Add this function near the other cleanup functions
export const cleanupOldRateLimits = async () => {
  try {
    await db.query(
      'DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 DAY)'
    );
    console.log('✅ Cleaned up old rate limit records');
    return true;
  } catch (err) {
    console.error('Error cleaning up rate limits:', err);
    return false;
  }
};

// Add these admin functions near the end of your file

// Count users with optional filters
export const countUsers = async (filters = {}) => {
  try {
    let query = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const values = [];
    
    if (filters.status) {
      query += ' AND is_active = ?';
      values.push(filters.status === 'active' ? 1 : 0);
    }
    
    if (filters.plan && Array.isArray(filters.plan)) {
      query += ' AND plan IN (?)';
      values.push(filters.plan);
    } else if (filters.plan) {
      query += ' AND plan = ?';
      values.push(filters.plan);
    }
    
    const [rows] = await db.query(query, values);
    return rows[0].total;
  } catch (error) {
    console.error('Error counting users:', error);
    return 0;
  }
};

// Count recent users
export const countRecentUsers = async (days = 30) => {
  try {
    const query = `
      SELECT COUNT(*) as total 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const [rows] = await db.query(query, [days]);
    return rows[0].total;
  } catch (error) {
    console.error('Error counting recent users:', error);
    return 0;
  }
};

// Get filtered users with pagination and search
export const getFilteredUsers = async ({ search = '', role, status, limit = 10, offset = 0 }) => {
  try {
    let query = `
      SELECT uuid, name, email, username, role, is_active, plan, plan_expires_at, 
             created_at, updated_at, login_method, next_action, profile_picture
      FROM users
      WHERE 1=1
    `;
    
    const values = [];
    
    // Add search condition
    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ? OR username LIKE ?)`;
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add role filter
    if (role) {
      query += ` AND role = ?`;
      values.push(role);
    }
    
    // Add status filter
    if (status) {
      query += ` AND is_active = ?`;
      values.push(status === 'active' ? 1 : 0);
    }
    
    // Add count query for total
    const countQuery = query.replace(
      'SELECT uuid, name, email, username, role, is_active, plan, plan_expires_at, created_at, updated_at, login_method, next_action, profile_picture', 
      'SELECT COUNT(*) as total'
    );
    
    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    values.push(limit, offset);
    
    // Execute both queries
    const [rows] = await db.query(query, values);
    const [countResult] = await db.query(countQuery, values.slice(0, -2)); // Remove limit and offset
    
    return {
      users: rows,
      total: countResult[0].total
    };
  } catch (error) {
    console.error('Error filtering users:', error);
    return { users: [], total: 0 };
  }
};

// Update user as admin (can update any field)
export const updateUserAdmin = async (uuid, updates) => {
  try {
    // Ensure we're not updating sensitive fields directly
    const allowedFields = [
      'name', 'email', 'username', 'role', 'is_active', 'plan', 
      'plan_expires_at', 'next_action'
    ];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(filteredUpdates).length === 0) {
      return { affectedRows: 0 };
    }
    
    // Build query
    let query = 'UPDATE users SET ';
    const values = [];
    
    Object.entries(filteredUpdates).forEach(([key, value], index) => {
      if (index > 0) query += ', ';
      query += `${key} = ?`;
      values.push(value);
    });
    
    query += `, updated_at = NOW() WHERE uuid = ?`;
    values.push(uuid);
    
    const [result] = await db.query(query, values);
    return result;
  } catch (error) {
    console.error('Error updating user as admin:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (uuid) => {
  try {
    // First delete related records in other tables
    await db.query('DELETE FROM user_tokens WHERE user_uuid = ?', [uuid]);
    
    // These might fail if the tables don't exist or the constraints are set differently
    try { await db.query('DELETE FROM podcast_pages WHERE user_uuid = ?', [uuid]); } catch (e) {}
    try { await db.query('DELETE FROM notifications WHERE user_uuid = ?', [uuid]); } catch (e) {}
    try { await db.query('DELETE FROM youtube_links WHERE user_uuid = ?', [uuid]); } catch (e) {}
    
    // Then delete the user
    const [result] = await db.query('DELETE FROM users WHERE uuid = ?', [uuid]);
    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};