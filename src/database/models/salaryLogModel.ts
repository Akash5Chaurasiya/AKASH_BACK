import mongoose from "mongoose";
import { salaryLogSchema } from "../schemas/salaryLogSchema";
import { SalaryLogDocument } from "../entities/salaryLogDocument";


const SalaryLogModel = mongoose.model<SalaryLogDocument>('SalaryLog', salaryLogSchema);
export default SalaryLogModel;