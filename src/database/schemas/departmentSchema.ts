import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  departmentName: {
    type: String,
    required: true,
  },
  parentDepartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ParentDepartment",
  },
  description: {
    type: String,
    required: true,
  },
});
export default departmentSchema;
