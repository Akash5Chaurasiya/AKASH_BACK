import mongoose from "mongoose";
import { globalProcessSchema } from "../schemas/globalProcessSchema";
import globalProcessDocument from "../entities/globalProcessDocument";

const globalProcessModel = mongoose.model<globalProcessDocument>("GlobalProcess",globalProcessSchema);

export default globalProcessModel;