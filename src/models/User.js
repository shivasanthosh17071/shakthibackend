const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    mobile: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    mobile: { type: String, required: true, trim: true },

    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },

    // Default home/shipping address, used to prefill checkout.
    address: { type: addressSchema },

    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },

    // --- Seller onboarding fields ---
    sellerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    sellerBio: { type: String, trim: true },
    sellerProfileImage: { type: String },
    portfolioLinks: { type: [String], default: [] },
    sampleWorkImages: { type: [String], default: [] },
    rejectionReason: { type: String },
    // Pickup address couriers collect sold paintings from.
    pickupAddress: { type: addressSchema },

    // Admin account suspension — checked on every request (see auth
    // middleware) so it takes effect immediately, not just on next login.
    blocked: { type: Boolean, default: false },
    blockReason: { type: String },
    blockedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.emailVerifyToken;
        delete ret.emailVerifyExpires;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
