const { ApiError } = require('../middleware/errorHandler');

/**
 * POST /api/uploads/image (auth: any logged-in user)
 * Single generic upload endpoint used by the frontend for every image
 * type in the app (painting photos, sample work, profile images,
 * payment proof). The multer-storage-cloudinary middleware has already
 * streamed the file to Cloudinary by the time this handler runs; we
 * just need to hand back the secure URL.
 */
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No image file was provided (field name must be "image").');
    }

    res.status(201).json({ url: req.file.path });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImage };
