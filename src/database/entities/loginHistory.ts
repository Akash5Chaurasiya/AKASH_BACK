import mongoose, { Document } from "mongoose";
export interface loginHistory extends Document {
  user: mongoose.Schema.Types.ObjectId;
  userInfo: object;
  logInAt: Date;
  device: {
    userAgent: string;
    platform: string;
  };
  ipAddress: string;
}
