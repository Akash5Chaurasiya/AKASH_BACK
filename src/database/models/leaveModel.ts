import mongoose from "mongoose";
import { leaveSchema } from "../schemas/leaveSchema";
import { LeaveDocument } from "../entities/leaveDocument";


const LeaveModel= mongoose.model<LeaveDocument>("Leave",leaveSchema);
export default LeaveModel;