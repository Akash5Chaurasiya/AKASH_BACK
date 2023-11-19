import mongoose from "mongoose";

export const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
    },
    code: {
      type: String,
      unique: true,
    },
    date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
