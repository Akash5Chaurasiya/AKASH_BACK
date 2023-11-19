import mongoose, { Document } from "mongoose";

export interface workingDay extends Document {
  year: {
    year: number;
    month: [
      monthName: string,
      workingDay: number,
      createdAt: Date,
      updatedAt: Date
    ];
  };
}
