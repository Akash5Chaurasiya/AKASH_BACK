import mongoose from "mongoose";
import employeeSchema from "../schemas/employeeSchema";
import { EmployeeDocument } from "../entities/employeeDocument";



const EmployeeModel = mongoose.model<EmployeeDocument>("Employee",employeeSchema);

export default EmployeeModel;