import mongoose ,{ Document } from "mongoose";

export interface MachineQRCodeDocument extends Document {
    machine: {
        machineName: string,
        id: mongoose.Schema.Types.ObjectId,
      };
      AssignBy:mongoose.Schema.Types.ObjectId;
      QrCode: string;
      date: Date;
      proofPicture?:string
}