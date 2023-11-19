import mongoose from "mongoose";

export const employeeDocsSchema = new mongoose.Schema({
   employeeId:{
    type:mongoose.Schema.Types.ObjectId,
   },
   documents:{
    type:String,
   }
}, {
    timestamps: true
})