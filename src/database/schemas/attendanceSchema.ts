import mongoose, { Schema } from "mongoose";
import { Attendance } from "../entities/attendanceDocument";
export const AttendanceSchema = new Schema<Attendance>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  punches: [
    {
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      punchIn: {
        type: Date,
        default: null,
      },
      punchOut: {
        type: Date,
        default: null,
      }, 
      approvedImage: {
        type: String,
        // default: null,
      },
      punchInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },
      punchOutBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },
      status: {
        type: String,
        default: "pending",
      },
    },
  ],
  workingHours: {
    type: Number,
    default: 0,
  },
  pendingHours: {
    type: Number,
    default: 0,
  },
  totalEarning: {
    type: Number,
    default: 0,
  },
  isPresent: {
    type: Boolean,
    default: false,
  },
});
