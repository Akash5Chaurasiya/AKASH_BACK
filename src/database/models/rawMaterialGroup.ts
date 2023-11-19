import mongoose from "mongoose";
import rawMaterialGroupSchema from "../schemas/rawMaterialGroupSchema";
import { RawMaterialGroupDocument } from "../entities/rawMaterialGroupDocument";

 
const rawMaterialGroupModel = mongoose.model<RawMaterialGroupDocument>("RawMaterialGroup",rawMaterialGroupSchema);

export default rawMaterialGroupModel;