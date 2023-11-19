import mongoose from "mongoose";
import machineQrCodeSchema from "../schemas/machineQrCodeSchema";
import { MachineQRCodeDocument } from "../entities/machineQrCodeDocument";


const MachineQrCodeModel = mongoose.model<MachineQRCodeDocument>("machineQrLogs",machineQrCodeSchema);
export default MachineQrCodeModel;

