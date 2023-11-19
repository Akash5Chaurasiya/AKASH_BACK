import mongoose from "mongoose";

const parentDeparmentSchema = new mongoose.Schema({
  departmentName: {
    type: String,
    required: true,
  },
  childDepartmentId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
  ],
  description: {
    type: String,
    required: true,
  },
});
export default parentDeparmentSchema;
