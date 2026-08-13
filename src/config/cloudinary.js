const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Shared multer-storage-cloudinary engine used by the single generic
 * upload endpoint (POST /api/uploads/image). Every image type in the
 * app — painting photos, seller sample work, profile images, payment
 * proof — flows through this one storage engine and folder, keeping
 * upload/transform logic in exactly one place.
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shakti-crafts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 2000, height: 2000, crop: 'limit', quality: 'auto' }],
  },
});

module.exports = { cloudinary, storage };
