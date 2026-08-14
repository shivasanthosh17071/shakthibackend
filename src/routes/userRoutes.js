const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getMe, updateMe } = require('../controllers/userController');
const { updateMeValidator } = require('../validators/userValidators');

const router = express.Router();

router.get('/me', auth, getMe);
router.put('/me', auth, updateMeValidator, validate, updateMe);

module.exports = router;
