import mongoose from "mongoose";

const GodownSchema = new mongoose.Schema(
  {
    godownName: {
      type: String,
      unique: true,
    },
    godownCode: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export default GodownSchema;
