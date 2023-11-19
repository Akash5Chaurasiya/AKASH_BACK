import mongoose, { Document, Schema } from "mongoose";
import { EmployeeDocument } from "./employeeDocument";

export interface AttendanceDay {
  punchIn: Date;
  punchOut?: Date;
  punchInBy: mongoose.Schema.Types.ObjectId;
  punchOutBy?: mongoose.Schema.Types.ObjectId;
}

export interface AttendanceDocs extends Document {
  employeeId: Schema.Types.ObjectId | EmployeeDocument;
  date: Date;
  approvedImage?: string;
  approvedBy?: mongoose.Schema.Types.ObjectId;
  status?: String;
  shift?: String;
  remarks: String;
  punches: AttendanceDay[];
  isPresent: boolean;
  approvedTime: Date;
  totalWorking: number;
  productiveHours: number;
  productionSlipNumbers: string[];
}
