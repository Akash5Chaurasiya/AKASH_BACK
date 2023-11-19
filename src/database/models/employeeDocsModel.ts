import mongoose from "mongoose";
import { employeeDocsSchema } from "../schemas/employeeDocsSchema";
import { EmployeeDocsDocument } from "../entities/employeeDocsDocument";

const EmployeeDocsModel = mongoose.model<EmployeeDocsDocument>("EmployeeDocs",employeeDocsSchema);
export default EmployeeDocsModel