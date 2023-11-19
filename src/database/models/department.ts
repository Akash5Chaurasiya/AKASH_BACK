import mongoose from "mongoose";
import { DepartmentDocument } from "../entities/departmentDocument";
import departmentSchema from "../schemas/departmentSchema";


const departmentModel = mongoose.model<DepartmentDocument>("Department",departmentSchema)
export default departmentModel;