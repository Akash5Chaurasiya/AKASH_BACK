import mongoose, { mongo } from "mongoose";
import machineSchema from "../schemas/machineSchema";
import { machineDocument } from "../entities/machineDocument";

const machineModel = mongoose.model<machineDocument>("machine", machineSchema);
export default machineModel;
