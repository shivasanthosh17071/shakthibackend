const mongoose = require('mongoose');

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    mobile: { type: String, required: true },
  },
  { _id: false }
);

// Same shape, reused for the seller's pickup point — kept as a separate
// schema (rather than aliasing shippingAddressSchema) so the two can
// diverge later without coupling buyer and seller address validation.
const pickupAddressSchema = new mongoose.Schema(
  {
    name: { type: String },
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    mobile: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paintingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Painting', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },

    shippingAddress: { type: shippingAddressSchema, required: true },
    // Snapshot of the seller's pickup address at order time (see User.pickupAddress) —
    // captured like shippingAddress so it stays stable even if the seller edits their
    // profile later.
    pickupAddress: { type: pickupAddressSchema },

    paymentMethod: { type: String, enum: ['bank_transfer', 'upi'], required: true },
    paymentProofUrl: { type: String },
    paymentStatus: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected'],
      default: 'pending',
    },

    orderStatus: {
      type: String,
      enum: ['placed', 'payment_review', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },

    trackingNote: { type: String },
    rejectionNote: { type: String },

    statusHistory: { type: [statusHistoryEntrySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
