import mongoose, { Schema } from "mongoose";
import { AttendanceDocs } from "../entities/attendanceDocs";
export const Attendance = new Schema<AttendanceDocs>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    approvedImage: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    approvedTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: "pending",
    },
    shift: {
      type: String,
    },
    remarks: [
      {
        remark: String,
        by: {
          type: mongoose.Schema.Types.ObjectId,
          // ref: "Employee",
        },
        createdAt: Date,
      },
    ],
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
      },
    ],
    totalWorking: {
      type: Number,
      default: 0
    },
    productiveHours: {
      type: Number
    },
    productionSlipNumbers: [{
      type: String
    }]
  },
  { timestamps: true }
);
