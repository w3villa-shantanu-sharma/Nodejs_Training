const express = require('express');
const router = express.Router();

const checkNextAction = require('../middlewares/checkNextAction')
// const {getUsers , getUsersbyId , createUser , updateUsers} = require('../controllers/userControllers_db')
const authControllers = require('../controllers/authControllers');

// router.get('/' , asyncErrorhandler(getUsers));
// router.get('/:id' , asyncErrorhandler(getUsersbyId));
// router.post('/' , asyncErrorhandler(createUser));
// router.put('/:id' , asyncErrorhandler(updateUsers));

router.post('/register' ,authControllers.registerUser );
router.get('/verify-email/:token' , authControllers.verifyEmail);
router.post('/resend-verification' ,authControllers.resendVerificationEmail);

router.post('/send-otp', checkNextAction('MOBILE_OTP'), authControllers.sendMobileOtp);

// Verify OTP
router.post('/verify-otp', checkNextAction('MOBILE_OTP'), authControllers.verifyMobileOtp);

// router.post('/resume-flow', authControllers.resumeFlow);


module.exports = router;