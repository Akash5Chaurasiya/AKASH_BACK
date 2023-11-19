import mongoose, { mongo } from "mongoose";
import ChildPartDocument from "../entities/ChildPartDocument";
import childPartSchema from "../schemas/childPartSchema";

const ChildPartModel = mongoose.model<ChildPartDocument>("ChildPart",childPartSchema)
export default ChildPartModel