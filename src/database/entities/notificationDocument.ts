import mongoose from "mongoose"
import {Document} from "mongoose"


export interface NotificationDocument extends Document{
      notification:{
            message: string,
            date: Date,
            notificationType:string,
      }[],
      employeeId:mongoose.Schema.Types.ObjectId
}