const PDFDocument = require('pdfkit');
const getUserDetails = require('../utils/userQueryData').getUserByUUID;
const s3 = require('../utils/storjClient');
const crypto = require('crypto');
const userRepo = require('../utils/userQueryData');
const razorpay = require('../config/razorpay');

exports.uploadProfilePicture = async (req, res) => {
  const userUUID = req.user?.uuid;

  if (!req.file || !userUUID) {
    return res.status(400).json({ message: 'Image file and user are required' });
  }

  const file = req.file;
  const fileName = `profile-pictures/${userUUID}-${Date.now()}-${file.originalname}`;

  try {
    const result = await s3.upload({
      Bucket: process.env.STORJ_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // or 'private' and use signed URLs
    }).promise();

    // Update DB with image URL
    const imageUrl = result.Location;
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

// controller/userController.js
exports.updateAddress = async (req, res) => {
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

exports.downloadProfile = async (req, res) => {
  const uuid = req.user?.uuid;
  if (!uuid) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await getUserDetails(uuid);
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

// Create Razorpay order
exports.createOrder = async (req, res) => {
  const { plan } = req.body;
  const user = req.user;

  if (!prices[plan]) {
    return res.status(400).json({ message: 'Invalid plan selected' });
  }

  const amount = prices[plan];

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

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create Razorpay order' });
  }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
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

// routes/users.js or usersController.js

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await userRepo.getUserByUUID(req.user.uuid);
    if (!user) {
      // If user not found, return a clear error
      return res.status(401).json({ message: "User not found" });
    }
    // Optionally, remove sensitive fields before sending
    const { password, ...userData } = user;
    res.json(userData);
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    res.status(500).json({ message: "Server error" });
  }
};
