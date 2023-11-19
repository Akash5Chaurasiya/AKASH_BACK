import mongoose from "mongoose";

export const scanSlipSchema = new mongoose.Schema({
  date: String,
  shift: String,
  shop: [
    {
      shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'shop',
      },
      shopName: String,
      scannedSlip: [String],
      registered: {
        type: Number,
        default: 0
      },
      manual: {
        type: Number,
        default: 0
      },
    },
  ],
}, {
  timestamps: true,
});
