const express = require('express');
const router = express.Router();

const checkNextAction = require('../middlewares/checkNextAction')
// const {getUsers , getUsersbyId , createUser , updateUsers} = require('../controllers/userControllers_db')
const newAuthControllers = require('../controllers/newAuthController');
const fixedWindowRateLimiter = require('../middlewares/rateLimiter');
const authenticate = require('../middlewares/authenciate');

const upload = require('../middlewares/uploadMiddleware');
const userController = require('../controllers/userControllers');

const { getCurrentUser } = require('../controllers/userControllers');


// router.get('/' , asyncErrorhandler(getUsers));
// router.get('/:id' , asyncErrorhandler(getUsersbyId));
// router.post('/' , asyncErrorhandler(createUser));
// router.put('/:id' , asyncErrorhandler(updateUsers));

// Limit OTP send per email to 3 per 15 minutes
const otpLimiter = fixedWindowRateLimiter({
    keyGenerator: (req) => req.body.email || 'unknown',
    maxRequests: 3,
    windowSizeInSeconds: 15 * 60,
    message: 'Too many OTP requests. Please wait 15 minutes.'
  });
  
  // Limit email verification resend per email to 3 per 15 minutes
  const resendEmailLimiter = fixedWindowRateLimiter({
    keyGenerator: (req) => req.body.email || 'unknown',
    maxRequests: 3,
    windowSizeInSeconds: 15 * 60,
    message: 'Too many verification emails sent. Try again later.'
  });
  
  // Limit registration attempts per IP to 10 per hour
  const registerLimiter = fixedWindowRateLimiter({
    keyGenerator: (req) => req.ip,
    maxRequests: 20,
    windowSizeInSeconds: 60 * 60,
    message: 'Too many registration attempts. Try again in an hour.'
  });
  

router.post('/register' ,registerLimiter,newAuthControllers.registerUser );
router.get('/verify-email/:token' , newAuthControllers.verifyEmail);
// router.get('/verify-email' , newAuthControllers.verifyEmail);

router.post('/resend-verification' ,resendEmailLimiter,newAuthControllers.resendVerificationEmail);
router.post('/login' ,newAuthControllers.loginUser);

router.post('/send-otp', otpLimiter,checkNextAction('MOBILE_OTP'), newAuthControllers.sendMobileOtp);

// Verify OTP
router.post('/verify-otp', checkNextAction('MOBILE_OTP'), newAuthControllers.verifyMobileOtp);
router.post('/complete-profile', authenticate, newAuthControllers.completeProfile);


router.post(
  '/profile/upload',
  authenticate,
  upload.single('profilePicture'),
  userController.uploadProfilePicture
);

// routes/userRoutes.js
router.put(
  '/profile/address',
  authenticate,
  userController.updateAddress
);

router.get(
  '/profile/download',
  authenticate,
  userController.downloadProfile
);

// Add this route to serve images
router.get('/profile-image/:filename', userController.getProfileImage);

router.get('/me', authenticate, getCurrentUser);




// router.post('/resume-flow', authControllers.resumeFlow);


module.exports = router;