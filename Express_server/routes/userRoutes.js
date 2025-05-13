const express = require('express');
const router = express.Router();

const asyncErrorhandler = require('../middlewares/asyncErrorhandler')
const {getUsers , getUsersbyId , createUser , updateUsers} = require('../controllers/userControllers_db')
const authControllers = require('../controllers/authControllers');

router.get('/' , asyncErrorhandler(getUsers));
router.get('/:id' , asyncErrorhandler(getUsersbyId));
router.post('/' , asyncErrorhandler(createUser));
router.put('/:id' , asyncErrorhandler(updateUsers));

router.post('/register' ,authControllers.registerUser );
router.get('/verify-email/:token' , authControllers.verifyEmail);
router.post('/resend-verification' ,authControllers.resendVerificationEmail);

module.exports = router;