import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from 'crypto';

import sendEmailVerification from "../utils/sendEmailVerification.js";
import sendOtp from "../utils/sendOTP.js";
import * as userRepo from "../utils/userQueryData.js";
import Messages from "../constants/messages.js";
import StatusCodes from "../constants/statusCode.js";
import { secret, expiresIn } from "../config/jwt.js";
import redisClient from "../utils/redisClient.js";

// Register User (Starts Email Verification)
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Incoming payload :", req.body);
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, Email and Password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: Messages.ERROR.INVALID_EMAIL_FORMAT });
  }

  const userUUID = uuidv4();
  const existingUser = await userRepo.getUserByEmail(email);
  if (existingUser.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: Messages.ERROR.EMAIL_ALREADY_REGISTERED });
  }

  if (existingUser && existingUser.length) {
    //  Already registered with something
    if (existingUser.login_method === "GOOGLE") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "This e‑mail is already linked to a Google account. Please sign‑in with Google.",
      });
    }
    // Could handle FACEBOOK etc.
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: Messages.ERROR.EMAIL_ALREADY_REGISTERED });
  }

  const existingTemp = await userRepo.getEmailVerificationByEmail(email);
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = jwt.sign(
    {
      uuid: userUUID,
      email,
      is_active: false,
      method: "EMAIL",
    },
    secret,
    { expiresIn: '15m' }
  );

  if (existingTemp.length && existingTemp[0].is_verified) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: Messages.ERROR.EMAIL_ALREADY_VERIFIED });
  }

  const userData = {
    uuid: userUUID,
    name,
    email,
    password: hashedPassword,
    next_action : "EMAIL_VERIFICATION",
  };

  await userRepo.insertUser({
    ...userData,
    is_active: false
  });


  if (existingTemp.length) {
    const temp = existingTemp[0];
    const lastUpdated = new Date(temp.updated_at);
    const now = new Date();
    const diffMinutes = (now - lastUpdated) / 1000 / 60;

     if (diffMinutes < 15) {
      return res.status(400).json({ message: Messages.ERROR.REVERIFIED_EMAIL });
    }

    await userRepo.updateEmailVerification(email, userData, token);
  } else {
    // Insert new verification record
    await userRepo.insertEmailVerification({
      uuid: userUUID,
      email,
      data: userData,
      token,
    });
  }

  await sendEmailVerification(email, token);
  return res.status(201).json({
    message: Messages.SUCCESS.USER_REGISTERED,
    next_action: "EMAIL_VERIFICATION", // <-- this is needed
  });
};

// Verify Email
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  console.log("Verifying token :" , token);

  try {
    const decoded = jwt.verify(token, secret);
    const email = decoded.email;

    console.log("Decoded email:" , email);

    const [verification] = await userRepo.getEmailVerificationByEmail(email);
    if (!verification || verification.token !== token) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
    }

    console.log("Verification record : " , verification);

    //  Already verified
    if (verification.is_verified) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email already verified." });
    }

    const updatedAt = new Date(verification.updated_at);
    const now = new Date();
    const diffMinutes = (now - updatedAt) / 1000 / 60;

    if (diffMinutes > 15) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
    }

     await userRepo.markEmailAsVerified(email);
    await userRepo.invalidateEmailToken(email, token); // New function to invalidate


    // const userData = verification.data;

    // const existingUser = await userRepo.getUserByEmail(email);
    // if (existingUser.length) {
    //   return res.status(400).json({ message: "Email already verified." });
    // }
     
    // Update user's next_action
    const [user] = await userRepo.getUserByEmail(email);
    if (user) {
      await userRepo.updateUserNextAction(user.uuid, "MOBILE_OTP");
    }
    // await userRepo.insertUser(userData);
    // await userRepo.markEmailAsVerified(email);

    // const [newUser] = await userRepo.getUserByEmail(email);


    return res.status(200).json({
      message: Messages.SUCCESS.EMAIL_VERIFIED,
      next_action: "MOBILE_OTP",
      email : email,
    });
  } catch (err) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN, success : false });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required" });

  try {
    const user = (await userRepo.getUserByEmail(email))?.[0];
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }

    // Check if user is Google-linked
    if (user.login_method === "GOOGLE") {
      return res.status(400).json({
        message: "This email is linked to Google. Please sign in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }

    // Check user completion status
    if (!user.is_active || user.next_action !== null) {
      switch (user.next_action) {
        case "EMAIL_VERIFICATION":
          return res.status(403).json({ 
            message: "Please verify your email to continue",
            next_action: "EMAIL_VERIFICATION",
            email: email
          });
        case "MOBILE_OTP":
          return res.status(403).json({ 
            message: "Please verify your mobile number to continue",
            next_action: "MOBILE_OTP",
            email: email
          });
        case "PROFILE_UPDATED":
          return res.status(403).json({
            message: "Please complete your profile to activate account",
            next_action: "PROFILE_UPDATED",
            email: email
          });
        default:
          return res.status(200).json({
            status: "INCOMPLETE",
            message: `Account setup incomplete. Current step: ${user.next_action}`,
            next_action: user.next_action,
            email: email
          });
      }
    }

    // Create and store token for completed user
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const token = await createAndStoreToken(user.uuid, user.email, deviceInfo);
    
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours (matching JWT)
      })
      .status(200)
      .json({
        status: "SUCCESS",
        message: "Login successful",
        next_action: null,
      });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
};

// Resend Verification Email
export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const [record] = await userRepo.getEmailVerificationByEmail(email);
  if (!record) {
    return res
      .status(400)
      .json({ message: Messages.ERROR.NOT_PENDING_VERFICATION });
  }

  if (record.is_verified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  const now = new Date();
  const updatedAt = new Date(record.updated_at);
  const diffMinutes = (now - updatedAt) / 1000 / 60;

  if (diffMinutes < 15) {
    return res.status(400).json({ message: Messages.ERROR.REVERIFIED_EMAIL });
  }

  const token = jwt.sign({ email }, secret, { expiresIn });
  await userRepo.updateEmailVerification(email, record.data, token);
  await sendEmailVerification(email, token);

  return res.status(200).json({
    message: Messages.SUCCESS.RESEND_VERIFY_LINK,
    next_action: "EMAIL_VERIFICATION",
  });
};

// Send Mobile OTP
export const sendMobileOtp = async (req, res) => {
  // Extract and clean email
  const emailValue = req.body.email;
  const email = typeof emailValue === 'object' && emailValue !== null 
    ? emailValue.email 
    : emailValue;
    
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  if (!email || !phone) {
    return res.status(400).json({ message: "Email and phone are required" });
  }

  try {
    const [user] = await userRepo.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.next_action !== "MOBILE_OTP") {
      return res
        .status(400)
        .json({ message: `Next step is: ${user.next_action}` });
    }

    await userRepo.updateUserPhoneOnly(user.uuid, phone);
    await userRepo.insertOtp(user.uuid, phone, email, otp);

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    await sendOtp(formattedPhone, otp);

    return res.status(200).json({
      message: "OTP sent to phone",
      next_action: "VERIFY_MOBILE",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

// Helper function to create and store token
const createAndStoreToken = async (userUuid, email, deviceInfo = null) => {
  const token = jwt.sign(
    { userUUID: userUuid, uuid: userUuid, email: email }, 
    secret, 
    { expiresIn }
  );
  
  // Calculate expiration time based on the same duration as the JWT
  // Convert the string "24h" to milliseconds
  const expiresInMs = expiresIn.includes('h') 
    ? parseInt(expiresIn) * 60 * 60 * 1000 
    : 24 * 60 * 60 * 1000; // Default to 24 hours
  
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  // Store token hash in database with matching expiration
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await userRepo.storeToken(userUuid, tokenHash, 'ACCESS', expiresAt, deviceInfo);
  
  return token;
};

// Verify Mobile OTP
export const verifyMobileOtp = async (req, res) => {
  // Extract and clean email
  const emailValue = req.body.email;
  const email = typeof emailValue === 'object' && emailValue !== null 
    ? emailValue.email 
    : emailValue;
    
  const { otp } = req.body;
  
  if (!email || !otp) {
    return res
      .status(400)
      .json({ message: Messages.ERROR.EMAIL_AND_OTP_ARE_REQUIRED });
  }

  try {
    const [user] = await userRepo.getUserByEmail(email);
    if (!user)
      return res.status(400).json({ message: Messages.ERROR.USER_NOT_FOUND });

    if (user.next_action !== "MOBILE_OTP") {
      return res
        .status(400)
        .json({ message: `Next step is: ${user.next_action}` });
    }

    const [latestOtp] = await userRepo.getLatestOtp(user.uuid);
    if (!latestOtp || latestOtp.otp !== otp) {
      return res
        .status(400)
        .json({ message: Messages.ERROR.INVALID_OR_EXPIRED_OTP });
    }

    const otpCreated = new Date(latestOtp.created_at);
    const diffMin = (new Date() - otpCreated) / 1000 / 60;
    if (diffMin > 10) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Update user phone and step - THIS IS CRITICAL
    await userRepo.updateUserPhoneAndStep(user.uuid, latestOtp.phone);
    await userRepo.markOtpVerified(user.uuid);

    // Create and store token
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const token = await createAndStoreToken(user.uuid, user.email, deviceInfo);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    });

    return res.status(200).json({ 
      message: Messages.SUCCESS.Mobile_VERIFIED_DONE,
      token,
      next_action: 'PROFILE_UPDATED',
      email: user.email
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};

const USERNAME_TTL_SECONDS = 86400; // 1 day
const SUGGESTION_TTL_SECONDS = 3600; // 1 hour

export const completeProfile = async (req, res) => {
  const { username  , newPassword } = req.body;
  const userUUID = req.user?.uuid; //auth-middleware
  // console.log("Body:", req.body);
  // console.log("Id :" , req.user);

  console.log(userUUID);

  console.log("User from token:", req.user);

  if (!username || !userUUID) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Username is required" });
  }

  const normalUsername = username.trim().toLowerCase();

  // Validate username format
  if (!/^[a-z0-9_]{3,20}$/.test(normalUsername)) {
    return res.status(400).json({
      message: "Invalid username format. Use 3-20 characters: a-z, 0-9, _",
    });
  }

  try {
    // Step 1: Fetch user and validate state
    const user = await userRepo.getUserByUUID(userUUID);
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Block if already set
    if (user.username) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Username already set" });
    }

    if (user.next_action !== "PROFILE_UPDATED") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: `Next step is: ${user.next_action}`,
      });
    }

    const cacheKey = `username:${normalUsername}`;

    //1.Check in redis if username exists
    const cachedUsername = await redisClient.get(cacheKey);

    if (cachedUsername === "true") {
      return await suggestUsernames(normalUsername, res);
    }

    //Check in DB if username exists
    const takenUserName = await userRepo.isUsernameTaken(normalUsername);
    if (takenUserName) {
      await redisClient.set(cacheKey, "true"); // cache
      //next time
      return await suggestUsernames(normalUsername, res);
    }

    //Jab sb shi ho
    await userRepo.updateUsername(userUUID, normalUsername);
      // await userRepo.updateNextActionByUUID(userUUID, "DASHBOARD");
    console.log("Username updated successfully:", normalUsername);
    await userRepo.updateUserNextAction(userUUID, null); // Mark as completed

    // If user wants to update password (for Google users)
    if (newPassword && user.login_method === "GOOGLE") {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await userRepo.updateUserPassword(userUUID, hashedPassword);
    }


    ///cahche krr lu taken username ko
    await redisClient.set(cacheKey, "true", { EX: USERNAME_TTL_SECONDS });

    return res.status(StatusCodes.OK).json({
      message: "Profile updated successfully",
      username: normalUsername,
      next_action: "DASHBOARD",
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      // Invalidate stale suggestion cache
      const suggestionKey = `suggestions:${normalUsername}`;
      await redisClient.del(suggestionKey);

      return await suggestUsernames(normalUsername, res);
    }

    console.error("Complete Profile Error:", err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Server error",
    });
  }
};

// Helper to suggest similar usernames
async function suggestUsernames(baseUsername, res) {
  const suggestionKey = `suggestions:${baseUsername}`;
  console.log(`[Username Suggestion] Checking Redis cache for: ${suggestionKey}`);

  try {
    const cachedSuggestions = await redisClient.get(suggestionKey);
    if (cachedSuggestions) {
      console.log(`[Username Suggestion] Found cached suggestions: ${cachedSuggestions}`);
      const parsed = JSON.parse(cachedSuggestions);
      const taken = await userRepo.findSimilarUsernames(baseUsername);
      const stillAvailable = parsed.filter((name) => !taken.includes(name));

      if (stillAvailable.length > 0) {
        return res.status(409).json({
          message: "Username already taken",
          suggestions: stillAvailable,
        });
      }

      await redisClient.del(suggestionKey);
    }

    const existingList = await userRepo.findSimilarUsernames(baseUsername);
    const fresh = generateSuggestions(baseUsername, existingList);

    await redisClient.set(suggestionKey, JSON.stringify(fresh), {
      EX: 3600, // Cache for 1 hour
    });

    return res.status(409).json({
      message: "Username already taken",
      suggestions: fresh,
    });
  } catch (err) {
    console.error('Redis Error in suggestUsernames:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Create suggestion alternatives
// Update the generateSuggestions function
function generateSuggestions(base, existingList = []) {
    const baseLower = base.toLowerCase();
    const suggestions = [];
    
    // Add number suffixes
    for (let i = 1; i <= 999; i++) {
        const suggestion = `${baseLower}${i}`;
        if (!existingList.includes(suggestion)) {
            suggestions.push(suggestion);
            if (suggestions.length >= 5) break;
        }
    }
    
    // Add random suffixes if needed
    while (suggestions.length < 5) {
        const randomSuffix = Math.floor(Math.random() * 9999);
        const suggestion = `${baseLower}${randomSuffix}`;
        if (!existingList.includes(suggestion) && !suggestions.includes(suggestion)) {
            suggestions.push(suggestion);
        }
    }
    
    return suggestions;
}

// Add logout functionality
export const logout = async (req, res) => {
  try {
    // Get token from either cookies or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      // Even if no token provided, clear any cookies that might exist
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      });
      return res.status(200).json({ message: "Logged out successfully" });
    }

    // If token exists, revoke it
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await userRepo.revokeToken(tokenHash);
    
    // Clear the cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error('Logout error:', err);
    // Always clear cookie even on error
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    return res.status(200).json({ message: "Logged out successfully" });
  }
};

// Add logout from all devices
export const logoutAllDevices = async (req, res) => {
  const userUuid = req.user?.uuid || req.user?.userUUID;
  
  if (!userUuid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await userRepo.revokeAllUserTokens(userUuid);
    return res.status(200).json({ message: "Logged out from all devices" });
  } catch (err) {
    console.error('Logout all devices error:', err);
    return res.status(500).json({ message: "Logout failed" });
  }
};
