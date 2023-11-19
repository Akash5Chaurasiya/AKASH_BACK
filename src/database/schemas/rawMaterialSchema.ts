import mongoose from "mongoose";

const RawMaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
    },
    materialType: {
      type: String,
    },
    code: {
      type: String,
      unique: true,
    },
    unit: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
export default RawMaterialSchema;
