import mongoose from "mongoose";

export const adminSchema = new mongoose.Schema({
   name:{
    type:String,
    required:[true,"Name is required"]
   },
   email:{
    type:String,
    required:[true,"Email is required"]
   },
   password:{
    type:String,
    required:[true,"Password is required"],
    select:false
   },
   role:{
    type:String,
    default:"admin"
   }
}, {
    timestamps: true
})