import mongoose from "mongoose";
import { scanSlipSchema } from "../schemas/scanSlipSchema";

const scannedSlipModel = mongoose.model("scanedSlip", scanSlipSchema);

export default scannedSlipModel;