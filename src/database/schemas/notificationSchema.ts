import mongoose from "mongoose";


export const notificationSchema = new mongoose.Schema({
  notification: [{
    notificationType:{
      type:String
    },
    message:{
      type:String
    },
    date:{
      type:Date
    }
  }],
 employeeId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Employee"
 }
})