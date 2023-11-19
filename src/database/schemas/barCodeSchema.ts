import mongoose from "mongoose";

export const barCodeSchema = new mongoose.Schema({
   employeeId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Employee"
   },
   barCodeNumber:{
    type:String,
   },
   assignedBy:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Employee"
   },
   proofPicture:{
      type:String
   }
  },
 {
    timestamps: true
 })