import mongoose, { Document } from 'mongoose';

export interface IBarCode extends Document {
  employeeId: mongoose.Schema.Types.ObjectId;
  barCodeNumber: string,
  assignedBy: mongoose.Schema.Types.ObjectId,
  proofPicture:string,
  createdAt: Date,
  updatedAt: Date,
}