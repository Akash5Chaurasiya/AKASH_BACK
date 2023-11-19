
import mongoose from "mongoose";
import { IBarCode } from "../entities/barCodeDocument";
import { barCodeSchema } from "../schemas/barCodeSchema";

const BarCode = mongoose.model<IBarCode>('BarCode', barCodeSchema);
export default BarCode