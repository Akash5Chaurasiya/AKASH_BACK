import mongoose from "mongoose";
import { workOrderSchema } from "../schemas/workOrderSchema";


const workOrderModel = mongoose.model("workOrder",workOrderSchema);
export default workOrderModel;