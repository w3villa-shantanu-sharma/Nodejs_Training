const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// const db = require('../DB/dbconfig');
const sendEmailVerification = require('../utils/sendEmailVerification');
const sendOtp = require('../utils/sendOTP');

const userRepo = require('../utils/userQueryData');
const Messages = require('../constants/messages');
const StatusCodes = require('../constants/statusCode');
const { secret, expiresIn } = require('../config/jwt');
const redisClient = require('../utils/redisClient');

// Register User (Starts Email Verification)
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, Email and Password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_EMAIL_FORMAT });
    }

    const userUUID = uuidv4();
    const existingUser = await userRepo.getUserByEmail(email);
    if (existingUser.length) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.EMAIL_ALREADY_REGISTERED });
    }

    const existingTemp = await userRepo.getEmailVerificationByEmail(email);
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ email, userUUID }, secret, { expiresIn });

    const userData = {
        uuid: userUUID,
        name,
        email,
        password: hashedPassword
    };

    if (existingTemp.length) {
        const temp = existingTemp[0];
        const lastUpdated = new Date(temp.updated_at);
        const now = new Date();
        const diffMinutes = (now - lastUpdated) / 1000 / 60;

        if (diffMinutes < 15) {
            return res.status(400).json({ message: Messages.ERROR.REVERIFIED_EMAIL });
        }

        await userRepo.updateEmailVerification(email, userData, token);
        await sendEmailVerification(email, token);
        return res.status(200).json({ message: Messages.SUCCESS.RESEND_VERIFY_LINK });
    }

    await userRepo.insertEmailVerification({ uuid: userUUID, email, data: userData, token });
    await sendEmailVerification(email, token);
    return res.status(201).json({ message: Messages.SUCCESS.USER_REGISTERED });
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, secret);
        const email = decoded.email;

        const [verification] = await userRepo.getEmailVerificationByEmail(email);
        if (!verification || verification.token !== token) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
        }

        //  Already verified
        if (verification.is_verified) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Email already verified." });
        }

        const updatedAt = new Date(verification.updated_at);
        const now = new Date();
        const diffMinutes = (now - updatedAt) / 1000 / 60;

        if (diffMinutes > 15) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
        }

        const userData = verification.data;

        const existingUser = await userRepo.getUserByEmail(email);
        if (existingUser.length) {
            return res.status(400).json({ message: "Email already verified." });
        }

        await userRepo.insertUser(userData);
        await userRepo.markEmailAsVerified(email);

        return res.status(200).json({ message: Messages.SUCCESS.EMAIL_VERIFIED });
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;


    if (!email || !password)
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Email and password are required" });

    try {
        const user = (await userRepo.getUserByEmail(email))?.[0];
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }
        console.log(user);


        console.log('Incoming password:', password);
        console.log('Stored hash:', user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }

        // Step validation
        if (!user.is_active) {
            console.log('User is inactive. next_action =', user.next_action);

            switch (user.next_action) {
                case 'EMAIL_VERIFICATION':
                    return res.status(403).json({ message: "Please verify your email to continue" });
                case 'MOBILE_OTP':
                    return res.status(403).json({ message: "Please verify your mobile number to continue" });
                case 'PROFILE_UPDATED':
                    return res.status(403).json({ message: "Please complete your profile to activate account" });
                default:
                    return res.status(403).json({ message: `Account is inactive. Current step: ${user.next_action}` });
            }
        }

        if (user.next_action === 'PROFILE_UPDATED' && !user.username) {
            return res.status(200).json({
                status: 'IN_PROGRESS',
                message: "Login successful. Please complete your profile (username).",
                token: jwt.sign({ uuid: user.uuid }, secret, { expiresIn })
            });
        }

        // Issue token
        const token = jwt.sign({ uuid: user.uuid }, secret, { expiresIn });
        return res.status(200).json({
            status: 'SUCCESS',
            message: "Login successful",
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
    }
};

// Resend Verification Email
exports.resendVerificationEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const [record] = await userRepo.getEmailVerificationByEmail(email);
    if (!record) {
        return res.status(400).json({ message: Messages.ERROR.NOT_PENDING_VERFICATION });
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

    return res.status(200).json({ message: Messages.SUCCESS.RESEND_VERIFY_LINK });
};

// Send Mobile OTP
exports.sendMobileOtp = async (req, res) => {
    const { email, phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const [user] = await userRepo.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.next_action !== 'MOBILE_OTP') {
        return res.status(400).json({ message: `Next step is: ${user.next_action}` });
    }

    await userRepo.updateUserPhoneOnly(user.uuid, phone);
    await userRepo.insertOtp(user.uuid, phone, email, otp);

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    await sendOtp(formattedPhone, otp);

    return res.status(200).json({ message: "OTP sent to phone" });
};

// Verify Mobile OTP
exports.verifyMobileOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: Messages.ERROR.EMAIL_AND_OTP_ARE_REQUIRED });

    const [user] = await userRepo.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: Messages.ERROR.USER_NOT_FOUND });

    if (user.next_action !== 'MOBILE_OTP') {
        return res.status(400).json({ message: `Next step is: ${user.next_action}` });
    }

    const [latestOtp] = await userRepo.getLatestOtp(user.uuid);
    if (!latestOtp || latestOtp.otp !== otp) {
        return res.status(400).json({ message: Messages.ERROR.INVALID_OR_EXPIRED_OTP });
    }

    const otpCreated = new Date(latestOtp.created_at);
    const diffMin = (new Date() - otpCreated) / 1000 / 60;
    if (diffMin > 10) {
        return res.status(400).json({ message: 'OTP expired' });
    }

    await userRepo.updateUserPhoneAndStep(user.uuid, latestOtp.phone);
    await userRepo.markOtpVerified(user.uuid);

    return res.status(200).json({ message: Messages.SUCCESS.Mobile_VERIFIED_DONE });
};


const USERNAME_TTL_SECONDS = 86400; // 1 day
const SUGGESTION_TTL_SECONDS = 3600; // 1 hour

exports.completeProfile = async (req, res) => {
    const { username } = req.body;
    const userUUID = req.user?.userUUID;//auth-middleware
    // console.log("Body:", req.body);
    // console.log("Id :" , req.user);

    console.log(userUUID);

    console.log("User from token:", req.user);


    if (!username || !userUUID) {

        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Username is required" })
    }


    const normalUsername = username.trim().toLowerCase();

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(normalUsername)) {
        return res.status(400).json({ message: "Invalid username format. Use 3-20 characters: a-z, 0-9, _" });
    }


    try {

        // Step 1: Fetch user and validate state
        const user = await userRepo.getUserByUUID(userUUID);
        console.log(user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.next_action !== 'PROFILE_UPDATED') {
            console.log(user.next_action);

            return res.status(400).json({ message: `Next step is: ${user.next_action}` });
        }

        const cacheKey = `username:${normalUsername}`;


        //1.Check in redis if username exists
        const cachedUsername = await redisClient.get(cacheKey);

        if (cachedUsername === 'true') {
            return await suggestUsernames(normalUsername, res);
        }

        //Check in DB if username exists
        const takenUserName = await userRepo.isUsernameTaken(normalUsername);
        if (takenUserName) {
            await redisClient.set(cacheKey, 'true'); // cache 
            //next time
            return await suggestUsernames(normalUsername, res);

        }

        try {
            //Jab sb shi ho
            await userRepo.updateUsername(userUUID, normalUsername);
            ///cahche krr lu taken username ko
            await redisClient.set(cacheKey, 'true', { EX: USERNAME_TTL_SECONDS });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                // Invalidate stale suggestion cache
                const suggestionKey = `suggestions:${normalUsername}`;
                await redisClient.del(suggestionKey);

                return await suggestUsernames(normalUsername, res);
            }

            throw err; // rethrow other errors
        }




        return res.status(StatusCodes.OK).json({
            message: "Profile updated successfully",
            username: normalUsername
        });


    } catch (error) {
        console.error('Complete Profile Error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Server error"
        });


    }
};

// Helper to suggest similar usernames
async function suggestUsernames(baseUsername, res) {
    const suggestionKey = `suggestions:${baseUsername}`;
    console.log(`[Username Suggestion] Checking Redis cache for: ${suggestionKey}`);

    const cachedSuggestions = await redisClient.get(suggestionKey);
    if (cachedSuggestions) {
        // Optional: re-check if they are all still available
        console.log(`[Username Suggestion] Found cached suggestions: ${cachedSuggestions}`);

        const parsed = JSON.parse(cachedSuggestions);
        const taken = await userRepo.findSimilarUsernames(baseUsername);
        console.log(`[Username Suggestion] Already taken from suggestions: ${taken}`);


        const stillAvailable = parsed.filter(name => !taken.includes(name));
        console.log(`[Username Suggestion] Still available: ${stillAvailable}`);


        if (stillAvailable.length === 0) {
            await redisClient.del(suggestionKey);
            const fresh = generateSuggestions(baseUsername, taken);
            await redisClient.set(suggestionKey, JSON.stringify(fresh), { EX: SUGGESTION_TTL_SECONDS });
            return res.status(409).json({ message: "Username already taken", suggestions: fresh });
        }

        return res.status(409).json({
            message: "Username already taken",
            suggestions: stillAvailable
        });
    }
}


// Create suggestion alternatives
function generateSuggestions(base, existingList = []) {
    const suffixes = [123, 321, 99, 1, 777, Math.floor(Math.random() * 1000)];
    const suggestions = suffixes
        .map(suffix => `${base}${suffix}`)
        .filter(name => !existingList.includes(name));

    return suggestions.slice(0, 5);
}

