import mongoose, { Document } from "mongoose";

export interface machineDocument extends Document {
  machineName: string;
  code: string;
  process: [mongoose.Schema.Types.ObjectId];
  QrCode:string;
  proofPicture?: string; // Match the type with your schema
  picture?: string; // Match the type with your schema
  logs:{
    productionSlipId : mongoose.Schema.Types.ObjectId,
    time : Date
    }[]
}
