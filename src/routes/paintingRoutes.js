const express = require('express');
const { listPaintings, getPainting, getArtistProfile } = require('../controllers/paintingController');
const { listPaintingsValidator } = require('../validators/paintingValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/paintings', listPaintingsValidator, validate, listPaintings);
router.get('/paintings/:id', getPainting);
router.get('/artists/:id', getArtistProfile);

module.exports = router;
