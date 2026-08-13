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
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    mobile: { type: String, required: true },
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
