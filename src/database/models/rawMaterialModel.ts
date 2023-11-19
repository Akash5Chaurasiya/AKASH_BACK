import mongoose from "mongoose";
import RawMaterialDocument from "../entities/RawMaterialDocument";
import RawMaterialSchema from "../schemas/rawMaterialSchema";

const RawMaterialModel = mongoose.model<RawMaterialDocument>("RawMaterial",RawMaterialSchema)
export default RawMaterialModel