import mongoose from "mongoose";

export const globalProcessSchema = new mongoose.Schema(
  {
    processName: {
      type: String,
      unique: true,
    },
    processCode: {
      type: String,
      unique: true,
    },
    // departmentId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Department",
    // },
    shop:{
      shopId:{
        type:mongoose.Schema.Types.ObjectId
      },
      shopName:{
        type:String
      }
    }
  },
  { timestamps: true }
);
