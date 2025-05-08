const express = require('express');
const router = express.Router();

const asyncErrorhandler = require('../middlewares/asyncErrorhandler')
const {getUsers , getUsersbyId , createUser , updateUsers} = require('../controllers/userAsyncControllers')

router.get('/' , asyncErrorhandler(getUsers));
router.get('/:id' , asyncErrorhandler(getUsersbyId));
router.post('/' , asyncErrorhandler(createUser));
router.put('/:id' , asyncErrorhandler(updateUsers));

module.exports = router;