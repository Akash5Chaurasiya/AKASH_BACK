import mongoose from "mongoose";
import parentDeparmentSchema from "../schemas/parentDepartmentSchema";

const parentDepartmentModel = mongoose.model("ParentDepartment",parentDeparmentSchema);
export default parentDepartmentModel;