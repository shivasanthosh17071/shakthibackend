const express = require('express');
const validate = require('../middleware/validate');
const { subscribe } = require('../controllers/newsletterController');
const { subscribeValidator } = require('../validators/newsletterValidators');

const router = express.Router();

router.post('/subscribe', subscribeValidator, validate, subscribe);

module.exports = router;
