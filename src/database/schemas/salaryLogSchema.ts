import mongoose from "mongoose";

export const salaryLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    applicableMonth: {
      type: Date,
    },
    salary: {
      type: Number,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Employee",

    },
  },
  {
    timestamps: true,
  }

);
