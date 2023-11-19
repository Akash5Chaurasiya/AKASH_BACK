import { Schema } from "mongoose";
export const loginHistorySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
  },
  userInfo: {
    name: String,
    jobProfile: String,
    employeeCode: String,
    role: String,
  },
  logInTime: {
    type: Date,
  },
  ipAddress: {
    type: String,
  },
  device: {
    userAgent: {
      type: String,
    },
    platform: {
      type: String,
    },
  },
});
