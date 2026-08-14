const mongoose = require('mongoose');

const paintingSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    medium: { type: String, trim: true },
    dimensions: { type: String, trim: true },
    yearCreated: { type: Number },
    price: { type: Number, required: true, min: 0 },
    // Minimum-length (>=1) and maximum (<=6) enforced in the controller,
    // since Mongoose array validators for length are awkward to compose
    // with the "required" flag cleanly.
    images: { type: [String], required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'sold', 'removed'],
      default: 'active',
    },

    // Admin moderation — independent of the seller's own status so a block
    // survives the seller toggling draft/active, and unblocking restores
    // whatever visibility the painting already had.
    blocked: { type: Boolean, default: false },
    blockReason: { type: String },
    blockedAt: { type: Date },
  },
  { timestamps: true }
);

paintingSchema.index({ status: 1, category: 1 });
paintingSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Painting', paintingSchema);
