import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import s3 from '../utils/storjClient.js';
import * as userRepo from '../utils/userQueryData.js'; // Changed to import all named exports
import razorpay from '../config/razorpay.js';
import { prices, durations } from '../utils/plans.js';

export const uploadProfilePicture = async (req, res) => {
  const userUUID = req.user?.uuid;

  if (!req.file || !userUUID) {
    return res.status(400).json({ message: 'Image file and user are required' });
  }

  const file = req.file;
  const fileName = `profile-pictures/${userUUID}-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

  try {
    const result = await s3.upload({
      Bucket: process.env.STORJ_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }).promise();

    // Create a URL that points to our own API endpoint
    const baseUrl = process.env.API_URL || 'http://localhost:4000/api';
    const imageUrl = `${baseUrl}/users/profile-image/${fileName.split('/').pop()}`;
    
    // Update DB with the proxied URL
    await userRepo.updateUserProfilePicture(userUUID, imageUrl);

    return res.status(200).json({
      message: 'Profile picture uploaded successfully',
      imageUrl,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: 'Upload failed' });
  }
};

export const updateAddress = async (req, res) => {
  const userUUID = req.user?.uuid;
  const { address_line, city, state, country, lat, lng } = req.body;

  if (!userUUID || !address_line || !lat || !lng) {
    return res.status(400).json({ message: 'Missing address or coordinates' });
  }

  try {
    await userRepo.updateUserAddress(userUUID, {
      address_line,
      city,
      state,
      country,
      lat,
      lng
    });

    return res.status(200).json({ message: 'Address updated successfully' });
  } catch (err) {
    console.error('Address update error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const downloadProfile = async (req, res) => {
  const uuid = req.user?.uuid;
  if (!uuid) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userRepo.getUserByUUID(uuid); // Fixed function call
    if (!user) return res.status(404).json({ message: 'User not found' });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=profile.pdf');

    doc.pipe(res);
    doc.fontSize(18).text('User Profile', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${user.phone || '-'}`);
    doc.text(`Username: ${user.username || '-'}`);
    doc.text(`Address: ${user.address_line || ''}, ${user.city || ''}, ${user.state || ''}, ${user.country || ''}`);
    doc.text(`Joined: ${user.created_at}`);
    doc.end();

  } catch (err) {
    console.error('Profile download error:', err);
    res.status(500).json({ message: 'Could not download profile' });
  }
};

export const createOrder = async (req, res) => {
  const { plan } = req.body;
  const user = req.user;
  
  console.log('Creating order for plan:', plan);
  
  try {
    // Verify the plan is valid
    if (!prices || !Object.keys(prices).includes(plan)) {
      console.error(`Invalid plan: ${plan}, Available plans:`, prices ? Object.keys(prices) : 'No plans defined');
      return res.status(400).json({ message: 'Invalid plan selected' });
    }
    
    console.log('Available plans:', Object.keys(prices));
    console.log('Selected plan price:', prices[plan]);
    
    const amount = prices[plan];
    
    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
      console.error('Razorpay API credentials are missing!');
      return res.status(500).json({ message: 'Payment service is not configured properly' });
    }
    
    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        user_uuid: user.uuid,
        plan
      }
    };
    
    console.log('Attempting to create Razorpay order with options:', {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt
    });
    
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created successfully:', order.id);
    
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    
    if (err.statusCode === 401) {
      return res.status(500).json({ 
        message: 'Payment provider authentication failed. Please contact support.',
        error: 'API_AUTH_ERROR'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create payment order', 
      error: err.message || 'Unknown error'
    });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
  const userUUID = req.user.uuid;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  const expiresAt = new Date(Date.now() + durations[plan]);

  try {
    await userRepo.updateUserPlan(userUUID, plan, expiresAt);
    return res.status(200).json({ message: "Payment successful & plan activated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update plan" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await userRepo.getUserByUUID(req.user.uuid);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    console.log("User data from DB:", user); // Debug log to see user data

    // Optionally, remove sensitive fields before sending
    const { password, ...userData } = user;
    
    // Make sure profile_picture is properly formatted
    if (userData.profile_picture) {
      // If using S3/Storj, ensure the URL is absolute
      if (!userData.profile_picture.startsWith('http')) {
        userData.profile_picture = `${process.env.STORAGE_URL}/${userData.profile_picture}`;
      }
    }

    res.json(userData);
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfileImage = async (req, res) => {
  const { filename } = req.params;
  const key = `profile-pictures/${filename}`;

  try {
    const params = {
      Bucket: process.env.STORJ_BUCKET,
      Key: key,
    };

    // Get the object from S3/Storj
    const data = await s3.getObject(params).promise();
    
    // Set appropriate headers
    res.set('Content-Type', data.ContentType);
    res.set('Content-Length', data.ContentLength);
    res.set('Cache-Control', 'max-age=86400'); // Cache for 1 day
    
    // Send the image data
    res.send(data.Body);
  } catch (err) {
    console.error('Error serving profile image:', err);
    
    // Return a default avatar on error
    res.redirect('/default-avatar.png');
  }
};

export const updateProfile = async (req, res) => {
  const userUUID = req.user?.uuid;
  if (!userUUID) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { name, email, username, bio, phone } = req.body;
    
    // Optional validation
    if (username) {
      // Check if username is taken by someone else
      const existingUser = await userRepo.isUsernameTaken(username);
      if (existingUser && username !== req.user.username) {
        return res.status(400).json({ 
          message: "Username already taken"
        });
      }
    }

    // Update user in database
    await userRepo.updateUserProfile(userUUID, {
      name,
      email,
      username,
      bio,
      phone
    });

    // Fetch updated user data
    const updatedUser = await userRepo.getUserByUUID(userUUID);

    // Return success with updated user data
    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        profile_picture: updatedUser.profile_picture
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const getUserNotifications = async (req, res) => {
  const userUuid = req.user?.uuid;
  if (!userUuid) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const notifications = await userRepo.getUserNotifications(userUuid);
    return res.status(200).json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markNotificationSeen = async (req, res) => {
  const userUuid = req.user?.uuid;
  const { notificationId } = req.params;
  
  if (!userUuid) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await userRepo.markNotificationAsSeen(notificationId, userUuid);
    return res.status(200).json({ message: 'Notification marked as seen' });
  } catch (err) {
    console.error('Error marking notification as seen:', err);
    return res.status(500).json({ message: 'Failed to update notification' });
  }
};