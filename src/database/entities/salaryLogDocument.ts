import mongoose, { Document } from 'mongoose';

export interface SalaryLogDocument extends Document {
  employeeId: mongoose.Schema.Types.ObjectId;
  // workingDays:number,
  // workingHours:number,
  // lunchTime:number,
  // overTime:boolean,
  // overTimeRate:number,
  salary: number,
  changedBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date,
}