import mongoose from "mongoose";
export const workingDaySchema = new mongoose.Schema({
  year: Number,
  month: [
    {
      monthName: {
        type: String,
        unique: true,
        trim: true,
      },
      workingDay: {
        type: Number,
        trim: true,
      },
      createdAt: Date,
      updatedAt: Date,
    },
  ],
});
