const express = require('express');
const router = express.Router();
const { verify } = require('../../../middleware/auth');
// Controllers
const SubscribersController = require('../../../controllers/admin/subscribers');

// @route  GET admin/subscribers
// @desc   Get all subscribers
// @access Private
router.get('/', verify, SubscribersController.getSubscribers);

// @route  GET admin/subscribers/profile/:id
// @desc   Get subscriber profile data
// @access Private
router.get('/profile/:id', verify, SubscribersController.getProfile);

module.exports = router;